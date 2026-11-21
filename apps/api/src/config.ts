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
  /** Sahte ödeme sayfasının "öde" uç noktası açık mı (üretimde asla). */
  devPaymentsEnabled: boolean;
}

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
    randevuApiUrl: env.RANDEVU_API_URL ?? '',
    randevuApiKey: env.RANDEVU_API_KEY ?? '',
    devPaymentsEnabled: !production,
  };
}
