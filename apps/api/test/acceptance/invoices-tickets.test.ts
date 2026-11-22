import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DAY,
  DEFAULT_PRICES,
  EVIL_ORIGIN,
  allMails,
  buyAndPay,
  expectError,
  get,
  invoices,
  loginCookie,
  makeEvent,
  mailsNotTo,
  member,
  post,
  sendEvent,
} from './support';

let t: TestApp;

beforeEach(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });
});

afterEach(async () => {
  await t.close();
});

const NUMBER_RE = /^MV-(\d{4})-(\d{6})$/;

describe('Faturalar', () => {
  it('oturumsuz istek 401 UNAUTHENTICATED', async () => {
    expectError(await get(t, '/api/invoices'), 401, 'UNAUTHENTICATED');
  });

  it('ödeme sonrası fatura { id, number, orderId, amountKurus, issuedAt } ile listelenir; numara MV-YYYY-000001 biçiminde', async () => {
    const b = await buyAndPay(t, { seats: 2 });
    const list = await invoices(t, b.cookie);
    expect(list.length).toBe(1);
    const inv = list[0];
    expect(inv).toMatchObject({ orderId: b.orderId, amountKurus: b.amountKurus });
    expect(inv.id).toBeTruthy();
    expect(Number.isNaN(Date.parse(inv.issuedAt))).toBe(false);
    const m = NUMBER_RE.exec(inv.number);
    expect(m, `fatura numarası biçimi hatalı: ${inv.number}`).not.toBeNull();
    // Boş veritabanında ilk fatura
    expect(m![2]).toBe('000001');
  });

  it('numaralar üyeler arasında tek sırayla artar', async () => {
    const a = await buyAndPay(t, { tag: 'a' });
    const b = await buyAndPay(t, { tag: 'b' });
    const na = NUMBER_RE.exec((await invoices(t, a.cookie))[0].number)!;
    const nb = NUMBER_RE.exec((await invoices(t, b.cookie))[0].number)!;
    expect(nb[1]).toBe(na[1]);
    expect(Number(nb[2])).toBe(Number(na[2]) + 1);
  });

  it('liste yeniden eskiye sıralıdır', async () => {
    const b = await buyAndPay(t);
    t.clock.advance(30 * DAY);
    await sendEvent(t, makeEvent('subscription.renewed', b.orderId, { at: 30 * DAY, periodEnd: 60 * DAY, amountKurus: b.amountKurus }));
    // Oturum ömrü sabit 30 gün (Netleştirme 12): saat ilerledikten sonra yeniden giriş yapılır.
    const cookie = await loginCookie(t, b.email);
    const list = await invoices(t, cookie);
    expect(list.length).toBe(2);
    expect(Date.parse(list[0].issuedAt)).toBeGreaterThanOrEqual(Date.parse(list[1].issuedAt));
    expect(Number(NUMBER_RE.exec(list[0].number)![2])).toBeGreaterThan(Number(NUMBER_RE.exec(list[1].number)![2]));
  });

  it('GET /api/invoices/:id sahibine faturayı döner', async () => {
    const b = await buyAndPay(t);
    const inv = (await invoices(t, b.cookie))[0];
    const r = await get(t, `/api/invoices/${encodeURIComponent(inv.id)}`, b.cookie);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id: inv.id, number: inv.number, orderId: b.orderId, amountKurus: b.amountKurus });
  });

  it('oturumsuz GET /api/invoices/:id → 401', async () => {
    const b = await buyAndPay(t);
    const inv = (await invoices(t, b.cookie))[0];
    expectError(await get(t, `/api/invoices/${encodeURIComponent(inv.id)}`), 401, 'UNAUTHENTICATED');
  });
});

describe('Destek talepleri', () => {
  async function createTicket(cookie: string, subject = 'Giris sorunu', message = 'Sifremi unuttum, yardim eder misin?') {
    return post(t, '/api/tickets', { subject, message }, cookie);
  }

  it('oturumsuz istek 401 UNAUTHENTICATED', async () => {
    expectError(await post(t, '/api/tickets', { subject: 'Konu', message: 'Yeterince uzun mesaj' }), 401, 'UNAUTHENTICATED');
    expectError(await get(t, '/api/tickets'), 401, 'UNAUTHENTICATED');
  });

  it('201 { id, subject, status: "open", createdAt } döner ve Ozan’a e-posta gider', async () => {
    const m = await member(t);
    const before = allMails(t).length;
    const r = await createTicket(m.cookie, 'Fatura sorusu');
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ subject: 'Fatura sorusu', status: 'open' });
    expect(r.body.id).toBeTruthy();
    expect(Number.isNaN(Date.parse(r.body.createdAt))).toBe(false);
    expect(mailsNotTo(t, before, [m.email]).length).toBeGreaterThanOrEqual(1);
  });

  it.each([
    ['konu 3 karakter', 'abc', 'x'.repeat(10)],
    ['konu 120 karakter', 'k'.repeat(120), 'x'.repeat(10)],
    ['mesaj 10 karakter', 'Konu', 'x'.repeat(10)],
    ['mesaj 5000 karakter', 'Konu', 'x'.repeat(5000)],
  ])('sınırda geçerli: %s', async (_label, subject, message) => {
    const m = await member(t);
    expect((await createTicket(m.cookie, subject, message)).status).toBe(201);
  });

  it.each([
    ['konu 2 karakter', 'ab', 'x'.repeat(10)],
    ['konu 121 karakter', 'k'.repeat(121), 'x'.repeat(10)],
    ['mesaj 9 karakter', 'Konu', 'x'.repeat(9)],
    ['mesaj 5001 karakter', 'Konu', 'x'.repeat(5001)],
  ])('sınır dışı: %s → 400 VALIDATION, e-posta gitmez', async (_label, subject, message) => {
    const m = await member(t);
    const before = allMails(t).length;
    expectError(await createTicket(m.cookie, subject, message), 400, 'VALIDATION');
    expect(allMails(t).length).toBe(before);
  });

  it('yabancı Origin ile talep 403 BAD_ORIGIN', async () => {
    const m = await member(t);
    expectError(
      await post(t, '/api/tickets', { subject: 'Konu', message: 'Yeterince uzun mesaj' }, m.cookie, { origin: EVIL_ORIGIN }),
      403,
      'BAD_ORIGIN',
    );
    expect((await get(t, '/api/tickets', m.cookie)).body).toEqual([]);
  });

  it('GET /api/tickets kendi taleplerini, GET /api/tickets/:id messages dizisiyle döner', async () => {
    const m = await member(t);
    const created = await createTicket(m.cookie, 'Slug degisikligi', 'Firma adresimi degistirmek istiyorum.');

    const list = await get(t, '/api/tickets', m.cookie);
    expect(list.status).toBe(200);
    expect(list.body.map((x: any) => x.id)).toEqual([created.body.id]);

    const one = await get(t, `/api/tickets/${encodeURIComponent(created.body.id)}`, m.cookie);
    expect(one.status).toBe(200);
    expect(one.body).toMatchObject({ id: created.body.id, subject: 'Slug degisikligi', status: 'open' });
    expect(Array.isArray(one.body.messages)).toBe(true);
    expect(one.body.messages.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(one.body.messages)).toContain('Firma adresimi degistirmek istiyorum.');
  });
});
