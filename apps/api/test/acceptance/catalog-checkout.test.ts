import { describe, it, expect, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DEFAULT_PRICES,
  EVIL_ORIGIN,
  TEST_PRICE_RANDEVU,
  buyAndPay,
  checkout,
  checkoutRandevu,
  discoverWebOrigin,
  expectError,
  get,
  getOrder,
  login,
  member,
  newEmail,
  newSlug,
  register,
  sessionSetCookie,
} from './support';

let t: TestApp;

afterEach(async () => {
  await t?.close();
});

async function open(planPrices: Record<string, number> = DEFAULT_PRICES) {
  t = await createTestApp({ planPrices });
  return t;
}

async function plans(): Promise<any[]> {
  const r = await get(t, '/api/plans');
  expect(r.status).toBe(200);
  expect(Array.isArray(r.body)).toBe(true);
  return r.body as any[];
}

describe('GET /api/plans', () => {
  it('girişsiz çalışır ve randevu-aylik planını sözleşmedeki biçimde döner', async () => {
    await open();
    const randevu = (await plans()).find((p) => p.id === 'randevu-aylik');
    expect(randevu).toEqual({
      id: 'randevu-aylik',
      product: 'randevu',
      name: 'Moonvale Randevu',
      interval: 'month',
      priceKurus: TEST_PRICE_RANDEVU,
      perSeat: true,
      purchasable: true,
    });
  });

  it('her planda alanlar doğru tiptedir; fiyat kuruş cinsinden tam sayı veya null', async () => {
    await open();
    const list = await plans();
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.product).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.interval).toBe('string');
      expect(typeof p.perSeat).toBe('boolean');
      expect(typeof p.purchasable).toBe('boolean');
      if (p.priceKurus === null) {
        expect(p.purchasable).toBe(false);
      } else {
        expect(Number.isInteger(p.priceKurus)).toBe(true);
      }
    }
  });

  it('fiyatı tanımlanmamış plan priceKurus: null, purchasable: false döner', async () => {
    await open({});
    const randevu = (await plans()).find((p) => p.id === 'randevu-aylik');
    expect(randevu).toBeDefined();
    expect(randevu.priceKurus).toBeNull();
    expect(randevu.purchasable).toBe(false);
  });

  it('logo-erp planı fiyat verilse bile her zaman purchasable: false', async () => {
    await open({ ...DEFAULT_PRICES, 'logo-erp': 100000 });
    const logo = (await plans()).find((p) => p.id === 'logo-erp');
    expect(logo).toBeDefined();
    expect(logo.purchasable).toBe(false);
  });
});

describe('POST /api/checkout — erişim', () => {
  it('oturumsuz istek 401 UNAUTHENTICATED', async () => {
    await open();
    expectError(
      await checkout(t, undefined, { planId: 'randevu-aylik', seats: 1, companySlug: newSlug(), companyName: 'A B' }),
      401,
      'UNAUTHENTICATED',
    );
  });

  it('e-postası doğrulanmamış üye oturum açamaz, dolayısıyla satın alamaz', async () => {
    await open();
    const email = newEmail();
    await register(t, email);
    const l = await login(t, email);
    expectError(l, 403, 'EMAIL_NOT_VERIFIED');
    expect(l.cookie).toBeFalsy();
    expect(sessionSetCookie(l)).toBeUndefined();
    // Elinde çerez yok; satın alma isteği oturumsuz sayılır
    expectError(
      await checkout(t, l.cookie, { planId: 'randevu-aylik', seats: 1, companySlug: newSlug(), companyName: 'A B' }),
      401,
      'UNAUTHENTICATED',
    );
  });

  it('yabancı Origin 403 BAD_ORIGIN; sipariş oluşmaz (slug boşta kalır)', async () => {
    await open();
    const m = await member(t);
    const slug = newSlug();
    expectError(
      await checkout(t, m.cookie, { planId: 'randevu-aylik', seats: 1, companySlug: slug, companyName: 'A B' }, { origin: EVIL_ORIGIN }),
      403,
      'BAD_ORIGIN',
    );
    const other = await member(t);
    expect((await checkoutRandevu(t, other.cookie, { slug })).status).toBe(201);
  });

  it('doğru Origin ile satın alma çalışır', async () => {
    await open();
    const origin = await discoverWebOrigin(t);
    const m = await member(t);
    const r = await checkout(
      t,
      m.cookie,
      { planId: 'randevu-aylik', seats: 1, companySlug: newSlug(), companyName: 'A B' },
      { origin },
    );
    expect(r.status).toBe(201);
  });
});

