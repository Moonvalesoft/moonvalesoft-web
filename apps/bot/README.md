# Moonvalesoft Telegram botu

Siteden gelen kişiyi karşılar: **Teklif / Şikâyet / Öneri** seçtirir, teklifte ürünü sorar, talebi Ozanay'a iletir ve kişiye "24 saat içerisinde dönüş yapılacaktır" der. Ozanay iletilen talebi botta **yanıtlarsa** cevabı kişiye gider. Bot hiçbir şey kaydetmez; Cloudflare Workers'ın ücretsiz planında çalışır.

## Kurulum (bir kez, ~10 dakika)

1. **Botu aç:** Telegram'da [@BotFather](https://t.me/BotFather) → `/newbot` → ad: `Moonvalesoft`, kullanıcı adı: ör. `MoonvalesoftBot`. Verdiği **anahtarı (token)** sakla. İstersen `/setuserpic` ile profil resmini `design/brand/telegram-avatar.png` yap.
2. **Cloudflare:** ücretsiz hesap aç (https://dash.cloudflare.com). Bilgisayarında:
   ```bash
   cd apps/bot
   npx wrangler login
   npx wrangler secret put TELEGRAM_TOKEN      # BotFather anahtarı
   npx wrangler secret put WEBHOOK_SECRET      # rastgele uzun bir metin (ör. 40 harf)
   npx wrangler secret put OWNER_CHAT_ID       # şimdilik 0 yaz, 4. adımda düzeltilecek
   npm run yayinla                             # adresi yazar: https://moonvalesoft-bot.<hesap>.workers.dev
   ```
3. **Botu adrese bağla:**
   ```bash
   TELEGRAM_TOKEN=... WEBHOOK_SECRET=... WORKER_URL=https://moonvalesoft-bot.<hesap>.workers.dev npm run webhook
   ```
4. **Talepler sana gelsin:** botta `/kimim` yaz, verdiği sayıyı `npx wrangler secret put OWNER_CHAT_ID` ile gir.
5. **Siteyi bota bağla:** GitHub'da depo **Settings → Secrets and variables → Actions → Variables** → `TELEGRAM_BOT` = bot kullanıcı adı (@ olmadan). Sonra **Actions → Yayın → Run workflow**. Bütün "Teklif al" düğmeleri bota, ürünü seçili açılır.

## Kullanım

- Talep gelince sana: `🆕 Teklif · CRM` (ya da `⚠️ Şikâyet`, `💡 Öneri`), kimden, mesaj ve `#u…` etiketi. Düğmeye basmadan yazılan mesajlar `💬 Mesaj` başlığıyla gelir.
- Cevap vermek için o mesajı **yanıtla** (basılı tut → Yanıtla). Cevabın kişiye "Ozanay: …" diye gider.
- Metinler `src/bot.ts` içindeki `TEXT`; ürün listesi sitedekiyle aynı (`apps/web/lib/offerings.ts`).

## Geliştirme

```bash
npm test          # akış testleri
npm run typecheck
```
