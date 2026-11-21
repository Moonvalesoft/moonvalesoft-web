import { Inject, Injectable } from '@nestjs/common';
import { HOUR } from '../common/clock';
import { ApiError, notFound } from '../common/errors';
import { DEPS, type AppDeps } from '../deps';
import type { PublicUser } from '../auth/auth.service';
import { findPlan, toPublic } from '../catalog/plans';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
export const RESERVED_SLUGS = new Set(['www', 'api', 'admin', 'panel', 'destek', 'mail', 'app', 'moonvalesoft']);
/** Ödenmemiş bir sipariş, slug'ı başka üyelere karşı bu kadar süre tutar. */
const PENDING_HOLD_MS = 1 * HOUR;

export interface OrderView {
  id: string;
  planId: string;
  seats: number;
  amountKurus: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  companySlug: string | null;
  createdAt: string;
}

function view(r: any): OrderView {
  return {
    id: r.id,
    planId: r.plan_id,
    seats: r.seats,
    amountKurus: Number(r.amount_kurus),
    status: r.status,
    companySlug: r.company_slug,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

@Injectable()
export class OrdersService {
  constructor(@Inject(DEPS) private readonly deps: AppDeps) {}

  async checkout(user: PublicUser, body: Record<string, unknown>) {
    if (!user.emailVerified) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Satın almadan önce e-posta adresini doğrulamalısın.');
    }
    const planId = typeof body.planId === 'string' ? body.planId : '';
    const plan = findPlan(planId);
    if (!plan) throw notFound();
    const pub = toPublic(plan, this.deps.config.planPrices);
    if (!pub.purchasable || pub.priceKurus === null) {
      throw new ApiError(422, 'PLAN_NOT_PURCHASABLE', 'Bu paket şu an sitede satın alınamıyor.');
    }

    let seats = 1;
    if (plan.perSeat) {
      const s = body.seats;
      if (typeof s !== 'number' || !Number.isInteger(s) || s < 1 || s > 100) {
        throw new ApiError(400, 'VALIDATION', 'Kişi sayısı 1 ile 100 arasında olmalı.');
      }
      seats = s;
    }

    let slug: string | null = null;
    let companyName: string | null = null;
    if (plan.product === 'randevu') {
      slug = typeof body.companySlug === 'string' ? body.companySlug : '';
      if (!SLUG_RE.test(slug)) {
        throw new ApiError(400, 'INVALID_SLUG', 'Adres 3–30 karakter olmalı; küçük harf, rakam ve tire kullanabilirsin.');
      }
      companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
      if (companyName.length < 2 || companyName.length > 100) {
        throw new ApiError(400, 'VALIDATION', 'Firma adını yaz (2–100 karakter).');
      }
    }

    const amountKurus = pub.priceKurus * seats;
    const now = this.deps.clock.now();

    const order = await this.deps.db.tx(async (c) => {
      if (slug) {
        // Aynı slug'a aynı anda iki sipariş gelmesin.
        await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`slug:${slug}`]);
        if (RESERVED_SLUGS.has(slug) || (await this.slugTaken(c, slug, user.id, now))) {
          throw new ApiError(409, 'SLUG_TAKEN', 'Bu adres alınmış. Başka bir adres dene.');
        }
      }
      const r = await c.query(
        `INSERT INTO orders (user_id, plan_id, seats, amount_kurus, status, company_slug, company_name, created_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7) RETURNING *`,
        [user.id, plan.id, seats, amountKurus, slug, companyName, now],
      );
      return r.rows[0];
    });

    const { checkoutUrl } = await this.deps.payments.createCheckout({
      orderId: order.id,
      amountKurus,
      planId: plan.id,
      customerEmail: user.email,
    });
    return { orderId: order.id as string, checkoutUrl, amountKurus };
  }

  private async slugTaken(c: { query: Function }, slug: string, userId: string, now: Date): Promise<boolean> {
    const r = await (c as any).query(
      `SELECT 1 FROM orders
       WHERE company_slug = $1
         AND (status IN ('paid', 'refunded') OR (status = 'pending' AND user_id <> $2 AND created_at > $3))
       LIMIT 1`,
      [slug, userId, new Date(now.getTime() - PENDING_HOLD_MS)],
    );
    return r.rows.length > 0;
  }

  async get(user: PublicUser, id: string): Promise<OrderView> {
    if (!isUuid(id)) throw notFound();
    const r = await this.deps.db.one('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (!r) throw notFound();
    return view(r);
  }
}

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
