import { handleUpdate } from './bot';
import { createApi, type Update } from './telegram';

export interface Env {
  TELEGRAM_TOKEN: string;
  WEBHOOK_SECRET: string;
  OWNER_CHAT_ID: string;
}

/** Cloudflare Worker: Telegram bildirimlerini (webhook) alır. Gizli anahtar başlığı tutmayan istek reddedilir. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return new Response('Moonvalesoft botu çalışıyor.', { status: 200 });
    if (request.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 });
    }
    let update: Update;
    try {
      update = (await request.json()) as Update;
    } catch {
      return new Response('bad request', { status: 400 });
    }
    try {
      await handleUpdate(update, { OWNER_CHAT_ID: env.OWNER_CHAT_ID ?? '' }, createApi(env.TELEGRAM_TOKEN));
    } catch (err) {
      // Telegram 200 almazsa aynı bildirimi tekrar tekrar yollar; hatayı kaydet, 200 dön.
      console.error(err);
    }
    return new Response('ok', { status: 200 });
  },
};
