import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import argon2 from 'argon2';
import { z } from 'zod';
import { DAY, HOUR, MINUTE } from '../common/clock';
import { ApiError } from '../common/errors';
import { DEPS, type AppDeps } from '../deps';
import { mails } from '../mail/templates';
import { SystemScope } from '../db/scope';
import { hit, tooManyRequests } from '../common/rate-limit';
import { currentVersion, type RequestMeta } from '../legal/documents';
import { recordAcknowledgement, recordMarketingConsent } from '../legal/consents.service';

export const SESSION_COOKIE = 'mv_session';
export const SESSION_TTL_MS = 30 * DAY;
const VERIFY_TTL_MS = 24 * HOUR;
const RESET_TTL_MS = 1 * HOUR;
const LOGIN_WINDOW_MS = 15 * MINUTE;
const LOGIN_MAX_FAILURES = 5;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

function parseEmail(input: unknown): string {
  const r = emailSchema.safeParse(input);
  if (!r.success) throw new ApiError(400, 'INVALID_EMAIL', 'Geçerli bir e-posta adresi yaz.');
  return r.data;
}

function parsePassword(input: unknown): string {
  if (typeof input !== 'string' || input.length < 10) {
    throw new ApiError(400, 'WEAK_PASSWORD', 'Şifren en az 10 karakter olmalı.');
  }
  if (input.length > 200) throw new ApiError(400, 'VALIDATION', 'Şifre çok uzun.');
  return input;
}

