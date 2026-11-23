// Botu Worker adresine bağlar ve komut listesini ayarlar.
// Kullanım: TELEGRAM_TOKEN=... WEBHOOK_SECRET=... WORKER_URL=https://moonvalesoft-bot.<hesap>.workers.dev npm run webhook
const { TELEGRAM_TOKEN, WEBHOOK_SECRET, WORKER_URL } = process.env;
if (!TELEGRAM_TOKEN || !WEBHOOK_SECRET || !WORKER_URL) {
  console.error('TELEGRAM_TOKEN, WEBHOOK_SECRET ve WORKER_URL gerekli.');
  process.exit(1);
}
const call = async (method, params) => {
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  console.log(method, await r.text());
};
await call('setWebhook', { url: WORKER_URL, secret_token: WEBHOOK_SECRET, allowed_updates: ['message', 'callback_query'] });
await call('setMyCommands', { commands: [{ command: 'start', description: 'Teklif, şikâyet ya da öneri' }] });
