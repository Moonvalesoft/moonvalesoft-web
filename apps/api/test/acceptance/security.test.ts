/**
 * Güvenlik düzeltmeleri (docs/api.md "Güvenlik düzeltmeleri (22 Kasım 2026)").
 * İstek sınırları, X-Forwarded-For, doğrulama e-postası, adres çakışması, firma açma anahtarı,
 * sahte ödeme ucu, ayrılmış adresler. IP'ler belgeleme aralığından (203.0.113.0/24, 198.51.100.0/24), veriler sentetiktir.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DEFAULT_PRICES,
  HOUR,
  MINUTE,
  PASSWORD,
  buyAndPay,
  buyRandevu,
  checkoutRandevu,
  drainJobs,
  expectError,
  getOrder,
  login,
  makeEvent,
  mailsTo,
  member,
  newEmail,
  newSlug,
  post,
  provisionerCalls,
  register,
  registerVerified,
  sendEvent,
  subscriptionFor,
  tokensIn,
} from './support';
import { TEST_ADMIN_EMAIL } from '../helpers/app';

let t: TestApp;

async function open(rateLimits: Record<string, number> = {}) {
  t = await createTestApp({ planPrices: DEFAULT_PRICES, rateLimits });
}

afterEach(async () => {
  await t?.close();
});

const xff = (ip: string) => ({ 'x-forwarded-for': ip });
const IP1 = '203.0.113.10';
const IP2 = '203.0.113.11';

function forgot(email: string, headers?: Record<string, string>) {
  return post(t, '/api/auth/forgot-password', { email }, undefined, headers);
}

function resetMails(email: string) {
  return mailsTo(t, email).filter((m) => tokensIn(m, '/sifre-sifirla').length > 0);
}

// ---------------------------------------------------------------------------

describe('İstek sınırı: kayıt (IP başına saatte)', () => {
  it('sınır 2 → 3. kayıt 429 TOO_MANY_REQUESTS; e-posta gitmez, hesap açılmaz', async () => {
    await open({ registerPerIpHour: 2 });
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    const third = newEmail();
    expectError(await register(t, third, PASSWORD, 'Test Uye', {}, xff(IP1)), 429, 'TOO_MANY_REQUESTS');
    expect(mailsTo(t, third).length).toBe(0);
    expect(await t.adminSql('SELECT 1 FROM users WHERE email = $1', [third])).toEqual([]);
  });

  it('sınır aşılınca kayıtlı ve kayıtsız e-posta aynı 429 yanıtını alır (varlık sızmaz)', async () => {
    await open({ registerPerIpHour: 2 });
    const existing = newEmail('var');
    expect((await register(t, existing, PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    const mailsBefore = mailsTo(t, existing).length;
    const a = await register(t, existing, PASSWORD, 'Test Uye', {}, xff(IP1));
    const b = await register(t, newEmail('yok'), PASSWORD, 'Test Uye', {}, xff(IP1));
    expectError(a, 429, 'TOO_MANY_REQUESTS');
    expectError(b, 429, 'TOO_MANY_REQUESTS');
    expect(a.body).toEqual(b.body);
    expect(mailsTo(t, existing).length).toBe(mailsBefore);
  });

  it('kayıtlı e-postaya yapılan kayıt da sınıra sayılır', async () => {
    await open({ registerPerIpHour: 2 });
    const existing = newEmail('var');
    expect((await register(t, existing, PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    expect((await register(t, existing, PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    expectError(await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1)), 429, 'TOO_MANY_REQUESTS');
  });

  it('aydınlatma ve alan doğrulaması sınırdan önce gelir; bu hatalar sınırı tüketmez', async () => {
    await open({ registerPerIpHour: 1 });
    expectError(await register(t, newEmail(), PASSWORD, 'Test Uye', { noticeVersion: undefined }, xff(IP1)), 400, 'NOTICE_REQUIRED');
    expectError(await register(t, newEmail(), 'kisa', 'Test Uye', {}, xff(IP1)), 400, 'WEAK_PASSWORD');
    expectError(await register(t, 'abc', PASSWORD, 'Test Uye', {}, xff(IP1)), 400, 'INVALID_EMAIL');
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    // Sınır doldu; doğrulama hataları yine kendi kodunu döner.
    expectError(await register(t, newEmail(), PASSWORD, 'Test Uye', { noticeVersion: 'x' }, xff(IP1)), 400, 'NOTICE_REQUIRED');
    expectError(await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1)), 429, 'TOO_MANY_REQUESTS');
  });

  it('sınır IP başınadır ve 1 saat sonra açılır', async () => {
    await open({ registerPerIpHour: 1 });
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
    expectError(await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1)), 429, 'TOO_MANY_REQUESTS');
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP2))).status).toBe(202);
    t.clock.advance(HOUR + MINUTE);
    expect((await register(t, newEmail(), PASSWORD, 'Test Uye', {}, xff(IP1))).status).toBe(202);
  });
});

// ---------------------------------------------------------------------------

describe('İstek sınırı: şifre sıfırlama', () => {
  it('e-posta sınırı 1 → ikinci istek yine 202 ama e-posta gitmez; 1 saat sonra yine gider', async () => {
    await open({ forgotPerEmailHour: 1 });
    const email = newEmail();
    await registerVerified(t, email);
    const r1 = await forgot(email, xff(IP1));
    expect(r1.status).toBe(202);
    expect(resetMails(email).length).toBe(1);
    const r2 = await forgot(email, xff(IP2));
    expect(r2.status).toBe(202);
    expect(r2.body).toEqual(r1.body);
    expect(resetMails(email).length).toBe(1);
    t.clock.advance(HOUR + MINUTE);
    expect((await forgot(email)).status).toBe(202);
    expect(resetMails(email).length).toBe(2);
  });

  it('e-posta sınırı büyük/küçük harfle aşılamaz', async () => {
    await open({ forgotPerEmailHour: 1 });
    const email = newEmail();
    await registerVerified(t, email);
    expect((await forgot(email)).status).toBe(202);
    expect((await forgot(email.toUpperCase())).status).toBe(202);
    expect((await forgot(`  ${email}  `)).status).toBe(202);
    expect(resetMails(email).length).toBe(1);
  });

  it('e-posta sınırı adres başınadır: başka adrese e-posta gitmeye devam eder', async () => {
    await open({ forgotPerEmailHour: 1 });
    const a = newEmail('a');
    const b = newEmail('b');
    await registerVerified(t, a);
    await registerVerified(t, b);
    await forgot(a);
    await forgot(a);
    await forgot(b);
    expect(resetMails(a).length).toBe(1);
    expect(resetMails(b).length).toBe(1);
  });

  it('IP sınırı 2 → 3. istek 429 TOO_MANY_REQUESTS (kayıtlı/kayıtsız fark etmez), başka IP etkilenmez', async () => {
    await open({ forgotPerIpHour: 2 });
    const email = newEmail();
    await registerVerified(t, email);
    expect((await forgot(newEmail('yok'), xff(IP1))).status).toBe(202);
    expect((await forgot(newEmail('yok'), xff(IP1))).status).toBe(202);
    const a = await forgot(email, xff(IP1));
    const b = await forgot(newEmail('yok'), xff(IP1));
    expectError(a, 429, 'TOO_MANY_REQUESTS');
    expect(a.body).toEqual(b.body);
    expect(resetMails(email).length).toBe(0);
    expect((await forgot(email, xff(IP2))).status).toBe(202);
    expect(resetMails(email).length).toBe(1);
  });
});

// ---------------------------------------------------------------------------

describe('İstek sınırı: giriş', () => {
  it('IP sınırı 3 → 4. deneme (farklı e-postalar, doğru şifre bile) 429 TOO_MANY_REQUESTS; 15 dk sonra açılır', async () => {
    await open({ loginPerIp15m: 3 });
    const email = newEmail();
    await registerVerified(t, email);
    expectError(await login(t, newEmail('yok1'), 'yanlis-sifre-1', xff(IP1)), 401, 'INVALID_CREDENTIALS');
    expectError(await login(t, newEmail('yok2'), 'yanlis-sifre-2', xff(IP1)), 401, 'INVALID_CREDENTIALS');
    expectError(await login(t, newEmail('yok3'), 'yanlis-sifre-3', xff(IP1)), 401, 'INVALID_CREDENTIALS');
    const blocked = await login(t, email, PASSWORD, xff(IP1));
    expectError(blocked, 429, 'TOO_MANY_REQUESTS');
    expect(blocked.cookie).toBeUndefined();
    // Başka IP etkilenmez.
    expect((await login(t, email, PASSWORD, xff(IP2))).status).toBe(200);
    t.clock.advance(15 * MINUTE + MINUTE);
    expect((await login(t, email, PASSWORD, xff(IP1))).status).toBe(200);
  });

  it('e-posta başına 5 hata sınırı paralel isteklerle aşılamaz (20 paralel → en fazla 5 tanesi 401)', async () => {
    await open();
    const email = newEmail();
    await registerVerified(t, email);
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => login(t, email, `yanlis-sifre-${i}`, xff(`198.51.100.${i + 1}`))),
    );
    const statuses = results.map((r) => r.status);
    const n401 = statuses.filter((s) => s === 401).length;
    const n429 = statuses.filter((s) => s === 429).length;
    expect(n401 + n429, statuses.join(',')).toBe(20);
    expect(n401).toBeLessThanOrEqual(5);
    expect(n401).toBeGreaterThanOrEqual(1);
    for (const r of results.filter((x) => x.status === 429)) expect(r.body.code).toBe('TOO_MANY_ATTEMPTS');
    // Kilit gerçekten oturdu: doğru şifre de reddedilir.
    expectError(await login(t, email, PASSWORD), 429, 'TOO_MANY_ATTEMPTS');
  });

  it('doğru şifreli giriş hatalı deneme sayacına eklenmez', async () => {
    await open();
    const email = newEmail();
    await registerVerified(t, email);
    for (let i = 0; i < 4; i++) expect((await login(t, email, 'yanlis-sifre-x')).status).toBe(401);
    for (let i = 0; i < 3; i++) expect((await login(t, email, PASSWORD)).status).toBe(200);
    expectError(await login(t, email, 'yanlis-sifre-x'), 401, 'INVALID_CREDENTIALS'); // 5. hata
    expectError(await login(t, email, PASSWORD), 429, 'TOO_MANY_ATTEMPTS');
  });

  it('doğrulanmamış hesabın doğru şifresi (403) de sayaca eklenmez', async () => {
    await open();
    const email = newEmail();
    expect((await register(t, email)).status).toBe(202);
    for (let i = 0; i < 4; i++) expect((await login(t, email, 'yanlis-sifre-x')).status).toBe(401);
    for (let i = 0; i < 3; i++) expectError(await login(t, email, PASSWORD), 403, 'EMAIL_NOT_VERIFIED');
    expectError(await login(t, email, 'yanlis-sifre-x'), 401, 'INVALID_CREDENTIALS'); // 5. hata
    expectError(await login(t, email, PASSWORD), 429, 'TOO_MANY_ATTEMPTS');
  });

  it('e-posta kilidi IP değiştirerek aşılamaz', async () => {
    await open();
    const email = newEmail();
    await registerVerified(t, email);
    for (let i = 0; i < 5; i++) {
      expect((await login(t, email, 'yanlis-sifre-x', xff(`198.51.100.${i + 1}`))).status).toBe(401);
    }
    expectError(await login(t, email, PASSWORD, xff('198.51.100.99')), 429, 'TOO_MANY_ATTEMPTS');
  });
});

// ---------------------------------------------------------------------------

describe('X-Forwarded-For', () => {
  it('güvenilen adresten (127.0.0.1) gelen başlık aydınlatma ve kampanya izni kaydındaki ip’e yansır', async () => {
    await open();
    const email = newEmail();
    const r = await register(t, email, PASSWORD, 'Test Uye', { marketingEmail: true }, xff('203.0.113.77'));
    expect(r.status).toBe(202);
    const ack = await t.adminSql(
      `SELECT a.ip FROM legal_acknowledgements a JOIN users u ON u.id = a.user_id WHERE u.email = $1`,
      [email],
    );
    expect(ack).toEqual([{ ip: '203.0.113.77' }]);
    const mc = await t.adminSql(`SELECT m.ip FROM marketing_consents m JOIN users u ON u.id = m.user_id WHERE u.email = $1`, [
      email,
    ]);
    expect(mc).toEqual([{ ip: '203.0.113.77' }]);
  });

  it('başlık yoksa bağlantının kendi adresi kaydedilir', async () => {
    await open();
    const email = newEmail();
    await register(t, email);
    const ack = await t.adminSql(
      `SELECT a.ip FROM legal_acknowledgements a JOIN users u ON u.id = a.user_id WHERE u.email = $1`,
      [email],
    );
    expect(ack[0].ip).toMatch(/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/);
  });

  // createTestApp'te trustedProxies seçeneği yok; trustProxy uygulama kurulurken ayarlandığı için
  // t.config ile sonradan değiştirilemez. Seçenek eklenince bu test yazılacak (koordinatöre bildirildi).
  it.todo('trustedProxies boşken X-Forwarded-For dikkate alınmaz (ip bağlantı adresi olarak kaydedilir, IP sınırı başlıkla atlatılamaz)');
});

// ---------------------------------------------------------------------------

describe('Doğrulama e-postası', () => {
  it('kullanıcının yazdığı adı içermez (başkasının adresine bizim adımızla metin gönderilemesin)', async () => {
    await open();
    const email = newEmail();
    const name = 'Kampanya http://kotu-site.example/odul Tikla';
    expect((await register(t, email, PASSWORD, name)).status).toBe(202);
    const mails = mailsTo(t, email);
    expect(mails.length).toBe(1);
    const m = mails[0];
    expect(tokensIn(m, '/dogrula').length).toBe(1);
    for (const part of [name, 'kotu-site.example', 'Kampanya', 'Tikla']) {
      expect(m.text).not.toContain(part);
      expect(m.subject).not.toContain(part);
    }
    expect(m.links.some((l) => l.includes('kotu-site'))).toBe(false);
  });

  it('kayıtlı adrese giden "zaten hesabın var" e-postası da yeni kayıttaki adı içermez', async () => {
    await open();
    const email = newEmail();
    await register(t, email);
    const name = 'Sahte Ad http://kotu-site.example';
    await register(t, email, 'Baska-Sifre-456', name);
    const last = mailsTo(t, email).at(-1)!;
    expect(last.text).not.toContain('kotu-site.example');
    expect(last.text).not.toContain('Sahte Ad');
  });
});

// ---------------------------------------------------------------------------

describe('Firma kurulumu', () => {
  it('createTenant çağrısında subscriptionId var ve aboneliğin kimliğidir', async () => {
    await open();
    const b = await buyAndPay(t);
    await drainJobs(t);
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    const calls = provisionerCalls(t, 'createTenant', b.slug);
    expect(calls.length).toBe(1);
    expect(calls[0].subscriptionId).toBe(sub.id);
  });

  it('tekrar denemelerde de aynı subscriptionId gönderilir', async () => {
    await open();
    t.provisioner.failNext(2);
    const b = await buyAndPay(t);
    await drainJobs(t);
    const sub = await subscriptionFor(t, b.cookie, b.orderId);
    const calls = provisionerCalls(t, 'createTenant', b.slug);
    expect(calls.length).toBe(3);
    expect(new Set(calls.map((c) => c.subscriptionId))).toEqual(new Set([sub.id]));
  });

  it('adres çakışması: A’nın geç gelen ödemesinde firma açılmaz, abonelik provisioning failed, Ozan’a uyarı', async () => {
    await open();
    const slug = newSlug('cakisma');
    const a = await buyRandevu(t, { slug, tag: 'a' });
    t.clock.advance(HOUR + MINUTE); // A'nın bekleyen siparişi adresi artık tutmaz
    const b = await buyRandevu(t, { slug, tag: 'b' });
    expect((await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }))).status).toBe(200);
    await drainJobs(t);
    const bSub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(provisionerCalls(t, 'createTenant', slug).map((c) => c.subscriptionId)).toEqual([bSub.id]);

    const adminBefore = mailsTo(t, TEST_ADMIN_EMAIL).length;
    expect(
      (await sendEvent(t, makeEvent('payment.succeeded', a.orderId, { at: MINUTE, amountKurus: a.amountKurus }))).status,
    ).toBe(200);
    await drainJobs(t);
    const aSub = await subscriptionFor(t, a.cookie, a.orderId);
    expect(aSub).toBeDefined();
    expect(aSub.provisioning).toBe('failed');
    const calls = provisionerCalls(t, 'createTenant', slug);
    expect(calls.length).toBe(1);
    expect(calls.some((c) => c.subscriptionId === aSub.id)).toBe(false);
    const alerts = mailsTo(t, TEST_ADMIN_EMAIL).slice(adminBefore);
    expect(alerts.some((m) => m.subject.includes('Adres çakışması'))).toBe(true);
    // B etkilenmez.
    expect((await subscriptionFor(t, b.cookie, b.orderId)).provisioning).toBe('done');
  });

  it('adres çakışması: B ödedi ama kurulum işi henüz çalışmadıysa da (pending) A için firma açılmaz', async () => {
    await open();
    const slug = newSlug('cakisma');
    const a = await buyRandevu(t, { slug, tag: 'a' });
    t.clock.advance(HOUR + MINUTE);
    const b = await buyRandevu(t, { slug, tag: 'b' });
    await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }));
    await sendEvent(t, makeEvent('payment.succeeded', a.orderId, { at: MINUTE, amountKurus: a.amountKurus }));
    await drainJobs(t);
    const aSub = await subscriptionFor(t, a.cookie, a.orderId);
    const bSub = await subscriptionFor(t, b.cookie, b.orderId);
    expect(aSub.provisioning).toBe('failed');
    expect(provisionerCalls(t, 'createTenant', slug).map((c) => c.subscriptionId)).toEqual([bSub.id]);
  });
});

// ---------------------------------------------------------------------------

describe('Sahte ödeme ucu', () => {
  it('devPaymentsEnabled=false iken 404 NOT_FOUND ve sipariş değişmez', async () => {
    await open();
    const b = await buyRandevu(t);
    t.config.devPaymentsEnabled = false;
    const r = await post(t, `/api/dev/fake-payments/${b.orderId}/basarili`, undefined, b.cookie);
    expectError(r, 404, 'NOT_FOUND');
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('pending');
    expect(provisionerCalls(t).length).toBe(0);
  });

  it('karşılaştırma: açıkken aynı istek siparişi öder (uç gerçekten bu yolda)', async () => {
    await open();
    const b = await buyRandevu(t);
    const r = await post(t, `/api/dev/fake-payments/${b.orderId}/basarili`, undefined, b.cookie);
    expect(r.status).toBe(200);
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('paid');
  });

  it('açıkken bile başka üyenin siparişini ödeyemez (404)', async () => {
    await open();
    const b = await buyRandevu(t, { tag: 'sahip' });
    const other = await member(t, 'diger');
    expectError(await post(t, `/api/dev/fake-payments/${b.orderId}/basarili`, undefined, other.cookie), 404, 'NOT_FOUND');
    expect((await getOrder(t, b.cookie, b.orderId)).body.status).toBe('pending');
  });
});

// ---------------------------------------------------------------------------

describe('Ayrılmış adresler (genişletildi)', () => {
  it.each(['randevu', 'odeme', 'status', 'giris', 'guvenlik', 'crm', 'emlak', 'webmail'])(
    '"%s" → 409 SLUG_TAKEN',
    async (slug) => {
      await open();
      const m = await member(t);
      expectError(await checkoutRandevu(t, m.cookie, { slug }), 409, 'SLUG_TAKEN');
      expect(await t.adminSql('SELECT 1 FROM orders WHERE company_slug = $1', [slug])).toEqual([]);
    },
  );

  it('ayrılmış adın bir parçası olan geçerli adres kabul edilir (randevu-salonu)', async () => {
    await open();
    const m = await member(t);
    expect((await checkoutRandevu(t, m.cookie, { slug: 'randevu-salonu' })).status).toBe(201);
  });
});

