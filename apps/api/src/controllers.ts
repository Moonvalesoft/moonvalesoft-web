import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
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
  constructor(protected readonly auth: AuthService) {}
  protected async user(req: FastifyRequest): Promise<PublicUser> {
    const u = await this.auth.userFromSession(readCookie(req, SESSION_COOKIE));
    if (!u) throw unauthenticated();
    return u;
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
  async register(@Body() b: unknown) {
    await this.auth.register(body(b));
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
    @Inject(DEPS) private readonly deps: AppDeps,
  ) {
    super(auth);
  }

  @Get('me')
  async me(@Req() req: FastifyRequest) {
    return this.user(req);
  }

  @Get('plans')
  plans() {
    return publicPlans(this.deps.config.planPrices);
  }

  @Post('checkout')
  @HttpCode(201)
  async checkout(@Req() req: FastifyRequest, @Body() b: unknown) {
    return this.orders.checkout(await this.user(req), body(b));
  }

  @Get('orders/:id')
  async order(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.orders.get(await this.user(req), id);
  }

  @Get('subscriptions')
  async subscriptions(@Req() req: FastifyRequest) {
    return this.account.subscriptions(await this.user(req));
  }

  @Post('subscriptions/:id/cancel')
  @HttpCode(200)
  async cancel(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.account.cancelSubscription(await this.user(req), id);
  }

  @Get('invoices')
  async invoices(@Req() req: FastifyRequest) {
    return this.account.invoices(await this.user(req));
  }

  @Get('invoices/:id')
  async invoice(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.account.invoice(await this.user(req), id);
  }

  @Post('tickets')
  @HttpCode(201)
  async createTicket(@Req() req: FastifyRequest, @Body() b: unknown) {
    return this.account.createTicket(await this.user(req), body(b));
  }

  @Get('tickets')
  async tickets(@Req() req: FastifyRequest) {
    return this.account.tickets(await this.user(req));
  }

  @Get('tickets/:id')
  async ticket(@Req() req: FastifyRequest, @Param('id') id: string) {
    return this.account.ticket(await this.user(req), id);
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
    super(auth);
  }

  @Post(':orderId/:result')
  @HttpCode(200)
  async complete(@Req() req: FastifyRequest, @Param('orderId') orderId: string, @Param('result') result: string) {
    const provider = this.deps.payments;
    if (!this.deps.config.devPaymentsEnabled || !(provider instanceof FakePaymentProvider)) throw notFound();
    if (result !== 'basarili' && result !== 'basarisiz') throw notFound();
    const order = await this.orders.get(await this.user(req), orderId);
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
    return this.orders.get(await this.user(req), orderId);
  }
}
