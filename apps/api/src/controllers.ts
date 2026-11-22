import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { DAY } from './common/clock';
import { ApiError, notFound, unauthenticated } from './common/errors';
import { DEPS, type AppDeps } from './deps';
import { AuthService, SESSION_COOKIE, SESSION_TTL_MS, type PublicUser } from './auth/auth.service';
import { publicPlans } from './catalog/plans';
import { OrdersService } from './orders/orders.service';
import { AccountService } from './billing/account.service';
import { WebhooksService } from './billing/webhooks.service';
import { FakePaymentProvider } from './payments/provider';
import { LEGAL_DOCUMENTS, requestMeta } from './legal/documents';
import { ConsentsService } from './legal/consents.service';

export function readCookie(req: FastifyRequest, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

const body = (b: unknown): Record<string, unknown> => (b && typeof b === 'object' ? (b as Record<string, unknown>) : {});

abstract class WithSession {
  constructor(
    protected readonly auth: AuthService,
    protected readonly db: AppDeps['db'],
  ) {}
  protected async user(req: FastifyRequest): Promise<PublicUser> {
    const u = await this.auth.userFromSession(readCookie(req, SESSION_COOKIE));
    if (!u) throw unauthenticated();
    return u;
  }
  /** Oturumu doğrular, `fn` içindeki bütün sorguları bu üye adına (RLS) çalıştırır. */
  protected async as<T>(req: FastifyRequest, fn: (user: PublicUser) => Promise<T>): Promise<T> {
    const u = await this.user(req);
    return this.db.asUser(u.id, () => fn(u));
  }
}

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(DEPS) private readonly deps: AppDeps,
  ) {}

  private cookie(value: string, maxAgeSec: number) {
    const secure = this.deps.config.sessionSecure ? '; Secure' : '';
    return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
  }

  @Post('register')
  @HttpCode(202)
  async register(@Req() req: FastifyRequest, @Body() b: unknown) {
    await this.auth.register(body(b), requestMeta(req));
    return { ok: true };
  }

  @Post('verify-email')
  @HttpCode(200)
  async verify(@Body() b: unknown) {
    await this.auth.verifyEmail(body(b));
    return { ok: true };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() b: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const { user, sessionToken } = await this.auth.login(body(b));
    reply.header('set-cookie', this.cookie(sessionToken, SESSION_TTL_MS / 1000));
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.auth.logout(readCookie(req, SESSION_COOKIE));
    reply.header('set-cookie', this.cookie('', 0));
  }

  @Post('forgot-password')
  @HttpCode(202)
  async forgot(@Body() b: unknown) {
    await this.auth.forgotPassword(body(b));
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() b: unknown) {
    await this.auth.resetPassword(body(b));
    return { ok: true };
  }
}

@Controller('api')
export class AccountController extends WithSession {
  constructor(
    @Inject(AuthService) auth: AuthService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(AccountService) private readonly account: AccountService,
    @Inject(ConsentsService) private readonly consents: ConsentsService,
    @Inject(DEPS) private readonly deps: AppDeps,
  ) {
    super(auth, deps.db);
  }

  @Get('me')
  async me(@Req() req: FastifyRequest) {
    return this.user(req);
  }

  @Get('plans')
  plans() {
    return publicPlans(this.deps.config.planPrices);
  }

  @Get('legal')
  legal() {
    return LEGAL_DOCUMENTS;
  }

  @Get('me/consents')
  async getConsents(@Req() req: FastifyRequest) {
    return this.as(req, (u) => this.consents.get(u));
  }

  @Put('me/consents')
  @HttpCode(200)
  async putConsents(@Req() req: FastifyRequest, @Body() b: unknown) {
    return this.as(req, (u) => this.consents.update(u, body(b), requestMeta(req)));
  }

  @Get('me/legal')
  async myLegal(@Req() req: FastifyRequest) {
    return this.as(req, (u) => this.consents.acknowledgements(u));
  }

  @Post('checkout')
  @HttpCode(201)
  async checkout(@Req() req: FastifyRequest, @Body() b: unknown) {
    return this.as(req, (u) => this.orders.checkout(u, body(b), requestMeta(req)));
  }

  @Get('orders/:id')
  async order(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.as(req, (u) => this.orders.get(u, id));
  }

  @Get('subscriptions')
  async subscriptions(@Req() req: FastifyRequest) {
    return this.as(req, (u) => this.account.subscriptions(u));
  }

  @Post('subscriptions/:id/cancel')
  @HttpCode(200)
  async cancel(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.as(req, (u) => this.account.cancelSubscription(u, id));
  }

  @Get('invoices')
  async invoices(@Req() req: FastifyRequest) {
    return this.as(req, (u) => this.account.invoices(u));
  }

  @Get('invoices/:id')
  async invoice(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.as(req, (u) => this.account.invoice(u, id));
  }

  @Post('tickets')
  @HttpCode(201)
  async createTicket(@Req() req: FastifyRequest, @Body() b: unknown) {
    return this.as(req, (u) => this.account.createTicket(u, body(b)));
  }

  @Get('tickets')
  async tickets(@Req() req: FastifyRequest) {
    return this.as(req, (u) => this.account.tickets(u));
  }

  @Get('tickets/:id')
  async ticket(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.as(req, (u) => this.account.ticket(u, id));
  }
}

@Controller('api/webhooks')
export class WebhooksController {
  constructor(@Inject(WebhooksService) private readonly webhooks: WebhooksService) {}

  @Post('payments')
  @HttpCode(200)
  async payments(@Req() req: FastifyRequest & { rawBody?: Buffer | string }) {
    const raw = req.rawBody === undefined ? '' : req.rawBody.toString();
    await this.webhooks.handle(raw, req.headers);
    return { ok: true };
  }
}

/**
 * Yalnızca geliştirmede: /test-odeme sayfasındaki "Öde" düğmesi buraya gelir; sahte sağlayıcı adına
 * imzalı bir bildirim üretip webhook yolundan geçirir. Üretimde kapalıdır.
 */
@Controller('api/dev/fake-payments')
export class DevPaymentsController extends WithSession {
  constructor(
    @Inject(AuthService) auth: AuthService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(WebhooksService) private readonly webhooks: WebhooksService,
    @Inject(DEPS) private readonly deps: AppDeps,
  ) {
    super(auth, deps.db);
  }

  @Post(':orderId/:result')
  @HttpCode(200)
  async complete(@Req() req: FastifyRequest, @Param('orderId') orderId: string, @Param('result') result: string) {
    const provider = this.deps.payments;
    if (!this.deps.config.devPaymentsEnabled || !(provider instanceof FakePaymentProvider)) throw notFound();
    if (result !== 'basarili' && result !== 'basarisiz') throw notFound();
    const order = await this.as(req, (u) => this.orders.get(u, orderId));
    if (order.status !== 'pending' && order.status !== 'failed') {
      throw new ApiError(409, 'ALREADY_PROCESSED', 'Bu sipariş zaten işlenmiş.');
    }
    const now = this.deps.clock.now();
    const signed = provider.sign({
      eventId: `dev_${randomUUID()}`,
      type: result === 'basarili' ? 'payment.succeeded' : 'payment.failed',
      orderId,
      occurredAt: now.toISOString(),
      amountKurus: order.amountKurus,
      periodEnd: new Date(now.getTime() + 30 * DAY).toISOString(),
    });
    await this.webhooks.handle(signed.body, signed.headers);
    return this.as(req, (u) => this.orders.get(u, orderId));
  }
}
