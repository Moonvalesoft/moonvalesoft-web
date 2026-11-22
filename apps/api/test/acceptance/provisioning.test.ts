import { describe, it, expect, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DAY,
  DEFAULT_PRICES,
  allMails,
  buyAndPay,
  checkout,
  drainJobs,
  get,
  mailsNotTo,
  makeEvent,
  member,
  provisionerCalls,
  sendEvent,
  subscriptionFor,
} from './support';

let t: TestApp;

afterEach(async () => {
  await t?.close();
});

async function open(planPrices: Record<string, number> = DEFAULT_PRICES) {
  t = await createTestApp({ planPrices });
  return t;
}

describe('Firma kurulumu (createTenant)', () => {
  it('ödeme sonrası firma ilk denemede kurulur: tek createTenant çağrısı, doğru slug, provisioning done', async () => {
    await open();
    const b = await buyAndPay(t);
    await drainJobs(t);
    const calls = provisionerCalls(t, 'createTenant');
    expect(calls.length).toBe(1);
    expect(calls[0].slug).toBe(b.slug);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('done');
  });

  it('kurulum hata verirse tekrar denenir ve sonunda done olur (2 hata + 1 başarı = 3 çağrı)', async () => {
    await open();
    const b = await buyAndPay(t);
    t.provisioner.failNext(2);
    await drainJobs(t);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(3);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('done');
  });

  it('ilk hatadan sonra provisioning pending kalır (failed değil)', async () => {
    await open();
    const b = await buyAndPay(t);
    t.provisioner.failNext(1);
    await t.runJobs();
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('pending');
  });

  it('4 hatadan sonra 5. deneme başarılıysa done olur', async () => {
    await open();
    const b = await buyAndPay(t);
    t.provisioner.failNext(4);
    await drainJobs(t, 15);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(5);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('done');
  });

  it('5. başarısızlıkta iş durur: tam 5 çağrı, provisioning failed, Ozan’a e-posta gider', async () => {
    await open();
    const b = await buyAndPay(t);
    t.provisioner.failNext(5);
    const before = allMails(t).length;
    await drainJobs(t, 15);

    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(5);
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('failed');
    expect(mailsNotTo(t, before, [b.email]).length).toBeGreaterThanOrEqual(1);

    // failed iş kendiliğinden yeniden başlamaz
    await drainJobs(t, 5);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(5);
  });

  it('kurulum bittikten sonra kuyruk tekrar tekrar işlense de firma ikinci kez açılmaz', async () => {
    await open();
    const b = await buyAndPay(t);
    await drainJobs(t, 20);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });

  it('yenileme olayı firma kurulumunu tekrar tetiklemez', async () => {
    await open();
    const b = await buyAndPay(t);
    await drainJobs(t);
    await sendEvent(t, makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, periodEnd: 60 * DAY, amountKurus: b.amountKurus }));
    await drainJobs(t);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });

  it('iki farklı abonelik iki farklı firma açar', async () => {
    await open();
    const a = await buyAndPay(t, { tag: 'a' });
    const b = await buyAndPay(t, { tag: 'b' });
    await drainJobs(t);
    expect(provisionerCalls(t, 'createTenant', a.slug).length).toBe(1);
    expect(provisionerCalls(t, 'createTenant', b.slug).length).toBe(1);
  });

  it('randevu dışı ürün için firma kurulmaz, provisioning none', async () => {
    await open({ ...DEFAULT_PRICES, 'crm-aylik': 10000 });
    const plans = (await get(t, '/api/plans')).body as any[];
    const plan = plans.find((p) => p.product !== 'randevu' && p.purchasable === true);
    expect(plan, 'satın alınabilir randevu dışı plan bulunamadı (crm-aylik)').toBeDefined();
    const m = await member(t);
    const r = await checkout(t, m.cookie, { planId: plan.id, seats: 1 });
    expect(r.status).toBe(201);
    await sendEvent(t, makeEvent('payment.succeeded', r.body.orderId, { amountKurus: r.body.amountKurus }));
    await drainJobs(t);

    expect(provisionerCalls(t)).toEqual([]);
    const sub = await subscriptionFor(t, m.cookie, r.body.orderId);
    expect(sub.status).toBe('active');
    expect(sub.provisioning).toBe('none');
  });
});

describe('Firma dondurma (freezeTenant)', () => {
  it('dondurma işi hata verirse tekrar denenir', async () => {
    await open();
    const b = await buyAndPay(t);
    await drainJobs(t);
    await sendEvent(t, makeEvent('subscription.canceled', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus }));
    t.provisioner.failNext(1);
    await drainJobs(t);
    expect(provisionerCalls(t, 'freezeTenant', b.slug).length).toBe(2);
  });

  it('dondurma firmayı silmez: sonrasında createTenant veya başka bir silme çağrısı yapılmaz', async () => {
    await open();
    const b = await buyAndPay(t);
    await drainJobs(t);
    await sendEvent(t, makeEvent('subscription.canceled', b.orderId, { at: 30 * DAY, amountKurus: b.amountKurus }));
    await drainJobs(t);
    const ops = provisionerCalls(t, undefined, b.slug).map((c) => c.op);
    expect(ops).toEqual(['createTenant', 'freezeTenant']);
  });
});
