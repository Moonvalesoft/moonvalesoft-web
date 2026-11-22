import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { ApiError } from '../common/errors';
import { SystemScope } from '../db/scope';
import { DEPS, type AppDeps } from '../deps';
import { findPlan } from '../catalog/plans';
import { enqueueJob } from '../jobs/jobs.service';
import { mails } from '../mail/templates';
import { isUuid } from '../orders/orders.service';
import type { PaymentEvent } from '../payments/provider';

interface StoredEvent {
  event_id: string;
  type: PaymentEvent['type'];
  occurred_at: Date;
  period_end: Date | null;
}

interface DerivedState {
  orderStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  hasSubscription: boolean;
  subStatus: 'active' | 'past_due' | 'canceled';
  periodEnd: Date | null;
}

/**
 * Bir siparişin bütün geçerli olaylarını occurredAt sırasına koyup son durumu hesaplar.
 * Olaylar sırasız gelse de sonuç aynı olur; eski tarihli olay yenisini ezmez.
 */
export function deriveState(events: StoredEvent[]): DerivedState {
  const sorted = [...events].sort(
    (a, b) => a.occurred_at.getTime() - b.occurred_at.getTime() || a.event_id.localeCompare(b.event_id),
  );
  const s: DerivedState = { orderStatus: 'pending', hasSubscription: false, subStatus: 'active', periodEnd: null };
  let ended = false; // iptal ve iade kalıcıdır
  for (const e of sorted) {
    switch (e.type) {
      case 'payment.succeeded':
        if (s.orderStatus !== 'refunded') s.orderStatus = 'paid';
        s.hasSubscription = true;
        if (!ended) s.subStatus = 'active';
        if (e.period_end) s.periodEnd = e.period_end;
        break;
      case 'payment.failed':
        if (s.orderStatus === 'pending') s.orderStatus = 'failed';
        if (s.hasSubscription && !ended && s.subStatus === 'active') s.subStatus = 'past_due';
        break;
      case 'subscription.renewed':
        if (!ended && s.hasSubscription) s.subStatus = 'active';
        if (e.period_end) s.periodEnd = e.period_end;
        break;
      case 'subscription.canceled':
        ended = true;
        s.subStatus = 'canceled';
        break;
      case 'payment.refunded':
        ended = true;
        s.orderStatus = 'refunded';
        s.subStatus = 'canceled';
        break;
    }
  }
  return s;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('Webhooks');

  constructor(@Inject(DEPS) private readonly deps: AppDeps) {}

  @SystemScope()
  async handle(rawBody: string, headers: Record<string, string | string[] | undefined>, sourceIp: string | null = null): Promise<void> {
    const event = this.deps.payments.parseWebhook(rawBody, headers);
    if (!event) {
      const digest = createHash('sha256').update(rawBody).digest('hex').slice(0, 16);
      this.logger.warn(`İmzası doğrulanamayan ödeme bildirimi reddedildi (ip ${sourceIp ?? '-'}, gövde ${digest}, ${rawBody.length} bayt)`);
      throw new ApiError(401, 'INVALID_SIGNATURE', 'İmza geçersiz.');
    }
    const alerts: [string, string][] = [];
    await this.deps.db.tx(async (c) => {
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`order:${event.orderId}`]);
      const now = this.deps.clock.now();
      const order = isUuid(event.orderId)
        ? (await c.query('SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1', [event.orderId])).rows[0]
        : undefined;

      let valid = Boolean(order);
      const carriesMoney = event.type === 'payment.succeeded' || event.type === 'subscription.renewed';
      if (order && carriesMoney && event.amountKurus !== Number(order.amount_kurus)) {
        valid = false;
        alerts.push([
          'Ödeme tutarı uyuşmuyor',
          `Sipariş ${order.id} için gelen ödeme tutarı (${event.amountKurus ?? 'yok'} kuruş) sipariş tutarıyla (${order.amount_kurus} kuruş) tutmuyor. Olay: ${event.eventId}. Sipariş ödenmiş sayılmadı.`,
        ]);
      }

      const inserted = await c.query(
        `INSERT INTO payment_events (event_id, order_id, type, occurred_at, amount_kurus, period_end, valid, payload, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
        [event.eventId, event.orderId, event.type, event.occurredAt, event.amountKurus ?? null, event.periodEnd ?? null, valid, JSON.stringify(event), now],
      );
      if (inserted.rowCount === 0) {
        alerts.length = 0; // tekrar gelen olay: hiçbir şey yapılmaz
        return;
      }
      if (!order || !valid) return;

      if (carriesMoney) await this.issueInvoice(c, order, event.eventId, now);
      await this.applyState(c, order, now, alerts);
    });
    for (const [subject, body] of alerts) await this.alert(subject, body);
  }

  private async issueInvoice(c: PoolClient, order: any, eventId: string, now: Date) {
    await c.query('SELECT pg_advisory_xact_lock(727002)');
    const year = now.getUTCFullYear();
    const prefix = `MV-${year}-`;
    const last = await c.query("SELECT number FROM invoices WHERE number LIKE $1 ORDER BY number DESC LIMIT 1", [`${prefix}%`]);
    const next = last.rows.length ? Number(String(last.rows[0].number).slice(prefix.length)) + 1 : 1;
    await c.query(
      `INSERT INTO invoices (number, user_id, order_id, event_id, amount_kurus, issued_at) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (event_id) DO NOTHING`,
      [`${prefix}${String(next).padStart(6, '0')}`, order.user_id, order.id, eventId, order.amount_kurus, now],
    );
  }

  private async applyState(c: PoolClient, order: any, now: Date, alerts: [string, string][]) {
    const events = (await c.query('SELECT event_id, type, occurred_at, period_end FROM payment_events WHERE order_id = $1 AND valid', [order.id])).rows;
    const s = deriveState(events);
    await c.query('UPDATE orders SET status = $2 WHERE id = $1', [order.id, s.orderStatus]);
    if (!s.hasSubscription) return;

    const plan = findPlan(order.plan_id);
    const product = plan?.product ?? 'unknown';
    const sub = (
      await c.query(
        `INSERT INTO subscriptions (order_id, user_id, plan_id, product, seats, status, current_period_end, company_slug, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end
         RETURNING *`,
        [order.id, order.user_id, order.plan_id, product, order.seats, s.subStatus, s.periodEnd, order.company_slug, now],
      )
    ).rows[0];

    if (product !== 'randevu' || !order.company_slug) return;
    if (s.subStatus !== 'canceled' && sub.provisioning === 'none') {
      // Aynı adres başka bir ödenmiş siparişe aitse (ör. ödenmemiş sipariş 1 saat sonra bırakıldı, sonra geç ödendi)
      // firma açılmaz; Ozan'a haber gider. İki ödeme aynı anda gelirse adres kilidi sıraya koyar.
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`slug:${order.company_slug}`]);
      const clash = await c.query(
        `SELECT o.id FROM orders o JOIN subscriptions s ON s.order_id = o.id
         WHERE o.company_slug = $1 AND o.id <> $2 AND s.provisioning <> 'none' LIMIT 1`,
        [order.company_slug, order.id],
      );
      if (clash.rows.length) {
        await c.query("UPDATE subscriptions SET provisioning = 'failed' WHERE id = $1", [sub.id]);
        alerts.push([
          `Adres çakışması: ${order.company_slug}`,
          `${order.company_slug}.moonvalesoft.com için ikinci bir ödeme geldi; firma açılmadı.\nYeni sipariş: ${order.id}\nAdresi tutan sipariş: ${clash.rows[0].id}\nMüşteriyle konuşup iade veya yeni adres gerekiyor.`,
        ]);
        return;
      }
      await enqueueJob(c, 'create_tenant', `create:${sub.id}`, {
        subscriptionId: sub.id,
        slug: order.company_slug,
        companyName: order.company_name,
        ownerEmail: order.user_email,
        ownerName: order.user_name,
        seats: order.seats,
      }, now);
      await c.query("UPDATE subscriptions SET provisioning = 'pending' WHERE id = $1", [sub.id]);
    } else if (s.subStatus === 'canceled' && sub.provisioning !== 'none') {
      await enqueueJob(c, 'freeze_tenant', `freeze:${sub.id}`, { subscriptionId: sub.id, slug: order.company_slug }, now);
    }
  }

  private async alert(subject: string, body: string) {
    this.logger.warn(body);
    const to = this.deps.config.adminEmail;
    if (!to) return;
    await this.deps.mailer.send(mails.adminAlert(to, subject, body)).catch((e) => this.logger.error(e));
  }
}
