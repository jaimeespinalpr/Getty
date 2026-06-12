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
//    ALLOWED_ORIGIN       (var)      ej. https://jaimeespinalpr.github.io
//    GITHUB_REPO          (var)      ej. jaimeespinalpr/Getty
//    GITHUB_TOKEN         (secreto, opcional) PAT con permiso de
//                                    contenido sobre el repo, para
//                                    registrar reservas automáticamente
// ══════════════════════════════════════════════

// ⚠️ Mantener sincronizado con config.js (pricing)
const PRICING = {
  nightlyRate: 150,
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
    return nights * PRICING.nightlyRate * 100;
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
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });
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
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return json(env, await healthCheck(env));
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

    const { sourceId, package: pkg, start, end, guests, name, contact } = body;
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
        idempotency_key: crypto.randomUUID(),
        amount_money: { amount, currency: 'USD' },
        location_id: env.SQUARE_LOCATION_ID,
        note: note.slice(0, 500),
      }),
    });

    const payData = await payRes.json().catch(() => ({}));
    if (!payRes.ok || !payData.payment) {
      const detail = payData.errors?.[0]?.code || `http_${payRes.status}`;
      return json(env, { error: 'payment_failed', detail }, 402);
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

    return json(env, {
      ok: true,
      paymentId: payData.payment.id,
      receiptUrl: payData.payment.receipt_url || null,
      total: amount / 100,
      bookingRecorded,
    });
  },
};
