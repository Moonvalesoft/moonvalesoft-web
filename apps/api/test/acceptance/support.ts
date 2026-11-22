/**
 * Kabul testleri için ortak kısayollar.
 *
 * Yalnızca docs/api.md içindeki test yardımcısının (createTestApp / TestApp) sözleşmedeki
 * yüzeyini kullanır. Uygulamanın iç koduna, servislerine veya tablolarına dayanmaz.
 * Bütün veriler sentetiktir (example.com adresleri, uydurma firma adları).
 */
import { expect } from 'vitest';
import { createTestApp, LEGAL, type TestApp } from '../helpers/app';

export { createTestApp, LEGAL, type TestApp };

/** Test değeri: sözleşmedeki örnekten alındı, gerçek fiyat değildir. */
export const TEST_PRICE_RANDEVU = 49900;
export const DEFAULT_PRICES: Record<string, number> = { 'randevu-aylik': TEST_PRICE_RANDEVU };

export const PASSWORD = 'Sentetik-Sifre-123';
export const WEBHOOK_URL = '/api/webhooks/payments';
export const EVIL_ORIGIN = 'https://kotu-site.example';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// İstek
// ---------------------------------------------------------------------------

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Res {
  status: number;
  // Gövde tipini burada serbest bırakıyoruz; alanlar testlerde tek tek doğrulanır.
  body: any;
  headers: Record<string, string | string[] | undefined>;
  cookie?: string;
}

export interface ReqOpts {
  method: Method;
  url: string;
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
}

export async function call(t: TestApp, opts: ReqOpts): Promise<Res> {
  return (await t.request(opts as any)) as unknown as Res;
}

export function get(t: TestApp, url: string, cookie?: string, headers?: Record<string, string>) {
  return call(t, { method: 'GET', url, cookie, headers });
}

export function post(
  t: TestApp,
  url: string,
  body?: unknown,
  cookie?: string,
  headers?: Record<string, string>,
) {
  return call(t, { method: 'POST', url, body, cookie, headers });
}

/** Hata gövdesi her zaman { code, message } biçimindedir. */
export function expectError(res: Res, status: number, code: string) {
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(res.body?.code).toBe(code);
  expect(typeof res.body?.message).toBe('string');
  expect(res.body.message.length).toBeGreaterThan(0);
}

