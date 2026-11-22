import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DAY,
  HOUR,
  DEFAULT_PRICES,
  EVIL_ORIGIN,
  allMails,
  buyAndPay,
  buyRandevu,
  drainJobs,
  expectError,
  getOrder,
  invoices,
  makeEvent,
  mailsNotTo,
  provisionerCalls,
  sameInstant,
  sendEvent,
  sendRaw,
  signed,
  subscriptionFor,
  at,
} from './support';

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });
});

afterEach(async () => {
  await t.close();
});

/** Siparişin hiç ödenmemiş gibi durduğunu doğrular. */
async function expectUntouched(cookie: string, orderId: string, slug: string) {
  const o = await getOrder(t, cookie, orderId);
  expect(o.body.status).toBe('pending');
  expect(await invoices(t, cookie)).toEqual([]);
  const sub = await subscriptionFor(t, cookie, orderId);
  if (sub) expect(sub.status).not.toBe('active');
  await drainJobs(t);
  expect(provisionerCalls(t, 'createTenant', slug)).toEqual([]);
}

describe('İmza', () => {
  it('imzalı gövdede başka siparişin kimliği yazılırsa 401 INVALID_SIGNATURE ve hiçbir şey değişmez', async () => {
    const attacker = await buyRandevu(t, { tag: 'saldirgan' });
    const victim = await buyRandevu(t, { tag: 'kurban' });
    const s = await signed(t, makeEvent('payment.succeeded', attacker.orderId, { amountKurus: victim.amountKurus }));
    expect(s.body.includes(attacker.orderId), 'imzalı gövdede orderId yok; kurcalama testi kurulamadı').toBe(true);

    const tampered = s.body.split(attacker.orderId).join(victim.orderId);
    expectError(await sendRaw(t, tampered, s.headers), 401, 'INVALID_SIGNATURE');

    await expectUntouched(victim.cookie, victim.orderId, victim.slug);
    await expectUntouched(attacker.cookie, attacker.orderId, attacker.slug);
  });

  it('imza başlıkları olmadan gelen olay 401 INVALID_SIGNATURE', async () => {
    const b = await buyRandevu(t);
    const s = await signed(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }));
    expectError(await sendRaw(t, s.body, { 'content-type': 'application/json' }), 401, 'INVALID_SIGNATURE');
    await expectUntouched(b.cookie, b.orderId, b.slug);
  });

  it('imza başlık değerleri bozulursa 401 INVALID_SIGNATURE', async () => {
    const b = await buyRandevu(t);
    const s = await signed(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }));
    const broken: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.headers)) {
      const name = k.toLowerCase();
      broken[k] = name === 'content-type' || name === 'content-length' ? v : `sahte-${v.split('').reverse().join('')}`;
    }
    expectError(await sendRaw(t, s.body, broken), 401, 'INVALID_SIGNATURE');
    await expectUntouched(b.cookie, b.orderId, b.slug);
  });

  it('reddedilen sahte olay eventId’yi "işlendi" saydırmaz: aynı eventId ile gerçek olay sonra işlenir', async () => {
    const b = await buyRandevu(t);
    const ev = makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus });
    const s = await signed(t, ev);
    expectError(await sendRaw(t, s.body, { 'content-type': 'application/json' }), 401, 'INVALID_SIGNATURE');

    expect((await sendEvent(t, ev)).status).toBe(200);
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');
  });

  it('webhook Origin kuralından muaftır: yabancı Origin ile gelen imzalı olay işlenir', async () => {
    const b = await buyRandevu(t);
    const r = await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }), {
      origin: EVIL_ORIGIN,
    });
    expect(r.status).toBe(200);
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');
  });
});

describe('payment.succeeded', () => {
  it('sipariş paid, abonelik active (currentPeriodEnd = periodEnd), fatura kesilir, firma kurulur', async () => {
    const b = await buyRandevu(t, { seats: 3 });
    const ev = makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus, periodEnd: 30 * DAY });
    expect((await sendEvent(t, ev)).status).toBe(200);

    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');

    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub).toBeDefined();
    expect(sub.status).toBe('active');
    sameInstant(sub.currentPeriodEnd, ev.periodEnd as string);

    const inv = await invoices(t, b.cookie);
    expect(inv.length).toBe(1);
    expect(inv[0].orderId).toBe(b.orderId);
    expect(inv[0].amountKurus).toBe(b.amountKurus);

    await drainJobs(t);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('done');
  });
});