describe('POST /api/checkout — tutar ve sipariş', () => {
  it('201 { orderId, checkoutUrl, amountKurus } ve amountKurus = priceKurus × seats', async () => {
    await open();
    const m = await member(t);
    const r = await checkoutRandevu(t, m.cookie, { seats: 3 });
    expect(r.status).toBe(201);
    expect(typeof r.body.orderId).toBe('string');
    expect(r.body.orderId.length).toBeGreaterThan(0);
    expect(typeof r.body.checkoutUrl).toBe('string');
    expect(() => new URL(r.body.checkoutUrl)).not.toThrow();
    expect(r.body.amountKurus).toBe(TEST_PRICE_RANDEVU * 3);
  });

  it('tutar istemciden alınmaz: gövdedeki amountKurus / priceKurus yok sayılır', async () => {
    await open();
    const m = await member(t);
    const r = await checkout(t, m.cookie, {
      planId: 'randevu-aylik',
      seats: 3,
      companySlug: newSlug(),
      companyName: 'Hileli Salon',
      amountKurus: 1,
      priceKurus: 1,
      price: 1,
    });
    expect(r.status).toBe(201);
    expect(r.body.amountKurus).toBe(TEST_PRICE_RANDEVU * 3);
    const o = await getOrder(t, m.cookie, r.body.orderId);
    expect(o.body.amountKurus).toBe(TEST_PRICE_RANDEVU * 3);
  });

  it('GET /api/orders/:id sahibine siparişi pending olarak döner; webhook gelmeden ödenmiş sayılmaz', async () => {
    await open();
    const m = await member(t);
    const slug = newSlug();
    const r = await checkoutRandevu(t, m.cookie, { seats: 2, slug });
    const o = await getOrder(t, m.cookie, r.body.orderId);
    expect(o.status).toBe(200);
    expect(o.body).toMatchObject({
      id: r.body.orderId,
      planId: 'randevu-aylik',
      seats: 2,
      amountKurus: TEST_PRICE_RANDEVU * 2,
      status: 'pending',
      companySlug: slug,
    });
    expect(Number.isNaN(Date.parse(o.body.createdAt))).toBe(false);
  });

  it('oturumsuz GET /api/orders/:id → 401', async () => {
    await open();
    const m = await member(t);
    const r = await checkoutRandevu(t, m.cookie);
    expectError(await getOrder(t, undefined, r.body.orderId), 401, 'UNAUTHENTICATED');
  });

  it.each([1, 100])('seats sınır değeri %d kabul edilir', async (seats) => {
    await open();
    const m = await member(t);
    const r = await checkoutRandevu(t, m.cookie, { seats });
    expect(r.status).toBe(201);
    expect(r.body.amountKurus).toBe(TEST_PRICE_RANDEVU * seats);
  });

  it.each<[string, unknown]>([
    ['0', 0],
    ['101', 101],
    ['-1', -1],
    ['2.5', 2.5],
    ['"3" (metin)', '3'],
  ])('perSeat planda geçersiz seats %s reddedilir (4xx, sipariş oluşmaz)', async (_label, seats) => {
    await open();
    const m = await member(t);
    const slug = newSlug();
    const r = await checkout(t, m.cookie, { planId: 'randevu-aylik', seats, companySlug: slug, companyName: 'A B' });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
    expect(typeof r.body?.code).toBe('string');
    // Sipariş oluşmadıysa slug başkası tarafından alınabilir
    const other = await member(t);
    expect((await checkoutRandevu(t, other.cookie, { slug })).status).toBe(201);
  });
});

