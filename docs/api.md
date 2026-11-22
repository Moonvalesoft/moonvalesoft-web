# API sözleşmesi (v0)

Kabul testleri (qa) ve kod (backend) bu dosyaya göre yazılır. Değişiklik önce burada yapılır.

Bütün yollar `/api` ile başlar. Gövde JSON'dur. Tutarlar **kuruş** cinsinden tam sayıdır. Zamanlar ISO 8601, UTC.
Hata gövdesi her zaman: `{ "code": "MAKİNE_KODU", "message": "Türkçe açıklama" }`.

## Oturum

- Girişte `mv_session` çerezi verilir: `HttpOnly`, `SameSite=Lax`, `Path=/`, üretimde `Secure`. Ömür 30 gün; şifre değişince bütün oturumlar kapanır.
- Durum değiştiren isteklerde (`POST`, `PUT`, `PATCH`, `DELETE`) `Origin` başlığı varsa `WEB_ORIGIN` ile aynı olmalı, değilse `403 BAD_ORIGIN`. (Webhook bu kuraldan muaftır.)
- Giriş gerektiren uçta oturum yoksa `401 UNAUTHENTICATED`.
- Bir üyenin başkasına ait kaydı (sipariş, abonelik, fatura, talep) istemesi her zaman `404 NOT_FOUND` döner (`403` değil — kaydın varlığı sızmasın).

## Üyelik

| Uç | Gövde | Sonuç |
| --- | --- | --- |
| `POST /api/auth/register` | `{ email, password, name }` | Her zaman `202 { ok: true }` (e-posta kayıtlı olsa bile; kayıtlıysa "zaten hesabın var" e-postası gider). Şifre en az 10 karakter, değilse `400 WEAK_PASSWORD`. Geçersiz e-posta `400 INVALID_EMAIL`. Doğrulama e-postası gider. |
| `POST /api/auth/verify-email` | `{ token }` | `200 { ok: true }`. Token tek kullanımlık, 24 saat geçerli; aksi `400 INVALID_TOKEN`. |
| `POST /api/auth/login` | `{ email, password }` | `200 { user }` + çerez. Yanlış bilgi `401 INVALID_CREDENTIALS`. E-posta doğrulanmamış `403 EMAIL_NOT_VERIFIED`. Aynı e-postaya 15 dakikada 5 hatalı denemeden sonra `429 TOO_MANY_ATTEMPTS` (doğru şifre girilse bile). |
| `POST /api/auth/logout` | — | `204`, oturum sunucuda silinir. |
| `GET /api/me` | — | `200 { id, email, name, emailVerified }` veya `401`. |
| `POST /api/auth/forgot-password` | `{ email }` | Her zaman `202 { ok: true }`. Kayıtlıysa sıfırlama e-postası gider. |
| `POST /api/auth/reset-password` | `{ token, password }` | `200 { ok: true }`, bütün oturumlar kapanır. Token tek kullanımlık, 1 saat; aksi `400 INVALID_TOKEN`. |

E-postadaki bağlantılar: `${WEB_ORIGIN}/dogrula?token=...` ve `${WEB_ORIGIN}/sifre-sifirla?token=...`.

## Katalog

`GET /api/plans` (girişsiz) → dizi:

```json
{ "id": "randevu-aylik", "product": "randevu", "name": "Moonvale Randevu", "interval": "month",
  "priceKurus": 49900, "perSeat": true, "purchasable": true }
```

- Fiyatı tanımlanmamış plan `priceKurus: null, purchasable: false` döner (Ozan fiyat girene kadar).
- `logo-erp` planı her zaman `purchasable: false` (teklifle satılır).
- Fiyatlar `PLAN_PRICES` ortam değişkeninden gelir: `randevu-aylik=49900,crm-aylik=...`.

## Satın alma

`POST /api/checkout` (giriş + doğrulanmış e-posta gerekir)

```json
{ "planId": "randevu-aylik", "seats": 3, "companySlug": "ayse-kuafor", "companyName": "Ayşe Kuaför" }
```

- `seats`: `perSeat` planlarda 1–100 arası tam sayı; değilse yok sayılır (1).
- `companySlug`, `companyName`: sadece `randevu` ürününde zorunlu. Slug `^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$`; ayrılmış adlar (`www`, `api`, `admin`, `panel`, `destek`, `mail`, `app`, `moonvalesoft`) ve başka bir siparişin/aboneliğin aldığı slug → `409 SLUG_TAKEN`. Biçim hatası `400 INVALID_SLUG`.
- Satın alınamayan plan → `422 PLAN_NOT_PURCHASABLE`. Bilinmeyen plan `404 NOT_FOUND`.
- Sonuç `201 { orderId, checkoutUrl, amountKurus }`. `amountKurus = priceKurus × seats`; tutar sunucuda hesaplanır, istemciden gelmez.

`GET /api/orders/:id` → `200 { id, planId, seats, amountKurus, status, companySlug, createdAt }`. `status`: `pending | paid | failed | refunded`.

