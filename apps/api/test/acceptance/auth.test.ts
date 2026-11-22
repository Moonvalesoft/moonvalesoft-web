import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DAY,
  DEFAULT_PRICES,
  EVIL_ORIGIN,
  HOUR,
  MINUTE,
  PASSWORD,
  SECOND,
  allMails,
  discoverWebOrigin,
  expectError,
  get,
  latestToken,
  login,
  loginCookie,
  mailsTo,
  newEmail,
  post,
  register,
  registerVerified,
  sessionSetCookie,
  tokensIn,
} from './support';

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });
});

afterEach(async () => {
  await t.close();
});

describe('POST /api/auth/register', () => {
  it('yeni e-postada 202 { ok: true } döner ve /dogrula bağlantılı doğrulama e-postası gönderir', async () => {
    const email = newEmail();
    const r = await register(t, email);
    expect(r.status).toBe(202);
    expect(r.body).toEqual({ ok: true });

    const mails = mailsTo(t, email);
    expect(mails.length).toBe(1);
    expect(tokensIn(mails[0], '/dogrula').length).toBe(1);
  });

  it('kayıt oturum açmaz (çerez vermez)', async () => {
    const r = await register(t, newEmail());
    expect(r.status).toBe(202);
    expect(r.cookie).toBeFalsy();
    expect(sessionSetCookie(r)).toBeUndefined();
  });

  it('kayıtlı e-posta için yanıt yeni e-postayla birebir aynıdır (varlık sızmaz) ve sahibine e-posta gider', async () => {
    const existing = newEmail('var');
    await registerVerified(t, existing);
    const before = mailsTo(t, existing).length;

    const fresh = await register(t, newEmail('yok'));
    const again = await register(t, existing, 'Baska-Sifre-456');

    expect(again.status).toBe(fresh.status);
    expect(again.body).toEqual(fresh.body);
    expect(again.status).toBe(202);
    expect(sessionSetCookie(again)).toBeUndefined();
    // "zaten hesabın var" e-postası
    expect(mailsTo(t, existing).length).toBe(before + 1);
  });

  it('kayıtlı e-postayla tekrar kayıt olmak mevcut şifreyi değiştirmez', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    await register(t, email, 'Baska-Sifre-456');

    expect((await login(t, email, PASSWORD)).status).toBe(200);
    expectError(await login(t, email, 'Baska-Sifre-456'), 401, 'INVALID_CREDENTIALS');
  });

  it('şifre 10 karakterden kısaysa 400 WEAK_PASSWORD, 10 karakter kabul edilir', async () => {
    const weakEmail = newEmail();
    expectError(await register(t, weakEmail, '123456789'), 400, 'WEAK_PASSWORD');
    expect(mailsTo(t, weakEmail).length).toBe(0);

    expect((await register(t, newEmail(), '1234567890')).status).toBe(202);
  });

  it('zayıf şifre kayıtlı e-postada da 400 WEAK_PASSWORD döner (kayıtlı e-posta farklı yanıt almaz)', async () => {
    const existing = newEmail();
    await registerVerified(t, existing);
    expectError(await register(t, existing, 'kisa'), 400, 'WEAK_PASSWORD');
    expectError(await register(t, newEmail(), 'kisa'), 400, 'WEAK_PASSWORD');
  });

  it.each(['abc', 'a@', '@example.com', '', 'iki @example.com'])('geçersiz e-posta "%s" → 400 INVALID_EMAIL', async (email) => {
    expectError(await register(t, email), 400, 'INVALID_EMAIL');
  });
});

