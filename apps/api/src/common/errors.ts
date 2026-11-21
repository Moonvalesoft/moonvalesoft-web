import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = () => new ApiError(404, 'NOT_FOUND', 'Kayıt bulunamadı.');
export const unauthenticated = () => new ApiError(401, 'UNAUTHENTICATED', 'Bu işlem için giriş yapmalısın.');
export const validation = (message = 'Gönderilen bilgiler geçersiz.') => new ApiError(400, 'VALIDATION', message);

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Api');

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    if (exception instanceof ApiError) {
      void reply.status(exception.status).send({ code: exception.code, message: exception.message });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION' : 'HTTP_ERROR';
      void reply.status(status).send({ code, message: exception.message });
      return;
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    void reply.status(500).send({ code: 'INTERNAL', message: 'Beklenmeyen bir hata oldu. Tekrar dene.' });
  }
}
