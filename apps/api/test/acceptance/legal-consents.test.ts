/**
 * Yasal belgeler, aydınlatma onayı, kampanya izni ve ön bilgilendirme / mesafeli satış onayı.
 * Kaynak: docs/api.md ("Üyelik", "Satın alma", "Yasal belgeler ve izinler"), docs/uyum-standardi.md.
 * Bütün veriler sentetiktir.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DEFAULT_PRICES,
  LEGAL,
  PASSWORD,
  call,
  checkout,
  checkoutRandevu,
  expectError,
  get,
  latestToken,
  loginCookie,
  mailsTo,
  member,
  newEmail,
  newSlug,
  post,
  register,
} from './support';
import { TEST_WEB_ORIGIN } from '../helpers/app';

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });
});

afterEach(async () => {
  await t.close();
});

const NO_CONSENT = { granted: false, version: null, updatedAt: null };

async function verifyAndLogin(email: string): Promise<string> {
  const v = await post(t, '/api/auth/verify-email', { token: latestToken(t, email, '/dogrula') });
  expect(v.status).toBe(200);
  return loginCookie(t, email);
}

async function userId(cookie: string): Promise<string> {
  const r = await get(t, '/api/me', cookie);
  expect(r.status).toBe(200);
  return r.body.id;
}

async function legalRecords(cookie: string): Promise<any[]> {
  const r = await get(t, '/api/me/legal', cookie);
  expect(r.status).toBe(200);
  expect(Array.isArray(r.body)).toBe(true);
  return r.body;
}

async function consents(cookie: string) {
  const r = await get(t, '/api/me/consents', cookie);
  expect(r.status).toBe(200);
  return r.body;
}

function putConsent(cookie: string | undefined, body: unknown) {
  return call(t, { method: 'PUT', url: '/api/me/consents', body, cookie });
}

async function currentDocs(): Promise<any[]> {
  const r = await get(t, '/api/legal');
  expect(r.status).toBe(200);
  return r.body;
}

async function campaignVersion(): Promise<string> {
  return (await currentDocs()).find((d) => d.kind === 'kampanya_izni').version;
}

async function countRows(table: 'orders' | 'legal_acknowledgements' | 'marketing_consents', uid: string) {
  const rows = await t.adminSql(`SELECT count(*)::int AS n FROM ${table} WHERE user_id = $1`, [uid]);
  return rows[0].n as number;
}

// ---------------------------------------------------------------------------

describe('GET /api/legal', () => {
  it('girişsiz çalışır ve yürürlükteki 5 belgeyi { kind, version, title, path } ile döner', async () => {
    const docs = await currentDocs();
    expect(docs.length).toBe(5);
    expect(docs.map((d) => d.kind).sort()).toEqual(
      ['aydinlatma', 'iptal_iade', 'kampanya_izni', 'mesafeli_satis', 'on_bilgilendirme'].sort(),
    );
    const paths: Record<string, string> = {
      aydinlatma: '/kvkk',
      on_bilgilendirme: '/on-bilgilendirme',
      mesafeli_satis: '/mesafeli-satis',
      kampanya_izni: '/kampanya-izni',
      iptal_iade: '/iptal-iade',
    };
    for (const d of docs) {
      expect(typeof d.version).toBe('string');
      expect(d.version.length).toBeGreaterThan(0);
      expect(typeof d.title).toBe('string');
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.path).toBe(paths[d.kind]);
    }
  });

  it('test sabitleri (LEGAL) API sürümleriyle aynıdır', async () => {
    const docs = await currentDocs();
    const v = (k: string) => docs.find((d) => d.kind === k).version;
    expect(v('aydinlatma')).toBe(LEGAL.notice);
    expect(v('on_bilgilendirme')).toBe(LEGAL.preInfo);
    expect(v('mesafeli_satis')).toBe(LEGAL.distanceSales);
  });
});

// ---------------------------------------------------------------------------

describe('Kayıt — aydınlatma metni', () => {
  it.each([
    ['noticeVersion yok', { noticeVersion: undefined }],
    ['noticeVersion null', { noticeVersion: null }],
    ['noticeVersion boş', { noticeVersion: '' }],
    ['noticeVersion yanlış sürüm', { noticeVersion: 'taslak-0' }],
    ['noticeVersion sayı', { noticeVersion: 1 }],
  ])('%s → 400 NOTICE_REQUIRED, e-posta gitmez, hesap açılmaz', async (_l, extra) => {
    const email = newEmail('aydinlatma');
    expectError(await register(t, email, PASSWORD, 'Test Uye', extra), 400, 'NOTICE_REQUIRED');
    expect(mailsTo(t, email).length).toBe(0);
    const rows = await t.adminSql('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
    expect(rows.length).toBe(0);
  });

  it('NOTICE_REQUIRED diğer doğrulamalardan önce gelir (zayıf şifre, geçersiz e-posta)', async () => {
    expectError(await register(t, newEmail(), 'kisa', 'Test Uye', { noticeVersion: undefined }), 400, 'NOTICE_REQUIRED');
    expectError(await register(t, 'abc', PASSWORD, 'Test Uye', { noticeVersion: undefined }), 400, 'NOTICE_REQUIRED');
  });

  it('kayıtlı e-postada da NOTICE_REQUIRED aynıdır ve e-posta gitmez (varlık sızmaz)', async () => {
    const existing = newEmail('var');
    expect((await register(t, existing)).status).toBe(202);
    const before = mailsTo(t, existing).length;
    const a = await register(t, existing, PASSWORD, 'Test Uye', { noticeVersion: 'yanlis' });
    const b = await register(t, newEmail('yok'), PASSWORD, 'Test Uye', { noticeVersion: 'yanlis' });
    expectError(a, 400, 'NOTICE_REQUIRED');
    expect(a.body).toEqual(b.body);
    expect(mailsTo(t, existing).length).toBe(before);
  });

  it('doğru sürümle kayıt: /api/me/legal içinde tek aydinlatma kaydı (orderId null, sürüm doğru)', async () => {
    const email = newEmail();
    expect((await register(t, email)).status).toBe(202);
    const cookie = await verifyAndLogin(email);
    const recs = await legalRecords(cookie);
    expect(recs.length).toBe(1);
    expect(recs[0]).toEqual({ kind: 'aydinlatma', version: LEGAL.notice, orderId: null, acceptedAt: expect.any(String) });
    expect(Number.isNaN(Date.parse(recs[0].acceptedAt))).toBe(false);
  });

  it('kayıtta IP ve tarayıcı saklanır, tarayıcı en fazla 300 karakter; yanıtlarda dönmez', async () => {
    const email = newEmail();
    const r = await register(t, email, PASSWORD, 'Test Uye', {}, { 'user-agent': 'U'.repeat(400) });
    expect(r.status).toBe(202);
    const cookie = await verifyAndLogin(email);
    const uid = await userId(cookie);
    const rows = await t.adminSql('SELECT ip, user_agent FROM legal_acknowledgements WHERE user_id = $1', [uid]);
    expect(rows.length).toBe(1);
    expect(rows[0].user_agent).toBe('U'.repeat(300));
    expect(typeof rows[0].ip).toBe('string');
    const recs = await legalRecords(cookie);
    expect(Object.keys(recs[0]).sort()).toEqual(['acceptedAt', 'kind', 'orderId', 'version']);
  });

  it.each([
    ['marketingEmail yok', {}],
    ['marketingEmail false', { marketingEmail: false }],
  ])('%s → kampanya izni yok, kayıt yine başarılı', async (_l, extra) => {
    const email = newEmail();
    expect((await register(t, email, PASSWORD, 'Test Uye', extra)).status).toBe(202);
    const cookie = await verifyAndLogin(email);
    expect(await consents(cookie)).toEqual({ marketingEmail: NO_CONSENT });
  });

  it('marketingEmail true → izin granted, version yürürlükteki kampanya_izni sürümü, kaynak register', async () => {
    const email = newEmail();
    expect((await register(t, email, PASSWORD, 'Test Uye', { marketingEmail: true })).status).toBe(202);
    const cookie = await verifyAndLogin(email);
    const c = await consents(cookie);
    expect(c.marketingEmail.granted).toBe(true);
    expect(c.marketingEmail.version).toBe(await campaignVersion());
    expect(Number.isNaN(Date.parse(c.marketingEmail.updatedAt))).toBe(false);
    const uid = await userId(cookie);
    const rows = await t.adminSql('SELECT channel, source, granted FROM marketing_consents WHERE user_id = $1', [uid]);
    expect(rows).toEqual([{ channel: 'email', source: 'register', granted: true }]);
  });

  it('kayıtlı e-postaya tekrar kayıt (izin vermeden) mevcut izni değiştirmez, yeni kayıt açmaz', async () => {
    const email = newEmail();
    await register(t, email, PASSWORD, 'Test Uye', { marketingEmail: true });
    const cookie = await verifyAndLogin(email);
    const uid = await userId(cookie);
    expect((await register(t, email, 'Baska-Sifre-456', 'Diger Ad', { marketingEmail: false })).status).toBe(202);
    expect((await consents(cookie)).marketingEmail.granted).toBe(true);
    expect(await countRows('marketing_consents', uid)).toBe(1);
    expect((await legalRecords(cookie)).length).toBe(1);
    expect(await countRows('legal_acknowledgements', uid)).toBe(1);
  });

  it('kayıtlı e-postaya tekrar kayıt (izin vererek) izinsiz hesaba izin açmaz, yeni aydınlatma kaydı açmaz', async () => {
    const email = newEmail();
    await register(t, email);
    const cookie = await verifyAndLogin(email);
    const uid = await userId(cookie);
    expect((await register(t, email, 'Baska-Sifre-456', 'Diger Ad', { marketingEmail: true })).status).toBe(202);
    expect(await consents(cookie)).toEqual({ marketingEmail: NO_CONSENT });
    expect(await countRows('marketing_consents', uid)).toBe(0);
    expect(await countRows('legal_acknowledgements', uid)).toBe(1);
  });
});

// ---------------------------------------------------------------------------

describe('Kampanya izni — panel', () => {
  it('girişsiz GET ve PUT → 401 UNAUTHENTICATED', async () => {
    expectError(await get(t, '/api/me/consents'), 401, 'UNAUTHENTICATED');
    expectError(await putConsent(undefined, { marketingEmail: true }), 401, 'UNAUTHENTICATED');
    expectError(await get(t, '/api/me/legal'), 401, 'UNAUTHENTICATED');
  });

  it('GET varsayılan { granted:false, version:null, updatedAt:null }', async () => {
    const m = await member(t);
    expect(await consents(m.cookie)).toEqual({ marketingEmail: NO_CONSENT });
  });

  it('PUT true → granted; PUT false → geri alınır; güncel durum son kayıttır', async () => {
    const m = await member(t);
    const v = await campaignVersion();
    const on = await putConsent(m.cookie, { marketingEmail: true });
    expect(on.status).toBe(200);
    expect(on.body.marketingEmail).toMatchObject({ granted: true, version: v });
    expect(await consents(m.cookie)).toEqual(on.body);

    t.clock.advance(1000);
    const off = await putConsent(m.cookie, { marketingEmail: false });
    expect(off.status).toBe(200);
    expect(off.body.marketingEmail.granted).toBe(false);
    expect(off.body.marketingEmail.version).toBe(v);
    expect(Date.parse(off.body.marketingEmail.updatedAt)).toBeGreaterThan(Date.parse(on.body.marketingEmail.updatedAt));
    expect(await consents(m.cookie)).toEqual(off.body);
  });

  it('her PUT yeni kayıt ekler (durum aynı olsa bile), kaynak panel; aynı anda yapılanlarda da son kayıt geçerli', async () => {
    const m = await member(t);
    const uid = await userId(m.cookie);
    // Saat ilerletilmeden: aynı zaman damgalı kayıtlarda da sıra korunmalı.
    for (const g of [true, true, false, true, false]) {
      expect((await putConsent(m.cookie, { marketingEmail: g })).status).toBe(200);
    }
    expect((await consents(m.cookie)).marketingEmail.granted).toBe(false);
    const rows = await t.adminSql('SELECT source FROM marketing_consents WHERE user_id = $1', [uid]);
    expect(rows.length).toBe(5);
    expect(rows.every((r) => r.source === 'panel')).toBe(true);
  });

  it.each([
    ['metin "true"', { marketingEmail: 'true' }],
    ['sayı 1', { marketingEmail: 1 }],
    ['null', { marketingEmail: null }],
    ['alan yok', {}],
    ['boş gövde', undefined],
  ])('boolean olmayan değer (%s) → 400 VALIDATION, kayıt eklenmez', async (_l, body) => {
    const m = await member(t);
    const uid = await userId(m.cookie);
    expectError(await putConsent(m.cookie, body), 400, 'VALIDATION');
    expect(await countRows('marketing_consents', uid)).toBe(0);
  });

  it("A'nın PUT'u B'nin iznini değiştirmez", async () => {
    const a = await member(t, 'a');
    const b = await member(t, 'b');
    expect((await putConsent(b.cookie, { marketingEmail: true })).status).toBe(200);
    const bBefore = await consents(b.cookie);
    expect((await putConsent(a.cookie, { marketingEmail: false })).status).toBe(200);
    expect((await putConsent(a.cookie, { marketingEmail: true })).status).toBe(200);
    expect(await consents(b.cookie)).toEqual(bBefore);
    expect(await countRows('marketing_consents', await userId(b.cookie))).toBe(1);
  });

  it('PUT yabancı Origin → 403 BAD_ORIGIN, kayıt eklenmez', async () => {
    const m = await member(t);
    const uid = await userId(m.cookie);
    const r = await call(t, {
      method: 'PUT',
      url: '/api/me/consents',
      body: { marketingEmail: true },
      cookie: m.cookie,
      headers: { origin: 'https://kotu-site.example' },
    });
    expectError(r, 403, 'BAD_ORIGIN');
    expect(await countRows('marketing_consents', uid)).toBe(0);
  });

  it('kayıtlar API ile güncellenemez veya silinemez (uç yok)', async () => {
    const m = await member(t);
    await putConsent(m.cookie, { marketingEmail: true });
    const uid = await userId(m.cookie);
    for (const req of [
      { method: 'DELETE', url: '/api/me/consents' },
      { method: 'PATCH', url: '/api/me/consents', body: { marketingEmail: false } },
      { method: 'DELETE', url: '/api/me/legal' },
      { method: 'PUT', url: '/api/me/legal', body: [] },
      { method: 'PATCH', url: '/api/me/legal', body: {} },
      { method: 'POST', url: '/api/me/legal', body: { kind: 'aydinlatma', version: 'x' } },
    ] as const) {
      const r = await call(t, { ...req, cookie: m.cookie } as any);
      expect([404, 405], `${req.method} ${req.url} → ${r.status}`).toContain(r.status);
    }
    expect(await countRows('marketing_consents', uid)).toBe(1);
    expect(await countRows('legal_acknowledgements', uid)).toBe(1);
    expect((await consents(m.cookie)).marketingEmail.granted).toBe(true);
  });

  it.each(['legal_acknowledgements', 'marketing_consents'])(
    '%s: mv_app rolüyle sistem bağlamında bile UPDATE ve DELETE "permission denied"',
    async (table) => {
      const m = await member(t);
      await putConsent(m.cookie, { marketingEmail: true });
      const uid = await userId(m.cookie);
      const before = await t.adminSql(`SELECT count(*)::int AS n FROM ${table}`);
      const set = table === 'legal_acknowledgements' ? "version = 'oynanmis'" : 'granted = NOT granted';
      for (const scope of ['system', { userId: uid }] as const) {
        await expect(t.sql(`UPDATE ${table} SET ${set}`, [], scope as any)).rejects.toThrow(/permission denied/);
        await expect(t.sql(`DELETE FROM ${table}`, [], scope as any)).rejects.toThrow(/permission denied/);
      }
      expect(await t.adminSql(`SELECT count(*)::int AS n FROM ${table}`)).toEqual(before);
    },
  );
});

// ---------------------------------------------------------------------------

describe('Satın alma — ön bilgilendirme ve mesafeli satış onayı', () => {
  it.each([
    ['preInfoVersion yok', { preInfoVersion: undefined }],
    ['distanceSalesVersion yok', { distanceSalesVersion: undefined }],
    ['ikisi de yok', { preInfoVersion: undefined, distanceSalesVersion: undefined }],
    ['preInfoVersion yanlış', { preInfoVersion: 'taslak-0' }],
    ['distanceSalesVersion yanlış', { distanceSalesVersion: 'taslak-0' }],
    ['ikisi de boş metin', { preInfoVersion: '', distanceSalesVersion: '' }],
    ['null', { preInfoVersion: null, distanceSalesVersion: null }],
  ])('%s → 400 LEGAL_ACCEPTANCE_REQUIRED; sipariş açılmaz, onay kaydı oluşmaz, e-posta gitmez', async (_l, extra) => {
    const m = await member(t);
    const uid = await userId(m.cookie);
    const slug = newSlug();
    const mailsBefore = mailsTo(t, m.email).length;
    expectError(await checkoutRandevu(t, m.cookie, { slug, extra }), 400, 'LEGAL_ACCEPTANCE_REQUIRED');
    expect(await countRows('orders', uid)).toBe(0);
    const recs = await legalRecords(m.cookie);
    expect(recs.map((r) => r.kind)).toEqual(['aydinlatma']);
    expect(mailsTo(t, m.email).length).toBe(mailsBefore);
    // Slug tutulmadı: başka üye alabilir.
    const other = await member(t, 'diger');
    expect((await checkoutRandevu(t, other.cookie, { slug })).status).toBe(201);
  });

  describe('hata sırası: e-posta → plan → seats → slug biçimi → yasal onay → slug çakışması', () => {
    const missing = { preInfoVersion: undefined, distanceSalesVersion: undefined };

    it('bilinmeyen plan + eksik onay → 404 NOT_FOUND', async () => {
      const m = await member(t);
      expectError(
        await checkout(t, m.cookie, { planId: 'olmayan-plan', seats: 1, companySlug: newSlug(), companyName: 'A B', ...missing }),
        404,
        'NOT_FOUND',
      );
    });

    it('satın alınamayan plan + eksik onay → 422 PLAN_NOT_PURCHASABLE', async () => {
      const m = await member(t);
      expectError(await checkout(t, m.cookie, { planId: 'logo-erp', seats: 1, ...missing }), 422, 'PLAN_NOT_PURCHASABLE');
    });

    it('geçersiz seats + eksik onay → 400 VALIDATION', async () => {
      const m = await member(t);
      expectError(await checkoutRandevu(t, m.cookie, { seats: 0, extra: missing }), 400, 'VALIDATION');
    });

    it('geçersiz slug biçimi + eksik onay → 400 INVALID_SLUG', async () => {
      const m = await member(t);
      expectError(await checkoutRandevu(t, m.cookie, { slug: 'Kotu_Slug', extra: missing }), 400, 'INVALID_SLUG');
      expectError(await checkoutRandevu(t, m.cookie, { slug: 'xn--abc', extra: missing }), 400, 'INVALID_SLUG');
    });

    it('ayrılmış slug + eksik onay → 400 LEGAL_ACCEPTANCE_REQUIRED (slug çakışmasından önce)', async () => {
      const m = await member(t);
      expectError(await checkoutRandevu(t, m.cookie, { slug: 'www', extra: missing }), 400, 'LEGAL_ACCEPTANCE_REQUIRED');
    });

    it('başka üyenin aldığı slug + eksik onay → 400 LEGAL_ACCEPTANCE_REQUIRED; onayla → 409 SLUG_TAKEN', async () => {
      const a = await member(t, 'a');
      const slug = newSlug();
      expect((await checkoutRandevu(t, a.cookie, { slug })).status).toBe(201);
      const b = await member(t, 'b');
      expectError(await checkoutRandevu(t, b.cookie, { slug, extra: missing }), 400, 'LEGAL_ACCEPTANCE_REQUIRED');
      expectError(await checkoutRandevu(t, b.cookie, { slug }), 409, 'SLUG_TAKEN');
    });
  });

  it('slug çakışmasıyla (409) biten satın almada onay kaydı kalmaz, e-posta gitmez', async () => {
    const a = await member(t, 'a');
    const slug = newSlug();
    expect((await checkoutRandevu(t, a.cookie, { slug })).status).toBe(201);
    const b = await member(t, 'b');
    const uid = await userId(b.cookie);
    const mailsBefore = mailsTo(t, b.email).length;
    expectError(await checkoutRandevu(t, b.cookie, { slug }), 409, 'SLUG_TAKEN');
    expectError(await checkoutRandevu(t, b.cookie, { slug: 'admin' }), 409, 'SLUG_TAKEN');
    expect(await countRows('orders', uid)).toBe(0);
    expect(await countRows('legal_acknowledgements', uid)).toBe(1); // yalnız aydınlatma
    expect((await legalRecords(b.cookie)).map((r) => r.kind)).toEqual(['aydinlatma']);
    expect(mailsTo(t, b.email).length).toBe(mailsBefore);
  });

  it('başarılı satın alma: on_bilgilendirme ve mesafeli_satis kayıtları orderId ile, yeniden eskiye', async () => {
    const m = await member(t);
    t.clock.advance(60_000);
    const r = await checkoutRandevu(t, m.cookie, { seats: 3 });
    expect(r.status).toBe(201);
    const recs = await legalRecords(m.cookie);
    expect(recs.length).toBe(3);
    const byKind = Object.fromEntries(recs.map((x) => [x.kind, x]));
    expect(byKind.on_bilgilendirme).toMatchObject({ version: LEGAL.preInfo, orderId: r.body.orderId });
    expect(byKind.mesafeli_satis).toMatchObject({ version: LEGAL.distanceSales, orderId: r.body.orderId });
    expect(byKind.aydinlatma).toMatchObject({ version: LEGAL.notice, orderId: null });
    // Yeniden eskiye: aydınlatma en eski, en sonda.
    expect(recs[2].kind).toBe('aydinlatma');
    for (let i = 1; i < recs.length; i++) {
      expect(Date.parse(recs[i - 1].acceptedAt)).toBeGreaterThanOrEqual(Date.parse(recs[i].acceptedAt));
    }
    for (const x of recs) expect(Object.keys(x).sort()).toEqual(['acceptedAt', 'kind', 'orderId', 'version']);
  });

  it('iki satın alma iki ayrı onay çifti üretir (her sipariş kendi kaydıyla)', async () => {
    const m = await member(t);
    const o1 = await checkoutRandevu(t, m.cookie);
    const o2 = await checkoutRandevu(t, m.cookie);
    expect(o1.status).toBe(201);
    expect(o2.status).toBe(201);
    const recs = await legalRecords(m.cookie);
    for (const id of [o1.body.orderId, o2.body.orderId]) {
      expect(recs.filter((x) => x.orderId === id).map((x) => x.kind).sort()).toEqual(['mesafeli_satis', 'on_bilgilendirme']);
    }
  });

  it('başarılı satın almada müşteriye ön bilgilendirme e-postası gider: plan, kişi sayısı, sürümlü iki bağlantı', async () => {
    const m = await member(t);
    const before = mailsTo(t, m.email).length;
    const r = await checkoutRandevu(t, m.cookie, { seats: 3 });
    expect(r.status).toBe(201);
    const mails = mailsTo(t, m.email).slice(before);
    expect(mails.length).toBe(1);
    const mail = mails[0];
    const pre = mail.links.map((l) => new URL(l)).find((u) => u.pathname === '/on-bilgilendirme');
    const ds = mail.links.map((l) => new URL(l)).find((u) => u.pathname === '/mesafeli-satis');
    expect(pre?.origin).toBe(TEST_WEB_ORIGIN);
    expect(ds?.origin).toBe(TEST_WEB_ORIGIN);
    expect(pre?.searchParams.get('surum')).toBe(LEGAL.preInfo);
    expect(ds?.searchParams.get('surum')).toBe(LEGAL.distanceSales);
    expect(mail.text).toContain('Moonvale Randevu');
    expect(mail.text).toContain('3');
    expect(mail.text).toContain(LEGAL.preInfo);
    // Tutar biçimi sözleşmede tanımlı değil (teyit edilecek); 149700 kuruş için yaygın biçimlerden biri beklenir.
    expect(mail.text).toMatch(/1\.?497,00|1,?497\.00|149700/);
  });

  it('başarılı satın alma onay kaydında tarayıcı bilgisi saklanır (en fazla 300 karakter)', async () => {
    const m = await member(t);
    const uid = await userId(m.cookie);
    const r2 = await checkout(
      t,
      m.cookie,
      { planId: 'randevu-aylik', seats: 1, companySlug: newSlug(), companyName: 'A B' },
      { 'user-agent': 'Z'.repeat(350) },
    );
    expect(r2.status).toBe(201);
    const rows = await t.adminSql('SELECT user_agent FROM legal_acknowledgements WHERE user_id = $1 AND order_id = $2', [
      uid,
      r2.body.orderId,
    ]);
    expect(rows.length).toBe(2);
    for (const x of rows) expect(x.user_agent).toBe('Z'.repeat(300));
  });
});