describe('POST /api/auth/verify-email', () => {
  it('geçerli token 200 döner; sonra giriş yapılabilir ve /api/me emailVerified true', async () => {
    const email = newEmail();
    await register(t, email);
    const v = await post(t, '/api/auth/verify-email', { token: latestToken(t, email, '/dogrula') });
    expect(v.status).toBe(200);
    expect(v.body).toEqual({ ok: true });

    const cookie = await loginCookie(t, email);
    const me = await get(t, '/api/me', cookie);
    expect(me.status).toBe(200);
    expect(me.body.emailVerified).toBe(true);
  });

  it('token tek kullanımlıktır: ikinci kullanım 400 INVALID_TOKEN', async () => {
    const email = newEmail();
    await register(t, email);
    const token = latestToken(t, email, '/dogrula');
    expect((await post(t, '/api/auth/verify-email', { token })).status).toBe(200);
    expectError(await post(t, '/api/auth/verify-email', { token }), 400, 'INVALID_TOKEN');
  });

  it('token 24 saat geçerlidir: 23 saat 59 dakikada çalışır', async () => {
    const email = newEmail();
    await register(t, email);
    const token = latestToken(t, email, '/dogrula');
    t.clock.advance(24 * HOUR - MINUTE);
    expect((await post(t, '/api/auth/verify-email', { token })).status).toBe(200);
  });

  it('24 saati geçen token 400 INVALID_TOKEN ve e-posta doğrulanmamış kalır', async () => {
    const email = newEmail();
    await register(t, email);
    const token = latestToken(t, email, '/dogrula');
    t.clock.advance(24 * HOUR + MINUTE);
    expectError(await post(t, '/api/auth/verify-email', { token }), 400, 'INVALID_TOKEN');
    expectError(await login(t, email), 403, 'EMAIL_NOT_VERIFIED');
  });

  it('uydurma token 400 INVALID_TOKEN', async () => {
    expectError(await post(t, '/api/auth/verify-email', { token: 'uydurma-token-123' }), 400, 'INVALID_TOKEN');
  });
});

describe('POST /api/auth/login', () => {
  it('doğru bilgiyle 200 { user } ve mv_session çerezi (HttpOnly, SameSite=Lax, Path=/)', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const r = await login(t, email);
    expect(r.status).toBe(200);
    expect(r.body.user).toBeTruthy();
    expect(r.body.user.email).toBe(email);
    expect(r.cookie).toBeTruthy();

    const sc = sessionSetCookie(r);
    expect(sc, 'mv_session Set-Cookie başlığı yok').toBeDefined();
    expect(sc).toMatch(/;\s*HttpOnly/i);
    expect(sc).toMatch(/;\s*SameSite=Lax/i);
    expect(sc).toMatch(/;\s*Path=\/(;|$)/i);
    // Ömür 30 gün
    expect(sc).toMatch(/Max-Age=2592000|Expires=/i);

    // Şifre veya özeti yanıtta yer almaz
    const raw = JSON.stringify(r.body).toLowerCase();
    expect(raw).not.toContain(PASSWORD.toLowerCase());
    expect(raw).not.toContain('argon');
    expect(raw).not.toContain('passwordhash');
  });

  it('yanlış şifre ve kayıtsız e-posta aynı yanıtı alır: 401 INVALID_CREDENTIALS, çerez yok', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const wrong = await login(t, email, 'Yanlis-Sifre-000');
    const unknown = await login(t, newEmail('kayitsiz'), 'Yanlis-Sifre-000');
    expectError(wrong, 401, 'INVALID_CREDENTIALS');
    expectError(unknown, 401, 'INVALID_CREDENTIALS');
    expect(wrong.body).toEqual(unknown.body);
    expect(sessionSetCookie(wrong)).toBeUndefined();
  });

  it('e-postası doğrulanmamış üye doğru şifreyle 403 EMAIL_NOT_VERIFIED alır ve oturum açılmaz', async () => {
    const email = newEmail();
    await register(t, email);
    const r = await login(t, email);
    expectError(r, 403, 'EMAIL_NOT_VERIFIED');
    expect(r.cookie).toBeFalsy();
    expect(sessionSetCookie(r)).toBeUndefined();
  });

  it('15 dakikada 5 hatalı denemeden sonra doğru şifre bile 429 TOO_MANY_ATTEMPTS alır; süre dolunca giriş açılır', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    for (let i = 0; i < 5; i++) {
      expectError(await login(t, email, `Yanlis-Sifre-${i}0000`), 401, 'INVALID_CREDENTIALS');
    }
    const blocked = await login(t, email, PASSWORD);
    expectError(blocked, 429, 'TOO_MANY_ATTEMPTS');
    expect(sessionSetCookie(blocked)).toBeUndefined();

    t.clock.advance(15 * MINUTE + SECOND);
    expect((await login(t, email, PASSWORD)).status).toBe(200);
  });

  it('kayıtsız e-postaya da 5 hatalı denemeden sonra 429 döner (hesap varlığı sızmaz)', async () => {
    const email = newEmail('kayitsiz');
    for (let i = 0; i < 5; i++) {
      expectError(await login(t, email, 'Yanlis-Sifre-0000'), 401, 'INVALID_CREDENTIALS');
    }
    expectError(await login(t, email, 'Yanlis-Sifre-0000'), 429, 'TOO_MANY_ATTEMPTS');
  });

  it('sınır e-posta başınadır: bir e-postanın kilitlenmesi başka üyeyi etkilemez', async () => {
    const a = newEmail('a');
    const b = newEmail('b');
    await registerVerified(t, a);
    await registerVerified(t, b);
    for (let i = 0; i < 5; i++) await login(t, a, 'Yanlis-Sifre-0000');
    expectError(await login(t, a, PASSWORD), 429, 'TOO_MANY_ATTEMPTS');
    expect((await login(t, b, PASSWORD)).status).toBe(200);
  });

  it('15 dakikadan geniş aralığa yayılmış 5 hatalı deneme kilitlemez', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    for (let i = 0; i < 4; i++) await login(t, email, 'Yanlis-Sifre-0000');
    t.clock.advance(16 * MINUTE);
    expectError(await login(t, email, 'Yanlis-Sifre-0000'), 401, 'INVALID_CREDENTIALS');
    expect((await login(t, email, PASSWORD)).status).toBe(200);
  });
});

