import { randomBytes } from 'node:crypto';
import { inject } from 'vitest';
import { Client } from 'pg';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../../src/app';
import type { Config } from '../../src/config';
import { FakeClock } from '../../src/common/clock';
import { Db, type DbScope } from '../../src/db/db';
import { currentVersion } from '../../src/legal/documents';
import { InMemoryMailer, type SentMail } from '../../src/mail/mailer';
import { FakePaymentProvider, type PaymentEvent } from '../../src/payments/provider';
import { FakeProvisioner, type ProvisionerCall } from '../../src/provisioning/provisioner';
import { JobsService } from '../../src/jobs/jobs.service';
import { TEMPLATE_DB, TEST_ROLE_PASSWORDS } from './global-setup';

export const TEST_WEB_ORIGIN = 'http://localhost:3000';
export const TEST_ADMIN_EMAIL = 'ozan@moonvalesoft.test';

export interface TestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  /** `mv_session=...` biçiminde ya da sadece değer. */
  cookie?: string;
  headers?: Record<string, string>;
}

export interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string | string[] | undefined>;
  /** Yanıt oturum çerezi verdiyse `mv_session=...` (sonraki isteklerde `cookie` olarak verilebilir). */
  cookie?: string;
}

export interface TestApp {
  request(req: TestRequest): Promise<TestResponse>;
  mailer: { sent: SentMail[] };
  payments: {
    sign(event: PaymentEvent): { body: string; headers: Record<string, string> };
    cancelRequests: string[];
  };
  provisioner: { calls: ProvisionerCall[]; failNext(n: number): void };
  runJobs(): Promise<void>;
  clock: { advance(ms: number): void; now(): Date };
  registerAndLogin(email?: string, password?: string): Promise<{ cookie: string; user: any; password: string }>;
  config: Config;
  /** Sorguyu uygulamanın gerçek rolü (mv_app) ve verilen bağlamla çalıştırır (RLS testleri için). */
  sql(text: string, params?: unknown[], scope?: DbScope): Promise<any[]>;
  /** Sorguyu süper kullanıcıyla çalıştırır (katalog sorguları, RLS'i atlayarak kontrol). */
  adminSql(text: string, params?: unknown[]): Promise<any[]>;
  close(): Promise<void>;
}

/** Yürürlükteki yasal belge sürümleri: kayıt ve satın alma isteklerinde gönderilir. */
export const LEGAL = {
  notice: currentVersion('aydinlatma'),
  preInfo: currentVersion('on_bilgilendirme'),
  distanceSales: currentVersion('mesafeli_satis'),
};

export interface TestAppOptions {
  planPrices?: Record<string, number>;
  adminEmail?: string;
  rateLimits?: Partial<Config['rateLimits']>;
}

const WEBHOOK_SECRET = 'test-webhook-secret-test-webhook-secret';