describe('Aynı olayın tekrar gelmesi (idempotency)', () => {
  it('aynı payment.succeeded iki kez gelirse ikisi de 200; tek fatura, tek firma kurulumu', async () => {
    const b = await buyRandevu(t);
    const ev = makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus });
    expect((await sendEvent(t, ev)).status).toBe(200);
    await drainJobs(t);
    expect((await sendEvent(t, ev)).status).toBe(200);
    await drainJobs(t);

    expect((await invoices(t, b.cookie)).length).toBe(1);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });

  it('aynı olay aynı anda iki kez gelirse de tek fatura, tek firma kurulumu', async () => {
    const b = await buyRandevu(t);
    const s = await signed(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }));
    const [r1, r2] = await Promise.all([sendRaw(t, s.body, s.headers), sendRaw(t, s.body, s.headers)]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    await drainJobs(t);

    expect((await invoices(t, b.cookie)).length).toBe(1);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });

  it('aynı subscription.renewed iki kez gelirse tek yenileme faturası kesilir', async () => {
    const b = await buyAndPay(t);
    const renew = makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus });
    expect((await sendEvent(t, renew)).status).toBe(200);
    expect((await sendEvent(t, renew)).status).toBe(200);
    expect((await invoices(t, b.cookie)).length).toBe(2);
  });

  it('aynı sipariş için farklı eventId ile ikinci payment.succeeded gelse bile firma ikinci kez açılmaz', async () => {
    const b = await buyRandevu(t);
    await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }));
    await drainJobs(t);
    const r = await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { at: 1000, amountKurus: b.amountKurus }));
    expect(r.status).toBe(200);
    await drainJobs(t);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });
});

describe('Sırası bozuk olaylar', () => {
  it('iptal olayı ödeme olayından önce gelir ama daha yeni tarihlidir → sonuç canceled', async () => {
    const b = await buyRandevu(t);
    const paid = makeEvent('payment.succeeded', b.orderId, { at: 0, amountKurus: b.amountKurus });
    const canceled = makeEvent('subscription.canceled', b.orderId, { at: 10 * DAY, amountKurus: b.amountKurus });

    expect((await sendEvent(t, canceled)).status).toBe(200);
    expect((await sendEvent(t, paid)).status).toBe(200);
    await drainJobs(t);

    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub).toBeDefined();
    expect(sub.status).toBe('canceled');
  });

  it('eski tarihli payment.succeeded, sonra gelen yeni tarihli yenilemenin dönem sonunu geri almaz', async () => {
    const b = await buyRandevu(t);
    const paid = makeEvent('payment.succeeded', b.orderId, { at: 0, periodEnd: 30 * DAY, amountKurus: b.amountKurus });
    const renewed = makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, periodEnd: 60 * DAY, amountKurus: b.amountKurus });

    expect((await sendEvent(t, renewed)).status).toBe(200);
    expect((await sendEvent(t, paid)).status).toBe(200);

    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub.status).toBe('active');
    sameInstant(sub.currentPeriodEnd, at(60 * DAY));
  });

  it('eski tarihli payment.failed, yeni tarihli başarılı ödemeyi ezmez (active ve paid kalır)', async () => {
    const b = await buyRandevu(t);
    const failed = makeEvent('payment.failed', b.orderId, { at: 0, amountKurus: b.amountKurus });
    const paid = makeEvent('payment.succeeded', b.orderId, { at: HOUR, amountKurus: b.amountKurus });

    expect((await sendEvent(t, paid)).status).toBe(200);
    expect((await sendEvent(t, failed)).status).toBe(200);

    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');
    expect((await subscriptionFor(t, b.cookie, b.orderId)).status).toBe('active');
  });

  it('eski tarihli subscription.renewed, yeni tarihli iptali ezmez (canceled kalır)', async () => {
    const b = await buyAndPay(t);
    const renewed = makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, periodEnd: 60 * DAY, amountKurus: b.amountKurus });
    const canceled = makeEvent('subscription.canceled', b.orderId, { at: 40 * DAY, amountKurus: b.amountKurus });

    expect((await sendEvent(t, canceled)).status).toBe(200);
    expect((await sendEvent(t, renewed)).status).toBe(200);

    expect((await subscriptionFor(t, b.cookie, b.orderId)).status).toBe('canceled');
  });

  it('eski tarihli payment.failed, yeni tarihli yenilemeyi ezmez (past_due olmaz)', async () => {
    const b = await buyAndPay(t);
    const failed = makeEvent('payment.failed', b.orderId, { at: 29 * DAY, amountKurus: b.amountKurus });
    const renewed = makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, periodEnd: 60 * DAY, amountKurus: b.amountKurus });

    expect((await sendEvent(t, renewed)).status).toBe(200);
    expect((await sendEvent(t, failed)).status).toBe(200);

    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub.status).toBe('active');
    sameInstant(sub.currentPeriodEnd, at(60 * DAY));
  });
});

