import {
  authenticateUser,
  attachProviderPayment,
  confirmPromotionPaid,
  expirePromotions,
  promotionConfigured,
  releasePromotion,
  reservePromotion,
} from './promotion.js';

// ══════════════════════════════════════════════
//  Ghetty Motor-Home — worker.js (Cloudflare Worker)
//
//  Mini-servidor de pagos: recibe el token de tarjeta que genera
//  el Square Web Payments SDK en la web, recalcula el precio en el
//  servidor (nunca se confía en el total que manda el navegador),
//  verifica disponibilidad y crea el pago con la Square Payments API.
//  Si el pago se aprueba y hay GITHUB_TOKEN configurado, registra la
//  reserva en bookings.json — eso dispara el workflow de sincronización
//  que bloquea las fechas en la web y en Airbnb automáticamente.
//
//  Variables (Cloudflare → Worker → Settings → Variables):
//    SQUARE_ACCESS_TOKEN  (secreto)  Token de acceso de Square
//    SQUARE_LOCATION_ID   (var)      Location ID de Square
//    SQUARE_ENV           (var)      'sandbox' o 'production'
//    ALLOWED_ORIGIN       (var)      ej. https://ghettypr.com
//    GITHUB_REPO          (var)      ej. jaimeespinalpr/Getty
//    GITHUB_TOKEN         (secreto, opcional) PAT con permiso de
//                                    contenido sobre el repo, para
//                                    registrar reservas automáticamente
//    RESEND_API_KEY       (secreto, opcional) para enviar el recibo por email
//    RESEND_FROM          (var, opcional)  remitente del recibo,
//                                    ej. Ghetty Motor-Home <bookings@ghettypr.com>
//    RESEND_REPLY_TO      (var, opcional)  inbox para respuestas
//                                    (por defecto info@ghettypr.com)
//    WHATSAPP_TOKEN          (secreto, opcional) token permanente de la
//                                    WhatsApp Cloud API (Meta)
//    WHATSAPP_PHONE_NUMBER_ID (var, opcional) ID del número emisor de WhatsApp
//    WHATSAPP_TO             (var, opcional) número del dueño que recibe el
//                                    aviso, formato internacional sin +, ej. 1787XXXXXXX
//    WHATSAPP_TEMPLATE       (var, opcional) nombre de la plantilla aprobada
//                                    (por defecto 'nueva_reserva')
//    WHATSAPP_LANG           (var, opcional) idioma de la plantilla (por defecto 'es')
// ══════════════════════════════════════════════

// ⚠️ Mantener sincronizado con config.js (pricing)
const PRICING = {
  nightlyRate: 120,
  cleaningFee: 40,
  exp6h: { perPerson: 79, group: 450 },
  exp8h: { perPerson: 100, group: 600 },
  maxGuests: 6,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function nightsBetween(start, end) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
}

/** Recalcula el total en centavos. Devuelve null si los datos no son válidos. */
export function computeAmountCents(pkg, start, end, guests) {
  if (!DATE_RE.test(start || '')) return null;
  if (!Number.isInteger(guests) || guests < 1 || guests > PRICING.maxGuests) return null;

  if (pkg === 'night') {
    if (!DATE_RE.test(end || '')) return null;
    const nights = nightsBetween(start, end);
    if (!Number.isInteger(nights) || nights < 1 || nights > 60) return null;
    return (nights * PRICING.nightlyRate + PRICING.cleaningFee) * 100;
  }
  if (pkg === 'exp6h' || pkg === 'exp8h') {
    const p = PRICING[pkg];
    return Math.min(guests * p.perPerson, p.group) * 100;
  }
  return null;
}

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Verifica la firma HMAC-SHA256 oficial de webhooks de Square. */
async function verifySquareWebhook(env, rawBody, signature) {
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.SQUARE_WEBHOOK_URL || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(env.SQUARE_WEBHOOK_URL + rawBody)
  );
  const expected = bytesToBase64(new Uint8Array(signed));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