export async function createTestApp(opts: TestAppOptions = {}): Promise<TestApp> {
  const adminUrl = inject('adminDbUrl');
  const dbName = `mv_t_${randomBytes(6).toString('hex')}`;
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${dbName} TEMPLATE ${TEMPLATE_DB}`);
  await admin.end();
  const u = new URL(adminUrl);
  u.pathname = `/${dbName}`;
  const adminDbUrl = u.toString();
  // Uygulama üretimdeki gibi mv_api ile bağlanır: süper kullanıcı değil, tablo sahibi değil.
  u.username = 'mv_api';
  u.password = TEST_ROLE_PASSWORDS.api;

  const config: Config = {
    databaseUrl: u.toString(),
    webOrigin: TEST_WEB_ORIGIN,
    port: 0,
    sessionSecure: false,
    planPrices: opts.planPrices ?? { 'randevu-aylik': 49900 },
    paymentProvider: 'fake',
    paymentWebhookSecret: WEBHOOK_SECRET,
    smtpUrl: 'smtp://unused',
    mailFrom: 'test@moonvalesoft.test',
    adminEmail: opts.adminEmail ?? TEST_ADMIN_EMAIL,
    randevuApiUrl: '',
    randevuApiKey: '',
    devPaymentsEnabled: true,
    trustedProxies: '127.0.0.1,::1',
    production: false,
    // Testlerde sınırlar varsayılan olarak geniş; sınırı deneyen test kendi değerini verir.
    rateLimits: { registerPerIpHour: 10_000, forgotPerEmailHour: 10_000, forgotPerIpHour: 10_000, loginPerIp15m: 10_000, ...opts.rateLimits },
  };
  const db = new Db(config.databaseUrl);
  const clock = new FakeClock();
  const mailer = new InMemoryMailer();
  const payments = new FakePaymentProvider(WEBHOOK_SECRET, TEST_WEB_ORIGIN);
  const provisioner = new FakeProvisioner();
  const app: NestFastifyApplication = await createApp({ config, db, clock, mailer, payments, provisioner }, { logger: false });
  const fastify = app.getHttpAdapter().getInstance();

  async function request(req: TestRequest): Promise<TestResponse> {
    const headers: Record<string, string> = { ...(req.headers ?? {}) };
    if (req.cookie) headers.cookie = req.cookie.includes('=') ? req.cookie : `mv_session=${req.cookie}`;
    let payload: string | undefined;
    if (req.body !== undefined) {
      payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['content-type'] = 'application/json';
    }
    const res = await fastify.inject({ method: req.method, url: req.url, headers, payload });
    let body: any = res.body;
    try {
      body = res.body ? JSON.parse(res.body) : undefined;
    } catch {
      /* düz metin */
    }
    const setCookie = res.headers['set-cookie'];
    const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const m = first?.match(/mv_session=([^;]*)/);
    return {
      status: res.statusCode,
      body,
      headers: res.headers as TestResponse['headers'],
      cookie: m && m[1] ? `mv_session=${m[1]}` : undefined,
    };
  }

  async function registerAndLogin(email?: string, password = 'cok-gizli-sifre-123') {
    const mail = email ?? `uye-${randomBytes(4).toString('hex')}@ornek.test`;
    const reg = await request({ method: 'POST', url: '/api/auth/register', body: { email: mail, password, name: 'Test Üye', noticeVersion: LEGAL.notice } });
    if (reg.status !== 202) throw new Error(`kayıt başarısız: ${reg.status}`);
    const verifyMail = [...mailer.sent].reverse().find((m) => m.to === mail.toLowerCase());
    const link = verifyMail?.links.find((l) => l.includes('/dogrula?token='));
    if (!link) throw new Error('doğrulama e-postası bulunamadı');
    const token = new URL(link).searchParams.get('token');
    const v = await request({ method: 'POST', url: '/api/auth/verify-email', body: { token } });
    if (v.status !== 200) throw new Error(`doğrulama başarısız: ${v.status}`);
    const login = await request({ method: 'POST', url: '/api/auth/login', body: { email: mail, password } });
    if (login.status !== 200 || !login.cookie) throw new Error(`giriş başarısız: ${login.status}`);
    return { cookie: login.cookie, user: login.body.user, password };
  }

  return {
    request,
    mailer,
    payments,
    provisioner,
    runJobs: () => app.get(JobsService).runDue({ ignoreSchedule: true }),
    clock,
    registerAndLogin,
    config,
    async sql(text, params = [], scope = 'none') {
      return (await db.tx((c) => c.query(text, params), scope)).rows;
    },
    async adminSql(text, params = []) {
      const a = new Client({ connectionString: adminDbUrl });
      await a.connect();
      try {
        return (await a.query(text, params)).rows;
      } finally {
        await a.end();
      }
    },
    async close() {
      await app.close();
      await db.close();
      const a = new Client({ connectionString: adminUrl });
      await a.connect();
      await a.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
      await a.end();
    },
  };
}
