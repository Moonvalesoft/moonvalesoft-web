import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DEFAULT_PRICES,
  type Bought,
  buyAndPay,
  cancelRequests,
  drainJobs,
  expectError,
  get,
  getOrder,
  invoices,
  post,
  subscriptionFor,
  subscriptions,
} from './support';

/**
 * Bir üye başka üyenin sipariş, abonelik, fatura ve talebini göremez/değiştiremez.
 * Sözleşme: her zaman 404 NOT_FOUND (403 değil).
 */

let t: TestApp;
let owner: Bought & { subscriptionId: string; invoiceId: string; ticketId: string };
let other: Bought;

beforeEach(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });

  const a = await buyAndPay(t, { tag: 'sahip' });
  await drainJobs(t);
  const sub = await subscriptionFor(t, a.cookie, a.orderId);
  const inv = (await invoices(t, a.cookie))[0];
  const ticket = await post(t, '/api/tickets', { subject: 'Gizli konu', message: 'Bu talep yalnizca sahibine ait.' }, a.cookie);
  expect(ticket.status).toBe(201);
  owner = { ...a, subscriptionId: sub.id, invoiceId: inv.id, ticketId: ticket.body.id };

  // Diğer üyenin de kendi kayıtları olsun (boş liste ile "filtre çalışıyor" karışmasın)
  other = await buyAndPay(t, { tag: 'diger' });
  await post(t, '/api/tickets', { subject: 'Diger konu', message: 'Diger uyenin kendi talebi.' }, other.cookie);
});

afterEach(async () => {
  await t.close();
});

describe('Üyeler arası erişim', () => {
  it('sahibi kendi kayıtlarına erişebilir (kontrol)', async () => {
    expect((await getOrder(t, owner.cookie, owner.orderId)).status).toBe(200);
    expect((await get(t, `/api/invoices/${encodeURIComponent(owner.invoiceId)}`, owner.cookie)).status).toBe(200);
    expect((await get(t, `/api/tickets/${encodeURIComponent(owner.ticketId)}`, owner.cookie)).status).toBe(200);
  });

  it('başka üyenin siparişi → 404 NOT_FOUND', async () => {
    const r = await getOrder(t, other.cookie, owner.orderId);
    expectError(r, 404, 'NOT_FOUND');
    expect(JSON.stringify(r.body)).not.toContain(owner.slug);
  });

  it('başka üyenin aboneliği listede görünmez', async () => {
    const list = await subscriptions(t, other.cookie);
    expect(list.map((s) => s.id)).not.toContain(owner.subscriptionId);
    expect(list.map((s) => s.orderId)).toEqual([other.orderId]);
  });

  it('başka üyenin aboneliğini iptal etmek → 404 NOT_FOUND; sağlayıcıya istek gitmez, abonelik değişmez', async () => {
    expectError(
      await post(t, `/api/subscriptions/${encodeURIComponent(owner.subscriptionId)}/cancel`, undefined, other.cookie),
      404,
      'NOT_FOUND',
    );
    expect(cancelRequests(t)).toEqual([]);
    const sub = await subscriptionFor(t, owner.cookie, owner.orderId);
    expect(sub.cancelAtPeriodEnd).toBe(false);
    expect(sub.status).toBe('active');
  });

  it('başka üyenin faturası listede görünmez ve doğrudan istenince 404 NOT_FOUND', async () => {
    const list = await invoices(t, other.cookie);
    expect(list.map((i) => i.id)).not.toContain(owner.invoiceId);
    expect(list.every((i) => i.orderId === other.orderId)).toBe(true);
    expectError(await get(t, `/api/invoices/${encodeURIComponent(owner.invoiceId)}`, other.cookie), 404, 'NOT_FOUND');
  });

  it('başka üyenin destek talebi listede görünmez ve doğrudan istenince 404 NOT_FOUND', async () => {
    const list = await get(t, '/api/tickets', other.cookie);
    expect(list.status).toBe(200);
    expect(list.body.map((x: any) => x.id)).not.toContain(owner.ticketId);
    const r = await get(t, `/api/tickets/${encodeURIComponent(owner.ticketId)}`, other.cookie);
    expectError(r, 404, 'NOT_FOUND');
    expect(JSON.stringify(r.body)).not.toContain('Gizli konu');
  });

  it('oturumsuz istekler 401 UNAUTHENTICATED (kayıt verisi dönmez)', async () => {
    expectError(await getOrder(t, undefined, owner.orderId), 401, 'UNAUTHENTICATED');
    expectError(await get(t, `/api/invoices/${encodeURIComponent(owner.invoiceId)}`), 401, 'UNAUTHENTICATED');
    expectError(await get(t, `/api/tickets/${encodeURIComponent(owner.ticketId)}`), 401, 'UNAUTHENTICATED');
    expectError(await post(t, `/api/subscriptions/${encodeURIComponent(owner.subscriptionId)}/cancel`), 401, 'UNAUTHENTICATED');
  });
});
