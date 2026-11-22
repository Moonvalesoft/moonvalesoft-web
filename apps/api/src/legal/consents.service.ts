import { Inject, Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { ApiError } from '../common/errors';
import { DEPS, type AppDeps } from '../deps';
import type { PublicUser } from '../auth/auth.service';
import { currentVersion, type RequestMeta } from './documents';

type Source = 'register' | 'panel' | 'unsubscribe_link';

export async function recordMarketingConsent(
  c: PoolClient,
  userId: string,
  granted: boolean,
  source: Source,
  meta: RequestMeta,
  now: Date,
) {
  await c.query(
    `INSERT INTO marketing_consents (user_id, channel, granted, text_version, source, ip, user_agent, created_at)
     VALUES ($1, 'email', $2, $3, $4, $5, $6, $7)`,
    [userId, granted, currentVersion('kampanya_izni'), source, meta.ip, meta.userAgent, now],
  );
}

export async function recordAcknowledgement(
  c: PoolClient,
  userId: string,
  document: 'aydinlatma' | 'on_bilgilendirme' | 'mesafeli_satis',
  version: string,
  orderId: string | null,
  meta: RequestMeta,
  now: Date,
) {
  await c.query(
    `INSERT INTO legal_acknowledgements (user_id, document, version, order_id, ip, user_agent, accepted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, document, version, orderId, meta.ip, meta.userAgent, now],
  );
}

/** Üyenin kampanya izni ve yasal onay kayıtları. Üye bağlamında çalışır (RLS). */
@Injectable()
export class ConsentsService {
  constructor(@Inject(DEPS) private readonly deps: AppDeps) {}

  async get(user: PublicUser) {
    const r = await this.deps.db.one(
      `SELECT granted, text_version, created_at FROM marketing_consents
       WHERE user_id = $1 AND channel = 'email' ORDER BY created_at DESC, seq DESC LIMIT 1`,
      [user.id],
    );
    return {
      marketingEmail: r
        ? { granted: r.granted as boolean, version: r.text_version as string, updatedAt: new Date(r.created_at).toISOString() }
        : { granted: false, version: null, updatedAt: null },
    };
  }

  async update(user: PublicUser, body: Record<string, unknown>, meta: RequestMeta) {
    if (typeof body.marketingEmail !== 'boolean') {
      throw new ApiError(400, 'VALIDATION', 'Kampanya izni için evet ya da hayır seç.');
    }
    const granted = body.marketingEmail;
    await this.deps.db.tx((c) => recordMarketingConsent(c, user.id, granted, 'panel', meta, this.deps.clock.now()));
    return this.get(user);
  }

  async acknowledgements(user: PublicUser) {
    const r = await this.deps.db.query(
      `SELECT document, version, order_id, accepted_at FROM legal_acknowledgements
       WHERE user_id = $1 ORDER BY accepted_at DESC, id`,
      [user.id],
    );
    return r.rows.map((x) => ({
      kind: x.document,
      version: x.version,
      orderId: x.order_id,
      acceptedAt: new Date(x.accepted_at).toISOString(),
    }));
  }
}
