import 'reflect-metadata';
import { Module, type DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { ApiErrorFilter } from './common/errors';
import { DEPS, type AppDeps } from './deps';
import { AuthService } from './auth/auth.service';
import { OrdersService } from './orders/orders.service';
import { AccountService } from './billing/account.service';
import { WebhooksService } from './billing/webhooks.service';
import { JobsService } from './jobs/jobs.service';
import { ConsentsService } from './legal/consents.service';
import { AccountController, AuthController, DevPaymentsController, WebhooksController } from './controllers';

@Module({})
class AppModule {
  static with(deps: AppDeps): DynamicModule {
    return {
      module: AppModule,
      controllers: [AuthController, AccountController, WebhooksController, DevPaymentsController],
      providers: [{ provide: DEPS, useValue: deps }, AuthService, OrdersService, AccountService, WebhooksService, JobsService, ConsentsService],
    };
  }
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function createApp(deps: AppDeps, opts: { logger?: boolean } = {}): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.with(deps),
    new FastifyAdapter({ bodyLimit: 256 * 1024, trustProxy: true }),
    { rawBody: true, logger: opts.logger === false ? false : undefined },
  );
  app.useGlobalFilters(new ApiErrorFilter());

  const fastify = app.getHttpAdapter().getInstance();
  // Başka sitelerden gelen durum değiştiren istekleri reddet (webhook hariç).
  fastify.addHook('onRequest', async (req, reply) => {
    if (!UNSAFE.has(req.method) || req.url.startsWith('/api/webhooks/')) return;
    const origin = req.headers.origin;
    if (origin !== undefined && origin !== deps.config.webOrigin) {
      return reply.status(403).send({ code: 'BAD_ORIGIN', message: 'İstek izin verilmeyen bir siteden geldi.' });
    }
  });
  fastify.addHook('onSend', async (_req, reply, payload) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('cache-control', 'no-store');
    return payload;
  });

  await app.init();
  return app;
}
