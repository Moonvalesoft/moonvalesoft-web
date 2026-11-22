import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApiError, notFound } from '../common/errors';
import { DEPS, type AppDeps } from '../deps';
import type { PublicUser } from '../auth/auth.service';
import { mails } from '../mail/templates';
import { isUuid } from '../orders/orders.service';

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);

function subView(r: any) {
  return {
    id: r.id,
    orderId: r.order_id,
    planId: r.plan_id,
    product: r.product,
    seats: r.seats,
    status: r.status,
    currentPeriodEnd: iso(r.current_period_end),
    cancelAtPeriodEnd: r.cancel_at_period_end,
    companySlug: r.company_slug,
    provisioning: r.provisioning,
  };
}

function invoiceView(r: any) {
  return { id: r.id, number: r.number, orderId: r.order_id, amountKurus: Number(r.amount_kurus), issuedAt: iso(r.issued_at) };
}

/** Üyenin kendi kayıtları. Her sorgu user_id ile sınırlıdır; başkasının kaydı 404 döner. */
@Injectable()
export class AccountService {
  private readonly logger = new Logger('Account');

  constructor(@Inject(DEPS) private readonly deps: AppDeps) {}

  async subscriptions(user: PublicUser) {
    const r = await this.deps.db.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
    return r.rows.map(subView);
  }

  async cancelSubscription(user: PublicUser, id: string) {
    if (!isUuid(id)) throw notFound();
    const sub = await this.deps.db.one('SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (!sub) throw notFound();
    if (sub.status === 'canceled') throw new ApiError(409, 'ALREADY_CANCELED', 'Bu abonelik zaten iptal edilmiş.');
    if (!sub.cancel_at_period_end) {
      await this.deps.payments.cancelSubscription(sub.order_id);
      await this.deps.db.query('UPDATE subscriptions SET cancel_at_period_end = true WHERE id = $1', [id]);
    }
    return subView({ ...sub, cancel_at_period_end: true });
  }

  async invoices(user: PublicUser) {
    const r = await this.deps.db.query('SELECT * FROM invoices WHERE user_id = $1 ORDER BY issued_at DESC, number DESC', [user.id]);
    return r.rows.map(invoiceView);
  }

  async invoice(user: PublicUser, id: string) {
    if (!isUuid(id)) throw notFound();
    const r = await this.deps.db.one('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (!r) throw notFound();
    return invoiceView(r);
  }

  async createTicket(user: PublicUser, body: Record<string, unknown>) {
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (subject.length < 3 || subject.length > 120) throw new ApiError(400, 'VALIDATION', 'Konu 3–120 karakter olmalı.');
    if (message.length < 10 || message.length > 5000) throw new ApiError(400, 'VALIDATION', 'Mesaj 10–5000 karakter olmalı.');
    const now = this.deps.clock.now();
    const ticket = await this.deps.db.tx(async (c) => {
      const t = (await c.query("INSERT INTO tickets (user_id, subject, status, created_at) VALUES ($1, $2, 'open', $3) RETURNING *", [user.id, subject, now])).rows[0];
      await c.query("INSERT INTO ticket_messages (ticket_id, author, body, created_at) VALUES ($1, 'customer', $2, $3)", [t.id, message, now]);
      return t;
    });
    const to = this.deps.config.adminEmail;
    if (to) {
      await this.deps.mailer
        .send(mails.adminAlert(to, `Yeni destek talebi: ${subject}`, `${user.name} <${user.email}> yazdı:\n\n${message}\n\nTalep no: ${ticket.id}`))
        .catch((e) => this.logger.error(e));
    }
    return { id: ticket.id, subject: ticket.subject, status: ticket.status, createdAt: iso(ticket.created_at) };
  }

  async tickets(user: PublicUser) {
    const r = await this.deps.db.query('SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
    return r.rows.map((t) => ({ id: t.id, subject: t.subject, status: t.status, createdAt: iso(t.created_at) }));
  }

  async ticket(user: PublicUser, id: string) {
    if (!isUuid(id)) throw notFound();
    const t = await this.deps.db.one('SELECT * FROM tickets WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (!t) throw notFound();
    const msgs = await this.deps.db.query('SELECT author, body, created_at FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at', [id]);
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      createdAt: iso(t.created_at),
      messages: msgs.rows.map((m) => ({ author: m.author, body: m.body, createdAt: iso(m.created_at) })),
    };
  }
}
