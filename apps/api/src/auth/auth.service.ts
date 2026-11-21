import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { z } from 'zod';
import { DAY, HOUR, MINUTE } from '../common/clock';
import { ApiError } from '../common/errors';
import { DEPS, type AppDeps } from '../deps';
import { mails } from '../mail/templates';

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

  async register(body: Record<string, unknown>): Promise<void> {
    const email = parseEmail(body.email);
    const password = parsePassword(body.password);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 100) throw new ApiError(400, 'VALIDATION', 'Adını yaz (2–100 karakter).');

    const existing = await this.db.one('SELECT id FROM users WHERE lower(email) = $1', [email]);
    const origin = this.deps.config.webOrigin;
    if (existing) {
      // Hesabın varlığı yanıttan anlaşılmasın: aynı yanıt, farklı e-posta.
      const token = await this.issueEmailToken(existing.id, 'reset_password', RESET_TTL_MS);
      await this.deps.mailer.send(mails.alreadyRegistered(email, `${origin}/sifre-sifirla?token=${token}`));
      return;
    }
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.db.one<{ id: string }>(
      'INSERT INTO users (email, name, password_hash, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id',
      [email, name, hash, this.now()],
    );
    if (!user) return; // aynı anda iki kayıt: ikincisi sessizce biter
    const token = await this.issueEmailToken(user.id, 'verify_email', VERIFY_TTL_MS);
    await this.deps.mailer.send(mails.verifyEmail(email, name, `${origin}/dogrula?token=${token}`));
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

  async verifyEmail(body: Record<string, unknown>): Promise<void> {
    const userId = await this.consumeToken(body.token, 'verify_email');
    await this.db.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, $2) WHERE id = $1', [userId, this.now()]);
  }

  async login(body: Record<string, unknown>): Promise<{ user: PublicUser; sessionToken: string }> {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre yanlış.');

    const since = new Date(this.now().getTime() - LOGIN_WINDOW_MS);
    const failures = await this.db.one<{ n: string }>(
      'SELECT count(*) AS n FROM login_failures WHERE lower(email) = $1 AND at > $2',
      [email, since],
    );
    if (Number(failures?.n ?? 0) >= LOGIN_MAX_FAILURES) {
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
    if (!ok) {
      await this.db.query('INSERT INTO login_failures (email, at) VALUES ($1, $2)', [email, this.now()]);
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre yanlış.');
    }
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

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) return;
    await this.db.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(sessionToken)]);
  }

  async userFromSession(sessionToken: string | undefined): Promise<PublicUser | null> {
    if (!sessionToken || sessionToken.length > 200) return null;
    const row = await this.db.one(
      `SELECT u.id, u.email, u.name, u.email_verified_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > $2`,
      [hashToken(sessionToken), this.now()],
    );
    return row ? toPublic(row) : null;
  }

  async forgotPassword(body: Record<string, unknown>): Promise<void> {
    const r = emailSchema.safeParse(body.email);
    if (!r.success) return; // yanıt her durumda aynı
    const user = await this.db.one('SELECT id FROM users WHERE lower(email) = $1', [r.data]);
    if (!user) return;
    const token = await this.issueEmailToken(user.id, 'reset_password', RESET_TTL_MS);
    await this.deps.mailer.send(mails.resetPassword(r.data, `${this.deps.config.webOrigin}/sifre-sifirla?token=${token}`));
  }

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