describe('Oturum: /api/me, logout, ömür', () => {
  it('oturumsuz /api/me → 401 UNAUTHENTICATED', async () => {
    expectError(await get(t, '/api/me'), 401, 'UNAUTHENTICATED');
  });

  it('/api/me { id, email, name, emailVerified } döner', async () => {
    const email = newEmail();
    await register(t, email, PASSWORD, 'Ayse Deneme');
    await post(t, '/api/auth/verify-email', { token: latestToken(t, email, '/dogrula') });
    const cookie = await loginCookie(t, email);
    const me = await get(t, '/api/me', cookie);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email, name: 'Ayse Deneme', emailVerified: true });
    expect(me.body.id).toBeTruthy();
  });

  it('logout 204 döner ve oturum sunucuda silinir (aynı çerez artık 401)', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const cookie = await loginCookie(t, email);
    const r = await post(t, '/api/auth/logout', undefined, cookie);
    expect(r.status).toBe(204);
    expectError(await get(t, '/api/me', cookie), 401, 'UNAUTHENTICATED');
  });

  it('logout yalnızca o oturumu kapatır, aynı üyenin diğer oturumu açık kalır', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const c1 = await loginCookie(t, email);
    const c2 = await loginCookie(t, email);
    expect((await post(t, '/api/auth/logout', undefined, c1)).status).toBe(204);
    expect((await get(t, '/api/me', c2)).status).toBe(200);
  });

  it('oturum 30 gün yaşar: 29. günde geçerli, 30 günü geçince 401', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const used = await loginCookie(t, email);
    const untouched = await loginCookie(t, email);

    t.clock.advance(29 * DAY);
    expect((await get(t, '/api/me', used)).status).toBe(200);

    t.clock.advance(DAY + MINUTE);
    expectError(await get(t, '/api/me', untouched), 401, 'UNAUTHENTICATED');
  });
});