## Ödeme bildirimi (webhook)

`POST /api/webhooks/payments` — ham gövde, giriş gerekmez.

Sağlayıcıdan bağımsız iç olay biçimi (adaptör sağlayıcının olayını buna çevirir):

```json
{ "eventId": "evt_123", "type": "payment.succeeded", "orderId": "…", "occurredAt": "2026-11-21T10:00:00Z",
  "amountKurus": 149700, "periodEnd": "2026-12-21T10:00:00Z" }
```

`type`: `payment.succeeded | payment.failed | subscription.renewed | subscription.canceled | payment.refunded`.

Kurallar:
- İmza doğrulanmazsa `401 INVALID_SIGNATURE`, hiçbir şey değişmez.
- Aynı `eventId` ikinci kez gelirse `200`, hiçbir şey ikinci kez yapılmaz (ikinci fatura, ikinci firma kurulumu yok).
- Olaylar sırasız gelebilir. Abonelik durumu, o siparişin bütün olayları `occurredAt` sırasına konarak belirlenir; eski tarihli bir olay yeni tarihli bir olayın sonucunu ezmez.
- `amountKurus` siparişin tutarıyla tutmazsa olay kaydedilir ama sipariş ödenmiş sayılmaz (`200`, Ozan'a uyarı e-postası).
- Bilinmeyen `orderId` → `200`, kaydedilir, bir şey yapılmaz.

Etkileri:
- `payment.succeeded`: sipariş `paid`; abonelik `active` (`currentPeriodEnd = periodEnd`); fatura kesilir; `randevu` ise firma kurulum işi kuyruğa girer.
- `payment.failed`: sipariş `pending` ise `failed`; abonelik varsa `past_due`.
- `subscription.renewed`: abonelik `active`, `currentPeriodEnd` ilerler, yeni fatura.
- `subscription.canceled`: abonelik `canceled`; `randevu` ise firma dondurma işi kuyruğa girer (veri silinmez).
- `payment.refunded`: sipariş `refunded`, abonelik `canceled`, firma dondurulur.

## Abonelikler

- `GET /api/subscriptions` → üyenin kendi abonelikleri: `{ id, orderId, planId, product, seats, status, currentPeriodEnd, cancelAtPeriodEnd, companySlug, provisioning }`. `status`: `active | past_due | canceled`. `provisioning`: `none | pending | done | failed`.
- `POST /api/subscriptions/:id/cancel` → sağlayıcıda dönem sonunda iptal ister; `200` ve `cancelAtPeriodEnd: true`. Asıl iptal `subscription.canceled` olayıyla olur.

## Faturalar

- `GET /api/invoices` → `{ id, number, orderId, amountKurus, issuedAt }` dizisi, yeniden eskiye. Numara `MV-YYYY-000001` biçiminde, yıl içinde artan.
- `GET /api/invoices/:id`.
- Not: e-Arşiv entegrasyonu teyit edilecek; şimdilik bu kayıt "ödeme belgesi"dir.

## Destek talepleri

- `POST /api/tickets` `{ subject, message }` → `201 { id, subject, status: "open", createdAt }`. Konu 3–120, mesaj 10–5000 karakter; aksi `400 VALIDATION`. Ozan'a e-posta gider.
- `GET /api/tickets`, `GET /api/tickets/:id` → kendi talepleri (`messages` dizisiyle).

## Firma kurulumu (Randevu)

- Arka plan işleri `jobs` tablosundadır. `createTenant` ve `freezeTenant` işleri Randevu API'sine (`RANDEVU_API_URL`, `RANDEVU_API_KEY`) gider.
- Başarısız iş üstel bekleme ile tekrar denenir; 5. başarısızlıkta `failed` olur, abonelik `provisioning: failed`, Ozan'a e-posta gider.
- Aynı abonelik için firma iki kez açılmaz.

## Testler için yardımcı (`apps/api/test/helpers/app.ts`)

```ts
const t = await createTestApp({ planPrices: { 'randevu-aylik': 49900 } });
t.request({ method, url, body?, cookie?, headers? }) // → { status, body, headers, cookie? }
t.mailer.sent            // gönderilen e-postalar: { to, subject, text, links: string[] }
t.payments.sign(event)   // → { body: string, headers } imzalı webhook isteği
t.payments.cancelRequests // sağlayıcıya giden iptal istekleri (orderId listesi)
t.provisioner.calls      // { op: 'createTenant' | 'freezeTenant', slug, ... }
t.provisioner.failNext(n)// sonraki n çağrı hata versin
t.runJobs()              // kuyruğu bir tur işler (bekleme süresi atlanır)
t.clock.advance(ms)      // uygulamanın saatini ileri alır
t.registerAndLogin(email?) // → { cookie, user } hazır doğrulanmış üye
t.close()
```

Her `createTestApp` boş bir veritabanıyla başlar.