export function setCookieHeaders(res: Res): string[] {
  const key = Object.keys(res.headers).find((k) => k.toLowerCase() === 'set-cookie');
  if (!key) return [];
  const v = res.headers[key];
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

export function sessionSetCookie(res: Res): string | undefined {
  return setCookieHeaders(res).find((c) => c.trim().startsWith('mv_session='));
}

// ---------------------------------------------------------------------------
// E-posta
// ---------------------------------------------------------------------------

export interface Mail {
  to: unknown;
  subject: string;
  text: string;
  links: string[];
}

export function allMails(t: TestApp): Mail[] {
  return t.mailer.sent as unknown as Mail[];
}

export function recipients(m: Mail): string[] {
  const v = m.to;
  const list = Array.isArray(v) ? v : [v];
  return list.map((x) => String(x).toLowerCase());
}

export function mailsTo(t: TestApp, address: string): Mail[] {
  const a = address.toLowerCase();
  return allMails(t).filter((m) => recipients(m).includes(a));
}

/** `since` sayısından sonra gönderilmiş ve verilen adreslerin hiçbirine gitmeyen e-postalar (Ozan'a giden uyarılar). */
export function mailsNotTo(t: TestApp, since: number, customerAddresses: string[]): Mail[] {
  const customers = customerAddresses.map((a) => a.toLowerCase());
  return allMails(t)
    .slice(since)
    .filter((m) => recipients(m).every((r) => !customers.includes(r)));
}

export type LinkPath = '/dogrula' | '/sifre-sifirla';

export function tokensIn(m: Mail, path: LinkPath): string[] {
  const out: string[] = [];
  for (const link of m.links ?? []) {
    const u = new URL(link);
    const token = u.searchParams.get('token');
    if (u.pathname === path && token) out.push(token);
  }
  return out;
}

/** Adrese giden en son e-postadaki ilgili token. */
export function latestToken(t: TestApp, address: string, path: LinkPath): string {
  const mails = mailsTo(t, address);
  for (let i = mails.length - 1; i >= 0; i--) {
    const tokens = tokensIn(mails[i], path);
    if (tokens.length > 0) return tokens[tokens.length - 1];
  }
  throw new Error(`${address} adresine ${path} bağlantılı e-posta gitmedi`);
}

// ---------------------------------------------------------------------------
// Üyelik
// ---------------------------------------------------------------------------

let emailSeq = 0;
export function newEmail(tag = 'uye'): string {
  emailSeq += 1;
  return `${tag}-${emailSeq}@example.com`;
}

/**
 * Kayıt isteği. Varsayılan olarak yürürlükteki aydınlatma sürümünü gönderir.
 * `extra` içinde `noticeVersion: undefined` verilirse alan hiç gönderilmez (JSON'da düşer).
 */
export async function register(
  t: TestApp,
  email: string,
  password = PASSWORD,
  name = 'Test Uye',
  extra: Record<string, unknown> = {},
  headers?: Record<string, string>,
) {
  return post(t, '/api/auth/register', { email, password, name, noticeVersion: LEGAL.notice, ...extra }, undefined, headers);
}

export async function registerVerified(t: TestApp, email: string, password = PASSWORD) {
  const r = await register(t, email, password);
  expect(r.status).toBe(202);
  const v = await post(t, '/api/auth/verify-email', { token: latestToken(t, email, '/dogrula') });
  expect(v.status).toBe(200);
}

export async function login(t: TestApp, email: string, password = PASSWORD, headers?: Record<string, string>) {
  return post(t, '/api/auth/login', { email, password }, undefined, headers);
}

export async function loginCookie(t: TestApp, email: string, password = PASSWORD): Promise<string> {
  const r = await login(t, email, password);
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  expect(r.cookie).toBeTruthy();
  return r.cookie as string;
}

/** Sözleşmedeki hazır doğrulanmış üye. */
export async function member(t: TestApp, tag = 'uye'): Promise<{ cookie: string; email: string }> {
  const email = newEmail(tag);
  const r = (await t.registerAndLogin(email, PASSWORD)) as unknown as { cookie: string; user: { email: string } };
  return { cookie: r.cookie, email };
}

/** WEB_ORIGIN değerini e-postadaki bağlantıdan öğrenir (sözleşme: `${WEB_ORIGIN}/dogrula?token=...`). */
export async function discoverWebOrigin(t: TestApp): Promise<string> {
  const email = newEmail('origin');
  await register(t, email);
  const m = mailsTo(t, email).find((x) => tokensIn(x, '/dogrula').length > 0);
  if (!m) throw new Error('doğrulama e-postası bulunamadı');
  const link = m.links.find((l) => new URL(l).pathname === '/dogrula') as string;
  return new URL(link).origin;
}

// ---------------------------------------------------------------------------
// Satın alma
// ---------------------------------------------------------------------------

let slugSeq = 0;
export function newSlug(tag = 'salon'): string {
  slugSeq += 1;
  return `${tag}-${slugSeq}`;
}

/**
 * Satın alma isteği. Gövdede `preInfoVersion` / `distanceSalesVersion` anahtarı hiç yoksa
 * yürürlükteki sürümleri ekler. Eksik göndermek için anahtarı `undefined` değeriyle verin.
 */
export async function checkout(
  t: TestApp,
  cookie: string | undefined,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const full: Record<string, unknown> = { ...body };
  if (!('preInfoVersion' in full)) full.preInfoVersion = LEGAL.preInfo;
  if (!('distanceSalesVersion' in full)) full.distanceSalesVersion = LEGAL.distanceSales;
  return post(t, '/api/checkout', full, cookie, headers);
}

export async function checkoutRandevu(
  t: TestApp,
  cookie: string,
  opts: { seats?: number; slug?: string; name?: string; extra?: Record<string, unknown> } = {},
) {
  return checkout(t, cookie, {
    planId: 'randevu-aylik',
    seats: opts.seats ?? 3,
    companySlug: opts.slug ?? newSlug(),
    companyName: opts.name ?? 'Deneme Kuafor',
    ...(opts.extra ?? {}),
  });
}

export interface Bought {
  cookie: string;
  email: string;
  orderId: string;
  amountKurus: number;
  slug: string;
  seats: number;
}

/** Üye açar, Randevu siparişi oluşturur (henüz ödenmemiş). */
export async function buyRandevu(t: TestApp, opts: { seats?: number; slug?: string; tag?: string } = {}): Promise<Bought> {
  const m = await member(t, opts.tag);
  const slug = opts.slug ?? newSlug();
  const seats = opts.seats ?? 3;
  const r = await checkoutRandevu(t, m.cookie, { seats, slug });
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  return { ...m, orderId: r.body.orderId, amountKurus: r.body.amountKurus, slug, seats };
}

/** Sipariş oluşturur ve imzalı payment.succeeded gönderir. */
export async function buyAndPay(t: TestApp, opts: { seats?: number; slug?: string; tag?: string } = {}) {
  const b = await buyRandevu(t, opts);
  const r = await sendEvent(t, makeEvent('payment.succeeded', b.orderId, { amountKurus: b.amountKurus }));
  expect(r.status).toBe(200);
  return b;
}

export async function getOrder(t: TestApp, cookie: string | undefined, orderId: string) {
  return get(t, `/api/orders/${encodeURIComponent(orderId)}`, cookie);
}

export async function subscriptions(t: TestApp, cookie: string): Promise<any[]> {
  const r = await get(t, '/api/subscriptions', cookie);
  expect(r.status).toBe(200);
  expect(Array.isArray(r.body)).toBe(true);
  return r.body as any[];
}

export async function subscriptionFor(t: TestApp, cookie: string, orderId: string): Promise<any | undefined> {
  return (await subscriptions(t, cookie)).find((s) => s.orderId === orderId);
}

export async function invoices(t: TestApp, cookie: string): Promise<any[]> {
  const r = await get(t, '/api/invoices', cookie);
  expect(r.status).toBe(200);
  expect(Array.isArray(r.body)).toBe(true);
  return r.body as any[];
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export type EventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.renewed'
  | 'subscription.canceled'
  | 'payment.refunded';

export interface PaymentEvent {
  eventId: string;
  type: EventType;
  orderId: string;
  occurredAt: string;
  amountKurus?: number;
  periodEnd?: string;
}

/** Olay zamanları için sabit, sentetik başlangıç. */
export const T0 = Date.parse('2026-11-21T10:00:00Z');
export function at(offsetMs: number): string {
  return new Date(T0 + offsetMs).toISOString();
}

let eventSeq = 0;
export function newEventId(): string {
  eventSeq += 1;
  return `evt_test_${eventSeq}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Olay üretir. `at` ve `periodEnd` T0'a göre ms cinsinden ofsettir.
 * payment.succeeded / subscription.renewed için periodEnd varsayılanı at + 30 gün.
 */
export function makeEvent(
  type: EventType,
  orderId: string,
  opts: { at?: number; amountKurus?: number; periodEnd?: number; eventId?: string } = {},
): PaymentEvent {
  const offset = opts.at ?? 0;
  const ev: PaymentEvent = {
    eventId: opts.eventId ?? newEventId(),
    type,
    orderId,
    occurredAt: at(offset),
  };
  if (opts.amountKurus !== undefined) ev.amountKurus = opts.amountKurus;
  if (type === 'payment.succeeded' || type === 'subscription.renewed') {
    ev.periodEnd = at(opts.periodEnd ?? offset + 30 * DAY);
  } else if (opts.periodEnd !== undefined) {
    ev.periodEnd = at(opts.periodEnd);
  }
  return ev;
}

export async function signed(t: TestApp, event: PaymentEvent): Promise<{ body: string; headers: Record<string, string> }> {
  return (await t.payments.sign(event as any)) as unknown as { body: string; headers: Record<string, string> };
}

export async function sendRaw(t: TestApp, body: string, headers: Record<string, string>) {
  return call(t, { method: 'POST', url: WEBHOOK_URL, body, headers });
}

export async function sendEvent(t: TestApp, event: PaymentEvent, extraHeaders: Record<string, string> = {}) {
  const s = await signed(t, event);
  return sendRaw(t, s.body, { ...s.headers, ...extraHeaders });
}

// ---------------------------------------------------------------------------
// Arka plan işleri ve firma kurulumu
// ---------------------------------------------------------------------------

export async function drainJobs(t: TestApp, rounds = 10) {
  for (let i = 0; i < rounds; i++) await t.runJobs();
}

export interface ProvisionerCall {
  op: 'createTenant' | 'freezeTenant';
  slug: string;
  [k: string]: unknown;
}

export function provisionerCalls(t: TestApp, op?: ProvisionerCall['op'], slug?: string): ProvisionerCall[] {
  return (t.provisioner.calls as unknown as ProvisionerCall[]).filter(
    (c) => (op === undefined || c.op === op) && (slug === undefined || c.slug === slug),
  );
}

export function cancelRequests(t: TestApp): string[] {
  return (t.payments.cancelRequests as unknown as unknown[]).map(String);
}

export function sameInstant(a: string, b: string) {
  expect(new Date(a).getTime()).toBe(new Date(b).getTime());
}
