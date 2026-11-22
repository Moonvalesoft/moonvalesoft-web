import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DAY,
  DEFAULT_PRICES,
  EVIL_ORIGIN,
  buyAndPay,
  cancelRequests,
  drainJobs,
  expectError,
  get,
  makeEvent,
  member,
  post,
  provisionerCalls,
  sendEvent,
  subscriptionFor,
  subscriptions,
} from './support';

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });
});

afterEach(async () => {
  await t.close();
});

describe('GET /api/subscriptions', () => {
  it('oturumsuz istek 401 UNAUTHENTICATED', async () => {
    expectError(await get(t, '/api/subscriptions'), 401, 'UNAUTHENTICATED');
  });

  it('yeni üyenin aboneliği yoktur', async () => {
    const m = await member(t);
    expect(await subscriptions(t, m.cookie)).toEqual([]);
  });

  it('ödemeden sonra abonelik sözleşmedeki alanlarla listelenir', async () => {
    const b = await buyAndPay(t, { seats: 4 });
    const list = await subscriptions(t, b.cookie);
    expect(list.length).toBe(1);
    const s = list[0];
    expect(s).toMatchObject({
      orderId: b.orderId,
      planId: 'randevu-aylik',
      product: 'randevu',
      seats: 4,
      status: 'active',
      cancelAtPeriodEnd: false,
      companySlug: b.slug,
    });
    expect(s.id).toBeTruthy();
    expect(Number.isNaN(Date.parse(s.currentPeriodEnd))).toBe(false);
    expect(['pending', 'done']).toContain(s.provisioning);
  });

  it('firma kurulumu işlenmeden önce provisioning pending, işlendikten sonra done', async () => {
    const b = await buyAndPay(t);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('pending');
    await drainJobs(t);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('done');
  });
});

describe('POST /api/subscriptions/:id/cancel', () => {
  it('sağlayıcıdan dönem sonunda iptal ister; 200 ve cancelAtPeriodEnd: true; abonelik hemen iptal olmaz', async () => {
    const b = await buyAndPay(t);
    await drainJobs(t);
    const sub = await subscriptionFor(t, b.cookie, b.orderId);

    const r = await post(t, `/api/subscriptions/${encodeURIComponent(sub.id)}/cancel`, undefined, b.cookie);
    expect(r.status).toBe(200);

    expect(cancelRequests(t)).toContain(String(b.orderId));
    const after = await subscriptionFor(t, b.cookie, b.orderId);
    expect(after.cancelAtPeriodEnd).toBe(true);
    expect(after.status).toBe('active');

    await drainJobs(t);
    expect(provisionerCalls(t, 'freezeTenant', b.slug)).toEqual([]);
  });

  it('asıl iptal subscription.canceled olayıyla olur: canceled ve firma dondurulur', async () => {
    const b = await buyAndPay(t);
    await drainJobs(t);
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    await post(t, `/api/subscriptions/${encodeURIComponent(sub.id)}/cancel`, undefined, b.cookie);

    await sendEvent(t, makeEvent('subscription.canceled', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus }));
    await drainJobs(t);

    expect((await subscriptionFor(t, b.cookie, b.orderId)).status).toBe('canceled');
    expect(provisionerCalls(t, 'freezeTenant', b.slug).length).toBe(1);
  });

  it('oturumsuz iptal 401 ve sağlayıcıya istek gitmez', async () => {
    const b = await buyAndPay(t);
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expectError(await post(t, `/api/subscriptions/${encodeURIComponent(sub.id)}/cancel`), 401, 'UNAUTHENTICATED');
    expect(cancelRequests(t)).toEqual([]);
  });

  it('yabancı Origin ile iptal 403 BAD_ORIGIN ve sağlayıcıya istek gitmez', async () => {
    const b = await buyAndPay(t);
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expectError(
      await post(t, `/api/subscriptions/${encodeURIComponent(sub.id)}/cancel`, undefined, b.cookie, { origin: EVIL_ORIGIN }),
      403,
      'BAD_ORIGIN',
    );
    expect(cancelRequests(t)).toEqual([]);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).cancelAtPeriodEnd).toBe(false);
  });
});