async function handleSquareWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-square-hmacsha256-signature') || '';
  if (!(await verifySquareWebhook(env, rawBody, signature))) {
    return json(env, { error: 'invalid_webhook_signature' }, 401);
  }
  let event;
  try { event = JSON.parse(rawBody); } catch { return json(env, { error: 'invalid_json' }, 400); }
  const payment = event?.data?.object?.payment;
  if (event?.type === 'payment.updated' && payment?.id && payment?.status === 'COMPLETED') {
    try {
      if (payment.reference_id) {
        await attachProviderPayment(env, payment.reference_id, payment.id).catch((error) => {
          if (!String(error.message).includes('checkout_not_reservable')) throw error;
        });
      }
      await confirmPromotionPaid(env, 'square', payment.id);
    } catch (error) {
      if (!String(error.message).includes('checkout_not_found')) throw error;
    }
  }
  return json(env, { ok: true });
}

/** Rechaza el pago si alguna noche del rango ya está ocupada. */
async function datesAreFree(env, start, end) {
  if (!env.GITHUB_REPO) return true;
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${env.GITHUB_REPO}/main/availability.json`,
      { headers: { 'User-Agent': 'ghetty-pay' } }
    );
    if (!res.ok) return true; // si no se puede leer, no bloqueamos el cobro
    const booked = new Set((await res.json()).booked || []);
    const d = new Date(start + 'T00:00:00Z');
    const stop = new Date((end || start) + 'T00:00:00Z');
    do {
      if (booked.has(d.toISOString().slice(0, 10))) return false;
      d.setUTCDate(d.getUTCDate() + 1);
    } while (d < stop);
    return true;
  } catch {
    return true;
  }
}

/** Registra la reserva en bookings.json (dispara la sincronización con Airbnb). */
async function recordBooking(env, booking) {
  const api = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/bookings.json`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'User-Agent': 'ghetty-pay',
    Accept: 'application/vnd.github+json',
  };
  const cur = await fetch(api, { headers });
  if (!cur.ok) throw new Error(`leer bookings.json: ${cur.status}`);
  const file = await cur.json();
  const data = JSON.parse(atob(file.content.replace(/\n/g, '')));
  data.bookings = data.bookings || [];
  data.bookings.push(booking);
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + '\n')));
  const res = await fetch(api, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `chore: reserva web ${booking.id} (pago Square)`,
      content,
      sha: file.sha,
    }),
  });
  if (!res.ok) throw new Error(`escribir bookings.json: ${res.status}`);
}