describe('Şifre sıfırlama', () => {
  it('forgot-password her zaman 202; kayıtlı adrese /sifre-sifirla bağlantısı gider, kayıtsıza hiçbir şey gitmez', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const unknown = newEmail('kayitsiz');

    const a = await post(t, '/api/auth/forgot-password', { email });
    const b = await post(t, '/api/auth/forgot-password', { email: unknown });
    expect(a.status).toBe(202);
    expect(b.status).toBe(202);
    expect(a.body).toEqual({ ok: true });
    expect(b.body).toEqual(a.body);

    expect(() => latestToken(t, email, '/sifre-sifirla')).not.toThrow();
    expect(mailsTo(t, unknown).length).toBe(0);
  });

  it('reset-password yeni şifreyi geçerli kılar, eskisini geçersiz yapar ve bütün oturumları kapatır', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const c1 = await loginCookie(t, email);
    const c2 = await loginCookie(t, email);

    await post(t, '/api/auth/forgot-password', { email });
    const token = latestToken(t, email, '/sifre-sifirla');
    const r = await post(t, '/api/auth/reset-password', { token, password: 'Yeni-Sifre-789' });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });

    expectError(await get(t, '/api/me', c1), 401, 'UNAUTHENTICATED');
    expectError(await get(t, '/api/me', c2), 401, 'UNAUTHENTICATED');
    expectError(await login(t, email, PASSWORD), 401, 'INVALID_CREDENTIALS');
    expect((await login(t, email, 'Yeni-Sifre-789')).status).toBe(200);
  });

  it('sıfırlama token’ı tek kullanımlıktır', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    await post(t, '/api/auth/forgot-password', { email });
    const token = latestToken(t, email, '/sifre-sifirla');
    expect((await post(t, '/api/auth/reset-password', { token, password: 'Yeni-Sifre-789' })).status).toBe(200);
    expectError(await post(t, '/api/auth/reset-password', { token, password: 'Baska-Sifre-789' }), 400, 'INVALID_TOKEN');
    expect((await login(t, email, 'Yeni-Sifre-789')).status).toBe(200);
  });

  it('sıfırlama token’ı 1 saat geçerlidir: 59. dakikada çalışır', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    await post(t, '/api/auth/forgot-password', { email });
    const token = latestToken(t, email, '/sifre-sifirla');
    t.clock.advance(HOUR - MINUTE);
    expect((await post(t, '/api/auth/reset-password', { token, password: 'Yeni-Sifre-789' })).status).toBe(200);
  });

  it('1 saati geçen sıfırlama token’ı 400 INVALID_TOKEN, şifre değişmez', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    await post(t, '/api/auth/forgot-password', { email });
    const token = latestToken(t, email, '/sifre-sifirla');
    t.clock.advance(HOUR + MINUTE);
    expectError(await post(t, '/api/auth/reset-password', { token, password: 'Yeni-Sifre-789' }), 400, 'INVALID_TOKEN');
    expect((await login(t, email, PASSWORD)).status).toBe(200);
  });

  it('uydurma sıfırlama token’ı 400 INVALID_TOKEN', async () => {
    expectError(
      await post(t, '/api/auth/reset-password', { token: 'uydurma-token-123', password: 'Yeni-Sifre-789' }),
      400,
      'INVALID_TOKEN',
    );
  });

  it('doğrulama token’ı şifre sıfırlamada, sıfırlama token’ı doğrulamada geçmez', async () => {
    const email = newEmail();
    await register(t, email);
    const verifyToken = latestToken(t, email, '/dogrula');
    expectError(
      await post(t, '/api/auth/reset-password', { token: verifyToken, password: 'Yeni-Sifre-789' }),
      400,
      'INVALID_TOKEN',
    );

    const email2 = newEmail();
    await registerVerified(t, email2);
    await post(t, '/api/auth/forgot-password', { email: email2 });
    const resetToken = latestToken(t, email2, '/sifre-sifirla');
    expectError(await post(t, '/api/auth/verify-email', { token: resetToken }), 400, 'INVALID_TOKEN');
  });
});

describe('Origin kontrolü (üyelik uçları)', () => {
  it('doğru Origin ile giriş çalışır, yabancı Origin 403 BAD_ORIGIN ve çerez yok', async () => {
    const origin = await discoverWebOrigin(t);
    const email = newEmail();
    await registerVerified(t, email);

    expect((await login(t, email, PASSWORD, { origin })).status).toBe(200);

    const bad = await login(t, email, PASSWORD, { origin: EVIL_ORIGIN });
    expectError(bad, 403, 'BAD_ORIGIN');
    expect(sessionSetCookie(bad)).toBeUndefined();
  });

  it('yabancı Origin ile kayıt 403 BAD_ORIGIN ve e-posta gitmez', async () => {
    const email = newEmail();
    const before = allMails(t).length;
    const r = await register(t, email, PASSWORD, 'X Y', {}, { origin: EVIL_ORIGIN });
    expectError(r, 403, 'BAD_ORIGIN');
    expect(allMails(t).length).toBe(before);
  });

  it('yabancı Origin ile logout 403 BAD_ORIGIN ve oturum açık kalır', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const cookie = await loginCookie(t, email);
    expectError(await post(t, '/api/auth/logout', undefined, cookie, { origin: EVIL_ORIGIN }), 403, 'BAD_ORIGIN');
    expect((await get(t, '/api/me', cookie)).status).toBe(200);
  });

  it('yabancı Origin ile şifre sıfırlama isteği 403 BAD_ORIGIN', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    await post(t, '/api/auth/forgot-password', { email });
    const token = latestToken(t, email, '/sifre-sifirla');
    expectError(
      await post(t, '/api/auth/reset-password', { token, password: 'Yeni-Sifre-789' }, undefined, { origin: EVIL_ORIGIN }),
      403,
      'BAD_ORIGIN',
    );
    expect((await login(t, email, PASSWORD)).status).toBe(200);
  });

  it('GET istekleri Origin kuralına tabi değildir', async () => {
    const email = newEmail();
    await registerVerified(t, email);
    const cookie = await loginCookie(t, email);
    expect((await get(t, '/api/me', cookie, { origin: EVIL_ORIGIN })).status).toBe(200);
  });
});
