const JSON_HEADERS = { 'Content-Type': 'application/json' };

function supabaseReady(env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(env, path, { method = 'GET', token, body, service = false } = {}) {
  const key = service ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      ...JSON_HEADERS,
      apikey: key,
      Authorization: `Bearer ${token || key}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || data?.error_description || data?.hint || `supabase_${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function authenticateUser(env, authorization) {
  if (!supabaseReady(env)) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization || '');
  if (!match) return null;
  try {
    const user = await supabaseRequest(env, '/auth/v1/user', { token: match[1] });
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

async function rpc(env, functionName, body) {
  return supabaseRequest(env, `/rest/v1/rpc/${functionName}`, { method: 'POST', body, service: true });
}

export async function reservePromotion(env, { userId, checkoutId, subtotalCents, provider = 'square' }) {
  if (!supabaseReady(env) || !userId) {
    return { checkoutId: null, subtotalCents, discountCents: 0, totalCents: subtotalCents, expiresAt: null };
  }
  const rows = await rpc(env, 'reserve_first_rental_benefit', {
    p_user_id: userId,
    p_checkout_id: checkoutId,
    p_provider: provider,
    p_subtotal_cents: subtotalCents,
    p_ttl_minutes: 30,
  });
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) throw new Error('promotion_reservation_failed');
  return {
    checkoutId: row.checkout_id,
    subtotalCents: row.subtotal_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    expiresAt: row.expires_at,
  };
}

export async function attachProviderPayment(env, checkoutId, paymentId) {
  if (!checkoutId) return;
  await rpc(env, 'attach_provider_payment', {
    p_checkout_id: checkoutId,
    p_provider_payment_id: paymentId,
  });
}

export async function releasePromotion(env, checkoutId, reason = 'failed') {
  if (!checkoutId) return;
  await rpc(env, 'release_checkout', { p_checkout_id: checkoutId, p_reason: reason });
}

export async function confirmPromotionPaid(env, provider, paymentId) {
  return rpc(env, 'confirm_checkout_paid', {
    p_provider: provider,
    p_provider_payment_id: paymentId,
  });
}

export async function expirePromotions(env) {
  if (!supabaseReady(env)) return 0;
  return rpc(env, 'expire_abandoned_checkouts', {});
}

export function promotionConfigured(env) {
  return supabaseReady(env);
}