describe('Tutarı tutmayan ödeme', () => {
  it('amountKurus sipariş tutarından farklıysa 200 döner ama sipariş ödenmiş sayılmaz; Ozan’a uyarı e-postası gider', async () => {
    const b = await buyRandevu(t, { seats: 3 });
    const before = allMails(t).length;
    const r = await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus - 1 }));
    expect(r.status).toBe(200);

    await expectUntouched(b.cookie, b.orderId, b.slug);
    expect(mailsNotTo(t, before, [b.email]).length).toBeGreaterThanOrEqual(1);
  });

  it('fazla ödenen tutar da kabul edilmez', async () => {
    const b = await buyRandevu(t, { seats: 1 });
    expect((await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus * 100 }))).status).toBe(200);
    await expectUntouched(b.cookie, b.orderId, b.slug);
  });

  it('tutmayan olaydan sonra doğru tutarlı olay gelirse sipariş ödenir', async () => {
    const b = await buyRandevu(t);
    await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: 1 }));
    await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { at: 1000, amountKurus: b.amountKurus }));
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');
    expect((await invoices(t, b.cookie)).length).toBe(1);
  });
});

describe('Bilinmeyen sipariş', () => {
  it('bilinmeyen orderId → 200, hiçbir şey yapılmaz', async () => {
    const b = await buyRandevu(t);
    const r = await sendEvent(t, makeEvent('payment.succeeded', 'olmayan-siparis-123', { amountKurus: b.amountKurus }));
    expect(r.status).toBe(200);
    await drainJobs(t);
    expect(provisionerCalls(t)).toEqual([]);
    await expectUntouched(b.cookie, b.orderId, b.slug);
  });
});

describe('Başarısız ödeme', () => {
  it('pending siparişte payment.failed → sipariş failed; aktif abonelik, fatura ve firma yok', async () => {
    const b = await buyRandevu(t);
    expect((await sendEvent(t, makeEvent('payment.failed', b.orderId, { amountKurus: b.amountKurus }))).status).toBe(200);

    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('failed');
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    if (sub) expect(sub.status).not.toBe('active');
    expect(await invoices(t, b.cookie)).toEqual([]);
    await drainJobs(t);
    expect(provisionerCalls(t, 'createTenant', b.slug)).toEqual([]);
  });

  it('aktif abonelikte (yenileme sırasında) payment.failed → abonelik past_due, sipariş paid kalır', async () => {
    const b = await buyAndPay(t);
    expect((await sendEvent(t, makeEvent('payment.failed', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus }))).status).toBe(200);

    expect((await subscriptionFor(t, b.cookie, b.orderId)).status).toBe('past_due');
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');
  });

  it('past_due abonelik subscription.renewed ile tekrar active olur', async () => {
    const b = await buyAndPay(t);
    await sendEvent(t, makeEvent('payment.failed', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus }));
    await sendEvent(t, makeEvent('subscription.renewed', b.orderId, { at: 31 * DAY, periodEnd: 61 * DAY, amountKurus: b.amountKurus }));
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub.status).toBe('active');
    sameInstant(sub.currentPeriodEnd, at(61 * DAY));
  });
});

describe('Yenileme, iptal, iade', () => {
  it('subscription.renewed: active kalır, currentPeriodEnd ilerler, yeni fatura kesilir, firma yeniden açılmaz', async () => {
    const b = await buyAndPay(t);
    await drainJobs(t);
    const renew = makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, periodEnd: 60 * DAY, amountKurus: b.amountKurus });
    expect((await sendEvent(t, renew)).status).toBe(200);
    await drainJobs(t);

    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub.status).toBe('active');
    sameInstant(sub.currentPeriodEnd, at(60 * DAY));
    const inv = await invoices(t, b.cookie);
    expect(inv.length).toBe(2);
    expect(inv.every((i) => i.orderId === b.orderId && i.amountKurus === b.amountKurus)).toBe(true);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });

  it('subscription.canceled: abonelik canceled, firma dondurulur; abonelik ve faturalar silinmez', async () => {
    const b = await buyAndPay(t);
    await drainJobs(t);
    expect((await sendEvent(t, makeEvent('subscription.canceled', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus }))).status).toBe(200);
    await drainJobs(t);

    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(sub).toBeDefined();
    expect(sub.status).toBe('canceled');
    expect(provisionerCalls(t, 'freezeTenant', b.slug).length).toBe(1);
    expect((await invoices(t, b.cookie)).length).toBe(1);
  });

  it('payment.refunded: sipariş refunded, abonelik canceled, firma dondurulur', async () => {
    const b = await buyAndPay(t);
    await drainJobs(t);
    expect((await sendEvent(t, makeEvent('payment.refunded', b.orderId, { at: 2 * DAY, amountKurus: b.amountKurus }))).status).toBe(200);
    await drainJobs(t);

    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('refunded');
    expect((await subscriptionFor(t, b.cookie, b.orderId)).status).toBe('canceled');
    expect(provisionerCalls(t, 'freezeTenant', b.slug).length).toBe(1);
  });

  it('aynı iptal olayı iki kez gelirse firma bir kez dondurulur', async () => {
    const b = await buyAndPay(t);
    await drainJobs(t);
    const ev = makeEvent('subscription.canceled', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus });
    await sendEvent(t, ev);
    await drainJobs(t);
    await sendEvent(t, ev);
    await drainJobs(t);
    expect(provisionerCalls(t, 'freezeTenant', b.slug).length).toBe(1);
  });
});
