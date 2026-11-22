export interface Config {
  databaseUrl: string;
  webOrigin: string;
  port: number;
  sessionSecure: boolean;
  /** Plan fiyatları (kuruş). Tanımsız plan satışa kapalıdır. */
  planPrices: Record<string, number>;
  paymentProvider: 'fake';
  paymentWebhookSecret: string;
  smtpUrl: string;
  mailFrom: string;
  adminEmail: string;
  randevuApiUrl: string;
  randevuApiKey: string;
  /** Sahte ödeme sayfasının "öde" uç noktası açık mı (üretimde asla; geliştirmede de açıkça açılır). */
  devPaymentsEnabled: boolean;
  /** Fastify trustProxy: yalnız bu adreslerden gelen X-Forwarded-For'a güvenilir. Boşsa hiçbirine. */
  trustedProxies: string;
  production: boolean;
  rateLimits: RateLimits;
}

export interface RateLimits {
  registerPerIpHour: number;
  forgotPerEmailHour: number;
  forgotPerIpHour: number;
  loginPerIp15m: number;
}

export const DEFAULT_RATE_LIMITS: RateLimits = {
  registerPerIpHour: 10,
  forgotPerEmailHour: 3,
  forgotPerIpHour: 20,
  loginPerIp15m: 50,
};

export function parsePlanPrices(raw: string | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of (raw ?? '').split(',')) {
    const [id, value] = part.split('=').map((s) => s?.trim());
    if (!id || !value) continue;
    const n = Number(value);
    if (Number.isInteger(n) && n > 0) out[id] = n;
  }
  return out;
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const v = env[key];
  if (!v) throw new Error(`${key} ortam değişkeni eksik`);
  return v;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const provider = env.PAYMENT_PROVIDER ?? 'fake';
  if (provider !== 'fake') throw new Error(`Bilinmeyen ödeme sağlayıcısı: ${provider}`);
  if (production && provider === 'fake') {
    throw new Error('Üretimde sahte ödeme sağlayıcısı kullanılamaz');
  }
  const secret = required(env, 'PAYMENT_WEBHOOK_SECRET');
  if (production && secret.length < 32) throw new Error('PAYMENT_WEBHOOK_SECRET en az 32 karakter olmalı');
  const trustedProxies = (env.TRUSTED_PROXIES ?? (production ? '' : '127.0.0.1,::1')).trim();
  if (production && !trustedProxies) throw new Error('TRUSTED_PROXIES üretimde zorunlu (Caddy ve web adresleri)');
  const randevuApiUrl = env.RANDEVU_API_URL ?? '';
  const randevuApiKey = env.RANDEVU_API_KEY ?? '';
  if (randevuApiUrl) {
    if (randevuApiKey.length < 32) throw new Error('RANDEVU_API_URL tanımlıysa RANDEVU_API_KEY en az 32 karakter olmalı');
    const u = new URL(randevuApiUrl);
    const internal = !u.hostname.includes('.') || u.hostname === 'localhost';
    if (u.protocol !== 'https:' && !internal) throw new Error('RANDEVU_API_URL https olmalı (iç ağ adresi hariç)');
  }
  return {
    databaseUrl: required(env, 'DATABASE_URL'),
    webOrigin: env.WEB_ORIGIN ?? 'http://localhost:3000',
    port: Number(env.API_PORT ?? 4000),
    sessionSecure: production || env.SESSION_SECURE === 'true',
    planPrices: parsePlanPrices(env.PLAN_PRICES),
    paymentProvider: 'fake',
    paymentWebhookSecret: secret,
    smtpUrl: env.SMTP_URL ?? 'smtp://localhost:1025',
    mailFrom: env.MAIL_FROM ?? 'Moonvalesoft <merhaba@moonvalesoft.com>',
    adminEmail: env.ADMIN_EMAIL ?? '',
    randevuApiUrl,
    randevuApiKey,
    devPaymentsEnabled: !production && env.DEV_FAKE_PAYMENTS === 'true',
    trustedProxies,
    production,
    rateLimits: DEFAULT_RATE_LIMITS,
  };
}