describe('POST /api/checkout — plan', () => {
  it('bilinmeyen plan 404 NOT_FOUND', async () => {
    await open();
    const m = await member(t);
    expectError(
      await checkout(t, m.cookie, { planId: 'olmayan-plan', seats: 1, companySlug: newSlug(), companyName: 'A B' }),
      404,
      'NOT_FOUND',
    );
  });

  it('fiyatı tanımlanmamış plan 422 PLAN_NOT_PURCHASABLE', async () => {
    await open({});
    const m = await member(t);
    expectError(await checkoutRandevu(t, m.cookie), 422, 'PLAN_NOT_PURCHASABLE');
  });

  it('logo-erp (fiyat verilse bile) 422 PLAN_NOT_PURCHASABLE', async () => {
    await open({ ...DEFAULT_PRICES, 'logo-erp': 100000 });
    const m = await member(t);
    expectError(await checkout(t, m.cookie, { planId: 'logo-erp', seats: 1 }), 422, 'PLAN_NOT_PURCHASABLE');
  });

  // Not: Sözleşmede randevu dışı satın alınabilir plan kimliği yalnızca PLAN_PRICES örneğinde (crm-aylik) geçiyor.
  it('randevu dışı üründe companySlug/companyName zorunlu değildir', async () => {
    await open({ ...DEFAULT_PRICES, 'crm-aylik': 10000 });
    const plan = (await plans()).find((p) => p.product !== 'randevu' && p.purchasable === true);
    expect(plan, 'satın alınabilir randevu dışı plan bulunamadı (crm-aylik)').toBeDefined();
    const m = await member(t);
    const r = await checkout(t, m.cookie, { planId: plan.id, seats: 1 });
    expect(r.status).toBe(201);
    expect(r.body.amountKurus).toBe(plan.priceKurus);
  });

  // Netleştirme 8: şu an satın alınabilir perSeat=false plan yok; Ozan karar verene kadar todo.
  it.todo('perSeat olmayan planda seats yok sayılır (1 kabul edilir)');
});

describe('POST /api/checkout — firma adı ve slug', () => {
  it.each([
    ['ab', 'çok kısa (2)'],
    ['a'.repeat(31), 'çok uzun (31)'],
    ['Ayse-kuafor', 'büyük harf'],
    ['-ayse', 'tire ile başlıyor'],
    ['ayse-', 'tire ile bitiyor'],
    ['ayse_kuafor', 'alt çizgi'],
    ['ayşe-kuafor', 'Türkçe karakter'],
    ['ayse kuafor', 'boşluk'],
    ['ayse.kuafor', 'nokta'],
    ['', 'boş'],
  ])('biçimi bozuk slug "%s" (%s) → 400 INVALID_SLUG', async (slug) => {
    await open();
    const m = await member(t);
    expectError(await checkoutRandevu(t, m.cookie, { slug }), 400, 'INVALID_SLUG');
  });

  it.each(['abc', 'a'.repeat(30), '123', 'a-b'])('sınırda geçerli slug "%s" kabul edilir', async (slug) => {
    await open();
    const m = await member(t);
    expect((await checkoutRandevu(t, m.cookie, { slug })).status).toBe(201);
  });

  it.each(['www', 'api', 'admin', 'panel', 'destek', 'mail', 'app', 'moonvalesoft'])(
    'ayrılmış ad "%s" → 409 SLUG_TAKEN',
    async (slug) => {
      await open();
      const m = await member(t);
      expectError(await checkoutRandevu(t, m.cookie, { slug }), 409, 'SLUG_TAKEN');
    },
  );

  it('başka üyenin bekleyen siparişinin aldığı slug → 409 SLUG_TAKEN', async () => {
    await open();
    const a = await member(t, 'a');
    const slug = newSlug('ayse-kuafor');
    expect((await checkoutRandevu(t, a.cookie, { slug })).status).toBe(201);
    const b = await member(t, 'b');
    expectError(await checkoutRandevu(t, b.cookie, { slug }), 409, 'SLUG_TAKEN');
  });

  it('aktif aboneliğin aldığı slug → 409 SLUG_TAKEN', async () => {
    await open();
    const paid = await buyAndPay(t);
    const b = await member(t, 'b');
    expectError(await checkoutRandevu(t, b.cookie, { slug: paid.slug }), 409, 'SLUG_TAKEN');
  });

  it('randevu ürününde companySlug eksikse istek reddedilir (4xx)', async () => {
    await open();
    const m = await member(t);
    const r = await checkout(t, m.cookie, { planId: 'randevu-aylik', seats: 1, companyName: 'A B' });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
  });

  it('randevu ürününde companyName eksikse istek reddedilir (4xx), slug boşta kalır', async () => {
    await open();
    const m = await member(t);
    const slug = newSlug();
    const r = await checkout(t, m.cookie, { planId: 'randevu-aylik', seats: 1, companySlug: slug });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
    expect((await checkoutRandevu(t, m.cookie, { slug })).status).toBe(201);
  });
});
