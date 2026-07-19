import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateUser,
  attachProviderPayment,
  confirmPromotionPaid,
  reservePromotion,
  releasePromotion,
} from '../promotion.js';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-public',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
};

function mockFetch(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => { globalThis.fetch = original; };
}

test('un usuario no autenticado nunca recibe descuento', async () => {
  const result = await reservePromotion({}, {
    userId: null,
    checkoutId: crypto.randomUUID(),
    subtotalCents: 12900,
  });
  assert.deepEqual(result, {
    checkoutId: null,
    subtotalCents: 12900,
    discountCents: 0,
    totalCents: 12900,
    expiresAt: null,
  });
});

test('valida el JWT con Supabase Auth, no confía en un user_id del navegador', async () => {
  const restore = mockFetch(async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/user');
    assert.equal(options.headers.apikey, 'anon-public');
    assert.equal(options.headers.Authorization, 'Bearer valid-jwt');
    return Response.json({ id: '11111111-1111-4111-8111-111111111111', email: 'user@example.com' });
  });
  try {
    const user = await authenticateUser(env, 'Bearer valid-jwt');
    assert.equal(user.id, '11111111-1111-4111-8111-111111111111');
  } finally { restore(); }
});

test('reserva por RPC con service role y usa únicamente el subtotal del servidor', async () => {
  const checkoutId = crypto.randomUUID();
  const restore = mockFetch(async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/rest/v1/rpc/reserve_first_rental_benefit');
    assert.equal(options.headers.Authorization, 'Bearer service-secret');
    const body = JSON.parse(options.body);
    assert.equal(body.p_checkout_id, checkoutId);
    assert.equal(body.p_subtotal_cents, 12900);
    assert.equal(body.p_provider, 'square');
    return Response.json([{
      checkout_id: checkoutId,
      subtotal_cents: 12900,
      discount_cents: 500,
      total_cents: 12400,
      expires_at: '2026-07-12T12:30:00Z',
    }]);
  });
  try {
    const result = await reservePromotion(env, {
      userId: '11111111-1111-4111-8111-111111111111',
      checkoutId,
      subtotalCents: 12900,
      provider: 'square',
    });
    assert.equal(result.discountCents, 500);
    assert.equal(result.totalCents, 12400);
  } finally { restore(); }
});

test('vincula el payment id y libera una reserva fallida mediante RPC', async () => {
  const checkoutId = crypto.randomUUID();
  const calls = [];
  const restore = mockFetch(async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    return Response.json(null);
  });
  try {
    await attachProviderPayment(env, checkoutId, 'square-payment-1');
    await releasePromotion(env, checkoutId, 'failed');
    assert.match(calls[0][0], /attach_provider_payment$/);
    assert.equal(calls[0][1].p_provider_payment_id, 'square-payment-1');
    assert.match(calls[1][0], /release_checkout$/);
    assert.equal(calls[1][1].p_reason, 'failed');
  } finally { restore(); }
});

test('confirma el canje solo mediante el payment id verificado por el proveedor', async () => {
  let call;
  const restore = mockFetch(async (_url, options) => {
    call = { headers: options.headers, body: JSON.parse(options.body) };
    return Response.json(null);
  });
  try {
    await confirmPromotionPaid(env, 'square', 'payment-completed-1');
    assert.equal(call.body.p_provider, 'square');
    assert.equal(call.body.p_provider_payment_id, 'payment-completed-1');
    assert.equal(call.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
  } finally { restore(); }
});