/** Envía el recibo por correo usando Resend. Solo si RESEND_API_KEY está configurado. */
async function sendReceiptEmail(env, { to, name, pkg, start, end, guests, total, paymentId, receiptUrl, lang }) {
  if (!env.RESEND_API_KEY || !to || !to.includes('@')) return false;

  const isEs = (lang || 'es') === 'es';
  const pkgNames = {
    night: isEs ? 'Renta por noche' : 'Nightly Rental',
    exp6h: isEs ? 'Experiencia Tropical (6h)' : 'Tropical Experience (6h)',
    exp8h: isEs ? 'Experiencia Isla Completa (8h)' : 'Full Island Experience (8h)',
  };
  const pkgLabel = pkgNames[pkg] || pkg;
  const isNight = pkg === 'night';
  const dateRow = isEs
    ? `<tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0 10px 24px;border-bottom:1px solid #f0f0f0;width:42%">${isNight ? 'Llegada' : 'Fecha'}</td><td style="font-weight:600;font-size:15px;text-align:right;padding:10px 24px 10px 0;border-bottom:1px solid #f0f0f0">${start}</td></tr>${isNight ? `<tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0 10px 24px;border-bottom:1px solid #f0f0f0">Salida</td><td style="font-weight:600;font-size:15px;text-align:right;padding:10px 24px 10px 0;border-bottom:1px solid #f0f0f0">${end}</td></tr>` : ''}`
    : `<tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0 10px 24px;border-bottom:1px solid #f0f0f0;width:42%">${isNight ? 'Check-in' : 'Date'}</td><td style="font-weight:600;font-size:15px;text-align:right;padding:10px 24px 10px 0;border-bottom:1px solid #f0f0f0">${start}</td></tr>${isNight ? `<tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0 10px 24px;border-bottom:1px solid #f0f0f0">Check-out</td><td style="font-weight:600;font-size:15px;text-align:right;padding:10px 24px 10px 0;border-bottom:1px solid #f0f0f0">${end}</td></tr>` : ''}`;

  const subject = isEs
    ? `✅ Reserva confirmada — Ghetty Motor-Home`
    : `✅ Booking confirmed — Ghetty Motor-Home`;

  const html = `<!DOCTYPE html><html lang="${isEs ? 'es' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0a2342 0%,#1a5276 100%);padding:40px 32px 32px;text-align:center">
    <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:14px;padding:8px;margin-bottom:20px">
      <img src="https://ghettypr.com/assets/logo.png" alt="Ghetty" width="60" height="60" style="display:block;border-radius:10px"/>
    </div>
    <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:#10b981;border-radius:50%;margin-bottom:16px">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h1 style="margin:0 0 6px;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.02em">${isEs ? '¡Reserva confirmada!' : 'Booking confirmed!'}</h1>
    <p style="margin:0;color:rgba(255,255,255,0.65);font-size:13px;letter-spacing:0.02em">Ghetty Motor-Home · Puerto Rico</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:28px 32px 0">
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6">${isEs ? `Hola <strong>${name}</strong>, tu reserva está confirmada y tu pago ha sido procesado exitosamente.` : `Hi <strong>${name}</strong>, your booking is confirmed and your payment has been successfully processed.`}</p>
  </td></tr>

  <!-- Details table -->
  <tr><td style="padding:20px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0">
      <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:12px 0 12px 32px;border-bottom:1px solid #f0f0f0;width:42%">${isEs ? 'Paquete' : 'Package'}</td><td style="font-weight:600;font-size:15px;text-align:right;padding:12px 32px 12px 0;border-bottom:1px solid #f0f0f0">${pkgLabel}</td></tr>
      ${dateRow}
      <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:12px 0 12px 32px;border-bottom:1px solid #f0f0f0">${isEs ? 'Personas' : 'Guests'}</td><td style="font-weight:600;font-size:15px;text-align:right;padding:12px 32px 12px 0;border-bottom:1px solid #f0f0f0">${guests}</td></tr>
      ${isNight ? `<tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:12px 0 12px 32px;border-bottom:1px solid #f0f0f0">${isEs ? 'Cargo de limpieza' : 'Cleaning fee'}</td><td style="font-weight:600;font-size:15px;text-align:right;padding:12px 32px 12px 0;border-bottom:1px solid #f0f0f0">$${PRICING.cleaningFee.toFixed(2)} USD</td></tr>` : ''}
      <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:12px 0 12px 32px">${isEs ? 'Total cobrado' : 'Total charged'}</td><td style="font-weight:800;font-size:16px;text-align:right;padding:12px 32px 12px 0;color:#0a2342">$${(total || 0).toFixed(2)} USD</td></tr>
    </table>
  </td></tr>

  <!-- Confirmation # -->
  <tr><td style="padding:16px 32px 0">
    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px">${isEs ? 'N.º de confirmación' : 'Confirmation #'}</p>
    <p style="margin:0;font-family:monospace;font-size:13px;color:#374151;word-break:break-all">${paymentId}</p>
  </td></tr>

  <!-- Receipt button -->
  ${receiptUrl ? `<tr><td style="padding:24px 32px 0;text-align:center"><a href="${receiptUrl}" style="display:inline-block;background:linear-gradient(135deg,#0a2342,#1a5276);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px">${isEs ? 'Ver recibo de Square' : 'View Square receipt'}</a></td></tr>` : ''}

  <!-- Footer -->
  <tr><td style="padding:28px 32px 36px;text-align:center;border-top:1px solid #f0f0f0;margin-top:24px">
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280">${isEs ? '¿Preguntas? Escríbenos en Instagram' : 'Questions? Reach us on Instagram'}</p>
    <a href="https://www.instagram.com/ghettymotorhome/" style="color:#1a5276;font-weight:700;font-size:13px;text-decoration:none">@ghettymotorhome</a>
    <p style="margin:16px 0 0;font-size:11px;color:#d1d5db">© ${new Date().getFullYear()} Ghetty Motor-Home · Puerto Rico</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  try {
    const fromAddr = env.RESEND_FROM || 'Ghetty Motor-Home <onboarding@resend.dev>';
    const replyTo = env.RESEND_REPLY_TO || 'info@ghettypr.com';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddr, to: [to], reply_to: replyTo, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Avisa al dueño por WhatsApp (Meta Cloud API) cuando entra una reserva.
 * Usa una plantilla aprobada con 6 parámetros en el cuerpo, en este orden:
 *   {{1}} paquete  {{2}} fecha(s)  {{3}} personas
 *   {{4}} total    {{5}} cliente   {{6}} contacto
 * Si falta alguna variable de entorno, no hace nada (devuelve false).
 */
async function sendWhatsAppNotification(env, { pkg, start, end, guests, total, name, contact }) {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_TO) return false;

  // Meta espera solo dígitos (sin +, espacios ni guiones)
  const toNum = String(env.WHATSAPP_TO).replace(/[^\d]/g, '');
  if (!toNum) return false;

  const pkgNames = {
    night: 'Renta por noche',
    exp6h: 'Experiencia Tropical (6h)',
    exp8h: 'Experiencia Isla Completa (8h)',
  };
  const dateText = pkg === 'night' ? `${start} → ${end}` : start;
  const params = [
    pkgNames[pkg] || pkg,
    dateText,
    String(guests),
    `$${Number(total || 0).toFixed(2)} USD`,
    String(name || '—').slice(0, 80),
    String(contact || '—').slice(0, 60),
  ].map(text => ({ type: 'text', text: text || '—' }));

  // Timeout para no colgar el checkout si Meta responde lento o está caído
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toNum,
          type: 'template',
          template: {
            name: env.WHATSAPP_TEMPLATE || 'nueva_reserva',
            language: { code: env.WHATSAPP_LANG || 'es' },
            components: [{ type: 'body', parameters: params }],
          },
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      console.error('WhatsApp notif falló:', await res.text().catch(() => res.status));
      return false;
    }
    return true;
  } catch (e) {
    console.error('WhatsApp notif error:', e.message);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Auto-diagnóstico: verifica el token contra Square SIN exponerlo. */
async function healthCheck(env) {
  const out = {
    env: env.SQUARE_ENV || '(no definido)',
    tokenConfigured: Boolean(env.SQUARE_ACCESS_TOKEN),
    tokenLength: (env.SQUARE_ACCESS_TOKEN || '').length,
    tokenHasWhitespace: /\s/.test(env.SQUARE_ACCESS_TOKEN || ''),
    configuredLocation: env.SQUARE_LOCATION_ID || '(no definido)',
  };
  if (!out.tokenConfigured) {
    out.squareAuth = 'sin_token';
    return out;
  }
  const base = env.SQUARE_ENV === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
  try {
    const res = await fetch(`${base}/v2/locations`, {
      headers: {
        Authorization: `Bearer ${(env.SQUARE_ACCESS_TOKEN || '').trim()}`,
        'Square-Version': '2025-10-16',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      out.squareAuth = data.errors?.[0]?.code || `http_${res.status}`;
    } else {
      out.squareAuth = 'ok';
      out.locations = (data.locations || []).map((l) => ({ id: l.id, name: l.name, status: l.status }));
      out.locationMatch = (data.locations || []).some((l) => l.id === env.SQUARE_LOCATION_ID);
    }
  } catch (e) {
    out.squareAuth = `fetch_error: ${e.message}`;
  }
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }
    if (request.method === 'POST' && url.pathname === '/webhooks/square') {
      return handleSquareWebhook(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/maintenance/expire-promotions') {
      if (!env.MAINTENANCE_SECRET || request.headers.get('Authorization') !== `Bearer ${env.MAINTENANCE_SECRET}`) {
        return json(env, { error: 'unauthorized' }, 401);
      }
      return json(env, { ok: true, expired: await expirePromotions(env) });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      const health = await healthCheck(env);
      health.promotionConfigured = promotionConfigured(env);
      return json(env, health);
    }
    if (request.method !== 'POST') {
      return json(env, { error: 'method_not_allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(env, { error: 'invalid_json' }, 400);
    }

    const { sourceId, package: pkg, start, end, guests, name, email, contact, lang } = body;
    if (!sourceId || typeof sourceId !== 'string') {
      return json(env, { error: 'missing_card_token' }, 400);
    }
    const amount = computeAmountCents(pkg, start, end, parseInt(guests, 10));
    if (amount === null) {
      return json(env, { error: 'invalid_booking_data' }, 400);
    }
    if (!(await datesAreFree(env, start, pkg === 'night' ? end : start))) {
      return json(env, { error: 'dates_unavailable' }, 409);
    }

    // El subtotal se calcula arriba exclusivamente en el servidor. Si hay una
    // sesión Supabase válida, la base de datos reserva el beneficio con bloqueo
    // de fila; dos checkouts simultáneos no pueden obtener el mismo descuento.
    const user = await authenticateUser(env, request.headers.get('Authorization'));
    const checkoutId = crypto.randomUUID();
    let promotion;
    try {
      promotion = await reservePromotion(env, {
        userId: user?.id || null,
        checkoutId,
        subtotalCents: amount,
        provider: 'square',
      });
    } catch (error) {
      console.error('No se pudo reservar el beneficio:', error.message);
      return json(env, { error: 'promotion_reservation_failed' }, 503);
    }
    const chargeAmount = promotion.totalCents;

    const base = env.SQUARE_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    const note = `Ghetty ${pkg} ${start}${pkg === 'night' ? `→${end}` : ''} · ${guests}p · ${String(name || '').slice(0, 60)} · ${String(contact || '').slice(0, 60)}`;

    const payRes = await fetch(`${base}/v2/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(env.SQUARE_ACCESS_TOKEN || '').trim()}`,
        'Content-Type': 'application/json',
        'Square-Version': '2025-10-16',
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: promotion.checkoutId || checkoutId,
        amount_money: { amount: chargeAmount, currency: 'USD' },
        location_id: env.SQUARE_LOCATION_ID,
        reference_id: promotion.checkoutId || undefined,
        note: note.slice(0, 500),
      }),
    });

    const payData = await payRes.json().catch(() => ({}));
    if (!payRes.ok || !payData.payment) {
      const detail = payData.errors?.[0]?.code || `http_${payRes.status}`;
      // Square no creó el pago: liberar el beneficio inmediatamente.
      await releasePromotion(env, promotion.checkoutId, 'failed').catch((e) =>
        console.error('No se pudo liberar el beneficio:', e.message)
      );
      return json(env, { error: 'payment_failed', detail }, 402);
    }

    // Vincula el pago al checkout. Si Square devuelve COMPLETED en esta
    // respuesta autenticada servidor-a-servidor, confirma el beneficio aquí.
    // El webhook firmado conserva el mismo comportamiento como respaldo.
    if (promotion.checkoutId) {
      try {
        await attachProviderPayment(env, promotion.checkoutId, payData.payment.id);
        if (payData.payment.status === 'COMPLETED') {
          await confirmPromotionPaid(env, 'square', payData.payment.id);
        }
      } catch (error) {
        console.error('No se pudo actualizar el beneficio después del pago:', error.message);
      }
    }

    // Registrar la reserva para bloquear fechas (web + Airbnb)
    let bookingRecorded = false;
    if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
      const booking = {
        id: `web-${Date.now()}`,
        start,
        // Las experiencias de día bloquean su fecha (el camper está en uso)
        end: pkg === 'night' ? end : start,
        source: 'web',
        package: pkg,
        name: String(name || '').slice(0, 80),
        payment_id: payData.payment.id,
      };
      try {
        await recordBooking(env, booking);
        bookingRecorded = true;
      } catch (e) {
        // El pago ya se hizo: no fallamos, el dueño puede registrarla a mano
        console.error('No se pudo registrar la reserva:', e.message);
      }
    }

    const receiptUrl = payData.payment.receipt_url || null;
    const emailSent = await sendReceiptEmail(env, {
      to: email || '',
      name: String(name || '').slice(0, 80),
      pkg,
      start,
      end,
      guests: parseInt(guests, 10),
      total: chargeAmount / 100,
      paymentId: payData.payment.id,
      receiptUrl,
      lang: lang || 'es',
    });

    // Aviso al dueño por WhatsApp (no bloquea ni falla el pago si no está configurado)
    const whatsappSent = await sendWhatsAppNotification(env, {
      pkg,
      start,
      end,
      guests: parseInt(guests, 10),
      total: chargeAmount / 100,
      name: String(name || '').slice(0, 80),
      contact: contact || email || '',
    });

    return json(env, {
      ok: true,
      paymentId: payData.payment.id,
      receiptUrl,
      total: chargeAmount / 100,
      subtotal: promotion.subtotalCents / 100,
      discount: promotion.discountCents / 100,
      benefitReserved: promotion.discountCents > 0,
      bookingRecorded,
      emailSent,
      whatsappSent,
    });
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      expirePromotions(env).catch((error) =>
        console.error('No se pudieron expirar promociones:', error.message)
      )
    );
  },
};