function toPublic(row: { id: string; email: string; name: string; email_verified_at: Date | null }): PublicUser {
  return { id: row.id, email: row.email, name: row.name, emailVerified: row.email_verified_at !== null };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(@Inject(DEPS) private readonly deps: AppDeps) {}

  private get db() {
    return this.deps.db;
  }
  private now() {
    return this.deps.clock.now();
  }

  private async issueEmailToken(userId: string, purpose: 'verify_email' | 'reset_password', ttl: number) {
    const token = newToken();
    await this.db.query(
      'INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [hashToken(token), userId, purpose, new Date(this.now().getTime() + ttl)],
    );
    return token;
  }

  @SystemScope()
  async register(body: Record<string, unknown>, meta: RequestMeta = { ip: null, userAgent: null }): Promise<void> {
    const noticeVersion = currentVersion('aydinlatma');
    if (body.noticeVersion !== noticeVersion) {
      throw new ApiError(400, 'NOTICE_REQUIRED', 'Devam etmek için Aydınlatma Metni\'ni okuduğunu işaretle.');
    }
    const marketingEmail = body.marketingEmail === true;
    const email = parseEmail(body.email);
    const password = parsePassword(body.password);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 100) throw new ApiError(400, 'VALIDATION', 'Adını yaz (2–100 karakter).');
    await this.limit(`register:ip:${meta.ip ?? '-'}`, this.deps.config.rateLimits.registerPerIpHour, HOUR);

    // Süre farkından hesabın varlığı anlaşılmasın: şifre her durumda hash'lenir, e-posta beklenmeden gönderilir.
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    const existing = await this.db.one('SELECT id FROM users WHERE lower(email) = $1', [email]);
    const origin = this.deps.config.webOrigin;
    if (existing) {
      const token = await this.issueEmailToken(existing.id, 'reset_password', RESET_TTL_MS);
      this.sendLater(mails.alreadyRegistered(email, `${origin}/sifre-sifirla?token=${token}`));
      return;
    }
    const now = this.now();
    const user = await this.db.tx(async (c) => {
      const u = (
        await c.query<{ id: string }>(
          'INSERT INTO users (email, name, password_hash, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id',
          [email, name, hash, now],
        )
      ).rows[0];
      if (!u) return undefined;
      // Aydınlatma metninin hangi sürümü gösterildi; kampanya izni yalnız işaretlendiyse.
      await recordAcknowledgement(c, u.id, 'aydinlatma', noticeVersion, null, meta, now);
      if (marketingEmail) await recordMarketingConsent(c, u.id, true, 'register', meta, now);
      return u;
    });
    if (!user) return; // aynı anda iki kayıt: ikincisi sessizce biter
    const token = await this.issueEmailToken(user.id, 'verify_email', VERIFY_TTL_MS);
    this.sendLater(mails.verifyEmail(email, `${origin}/dogrula?token=${token}`));
  }

  private async consumeToken(token: unknown, purpose: 'verify_email' | 'reset_password'): Promise<string> {
    if (typeof token !== 'string' || token.length < 10 || token.length > 200) {
      throw new ApiError(400, 'INVALID_TOKEN', 'Bağlantı geçersiz veya süresi dolmuş.');
    }
    const row = await this.db.one<{ user_id: string }>(
      `UPDATE email_tokens SET used_at = $3
       WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > $3
       RETURNING user_id`,
      [hashToken(token), purpose, this.now()],
    );
    if (!row) throw new ApiError(400, 'INVALID_TOKEN', 'Bağlantı geçersiz veya süresi dolmuş.');
    return row.user_id;
  }

  @SystemScope()
  async verifyEmail(body: Record<string, unknown>): Promise<void> {
    const userId = await this.consumeToken(body.token, 'verify_email');
    await this.db.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, $2) WHERE id = $1', [userId, this.now()]);
  }

  @SystemScope()
  async login(
    body: Record<string, unknown>,
    meta: RequestMeta = { ip: null, userAgent: null },
  ): Promise<{ user: PublicUser; sessionToken: string }> {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre yanlış.');
    // Aynı adresten çok sayıda e-postaya şifre denemesi (password spraying) için IP sınırı.
    await this.limit(`login:ip:${meta.ip ?? '-'}`, this.deps.config.rateLimits.loginPerIp15m, LOGIN_WINDOW_MS);

    // Her deneme önce "hatalı" olarak, e-posta kilidi altında yazılır; şifre doğruysa bu satır silinir.
    // Böylece paralel istekler sınırı aşamaz (sayma ve yazma aynı işlemde).
    const since = new Date(this.now().getTime() - LOGIN_WINDOW_MS);
    const attemptId = await this.db.tx(async (c) => {
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`login:${email}`]);
      const n = (await c.query<{ n: number }>('SELECT count(*)::int AS n FROM login_failures WHERE lower(email) = $1 AND at > $2', [email, since])).rows[0].n;
      if (n >= LOGIN_MAX_FAILURES) return null;
      return (await c.query<{ id: string }>('INSERT INTO login_failures (email, at) VALUES ($1, $2) RETURNING id', [email, this.now()])).rows[0].id;
    });
    if (attemptId === null) {
      throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Çok fazla hatalı deneme yaptın. 15 dakika sonra tekrar dene.');
    }

    const user = await this.db.one(
      'SELECT id, email, name, password_hash, email_verified_at FROM users WHERE lower(email) = $1',
      [email],
    );
    // Kullanıcı yokken de hash doğrulaması yap ki süre farkından hesap varlığı anlaşılmasın.
    const ok = user
      ? await argon2.verify(user.password_hash, password).catch(() => false)
      : (await argon2.verify(await dummyHash(), password).catch(() => false)) && false;
    if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre yanlış.');
    await this.db.query('DELETE FROM login_failures WHERE id = $1', [attemptId]);
    if (!user.email_verified_at) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Önce e-posta adresini doğrulamalısın. Gelen kutuna bak.');
    }
    const sessionToken = newToken();
    const now = this.now();
    await this.db.query('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)', [
      hashToken(sessionToken),
      user.id,
      now,
      new Date(now.getTime() + SESSION_TTL_MS),
    ]);
    return { user: toPublic(user), sessionToken };
  }

  @SystemScope()
  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) return;
    await this.db.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(sessionToken)]);
  }

  @SystemScope()
  async userFromSession(sessionToken: string | undefined): Promise<PublicUser | null> {
    if (!sessionToken || sessionToken.length > 200) return null;
    const row = await this.db.one(
      `SELECT u.id, u.email, u.name, u.email_verified_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > $2`,
      [hashToken(sessionToken), this.now()],
    );
    return row ? toPublic(row) : null;
  }

  @SystemScope()
  async forgotPassword(body: Record<string, unknown>, meta: RequestMeta = { ip: null, userAgent: null }): Promise<void> {
    const limits = this.deps.config.rateLimits;
    await this.limit(`forgot:ip:${meta.ip ?? '-'}`, limits.forgotPerIpHour, HOUR);
    const r = emailSchema.safeParse(body.email);
    if (!r.success) return; // yanıt her durumda aynı
    // Bir adrese saatte en fazla birkaç e-posta: aşılırsa sessizce gönderilmez (yanıt yine aynı).
    const allowed = await this.db.tx((c) => hit(c, `forgot:email:${r.data}`, limits.forgotPerEmailHour, HOUR, this.now()));
    if (!allowed) return;
    const user = await this.db.one('SELECT id FROM users WHERE lower(email) = $1', [r.data]);
    if (!user) return;
    const token = await this.issueEmailToken(user.id, 'reset_password', RESET_TTL_MS);
    this.sendLater(mails.resetPassword(r.data, `${this.deps.config.webOrigin}/sifre-sifirla?token=${token}`));
  }

  private async limit(key: string, max: number, windowMs: number) {
    const ok = await this.db.tx((c) => hit(c, key, max, windowMs, this.now()));
    if (!ok) throw tooManyRequests();
  }

  /** E-postayı beklemeden gönderir: yanıt süresi e-posta sunucusuna ve hesabın varlığına bağlı olmasın. */
  private sendLater(message: Parameters<AppDeps['mailer']['send']>[0]) {
    this.deps.mailer.send(message).catch((e) => this.logger.error(`E-posta gönderilemedi: ${(e as Error).message}`));
  }

  @SystemScope()
  async resetPassword(body: Record<string, unknown>): Promise<void> {
    const password = parsePassword(body.password);
    const userId = await this.consumeToken(body.token, 'reset_password');
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    await this.db.tx(async (c) => {
      // Sıfırlama bağlantısı e-postaya gittiği için adres de doğrulanmış sayılır.
      await c.query('UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, $3) WHERE id = $1', [
        userId,
        hash,
        this.now(),
      ]);
      await c.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      await c.query("UPDATE email_tokens SET used_at = $2 WHERE user_id = $1 AND purpose = 'reset_password' AND used_at IS NULL", [
        userId,
        this.now(),
      ]);
    });
  }
}

// Var olmayan kullanıcı için de aynı maliyette bir doğrulama yapılsın diye (rastgele şifreli sabit hash).
let dummy: Promise<string> | undefined;
function dummyHash(): Promise<string> {
  dummy ??= argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id });
  return dummy;
}
