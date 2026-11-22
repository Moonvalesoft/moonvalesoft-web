# Ekranlar: satın alma, üyelik ve panel (v0)

Sahibi: ui-ux. Frontend bu dosyaya ve tuvaldeki artboard'lara göre uygular; QA kabul testlerini buradan yazar.
API alanları ve hata kodları için kaynak: `docs/api.md`. Bu dosya ile api.md çelişirse api.md geçerlidir, bana bildir.

Tuval: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL (sayfa "Satın alma ve panel"). Artboard'lar **Gece** modunda çizildi; Gündüz hali aynı yerleşimle `design/tokens.json` → `color.gunduz` değerleriyle giydirilir.

## 0. Bütün ekranlar için ortak kurallar

- **Renk, yazı, aralık** yalnızca `design/tokens.json`'dan. Bileşende elle renk kodu yok.
- **Önerilen yeni token'lar (Ozan onayı bekliyor, onaylanınca tokens.json'a ben eklerim):**

  | Token | Gece | Gündüz | Neden |
  | --- | --- | --- | --- |
  | `danger` | `#FF9B9B` (zemin `#121833` üstünde 8.6:1) | `#B3261E` (beyaz üstünde 6.5:1) | Hata metni, hatalı alan çerçevesi, "Evet, iptal et" düğmesi. Şu an token'larda hata rengi yok. |
  | `inputBorder` | `#6B75A8` (`#121833` üstünde 3.9:1) | teyit edilecek (öneri `#8A91AD` civarı, 3:1 ölçülecek) | Form alanı çerçevesi. Mevcut `borderStrong` (`#3A4372`) 1.85:1, alanın sınırını göstermek için 3:1 gerekiyor (WCAG 1.4.11). |

  Onay gelene kadar frontend bunları geçici olarak tokens'a eklenmiş gibi kullanır (`var(--danger)`, `var(--input-border)`); renk kodunu bileşene yazmaz.
- **Bileşenler (shadcn/ui):** `Button`, `Input`, `Label`, `Textarea`, `Checkbox`, `Tabs` (giriş/kayıt), `Card`, `Badge` (durum etiketi), `AlertDialog` (iptal onayı), `Table` (faturalar), `Alert` (sayfa üstü hata). Yeni bileşen icat edilmez.
- **Dokunma alanı** en az 44 px; ana düğmeler 56 px, form alanları 52 px yüksek.
- **Odak:** her etkileşimli öğede `:focus-visible` → 2 px `accent` çerçeve, 2 px boşluk. Tab sırası görsel sırayla aynı.
- **Hata gösterimi:** alan hatası alanın hemen altında, ikon + metin, `danger` renkte; alan `aria-invalid="true"` ve `aria-describedby` ile hata metnine bağlı. Gönderim hatasında odak ilk hatalı alana gider. Sayfa düzeyindeki hata formun üstünde `Alert` (role="alert"). Renk tek başına anlam taşımaz: her durumda ikon ve metin var.
- **Yükleniyor:** düğme basılınca devre dışı kalır, metni değişir ("Gönderiliyor…" gibi, aşağıda her ekran için yazdım), iki kez gönderim olmaz. Sayfa verisi yüklenirken kart şeklinde iskelet (`Skeleton`), dönen çark değil.
- **Tutarlar** API'den kuruş gelir; ekranda `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })` ile gösterilir. **İstemci tutar hesaplamaz**, sunucunun `amountKurus` değerini gösterir. (İstisna: satın alma ekranındaki canlı önizleme; bkz. 3.)
- **Tarihler** `tr-TR`, uzun ay adıyla: "21 Aralık 2026". Zaman dilimi Europe/Istanbul.
- **Ses tonu:** "ben" dili, kısa cümle, teknik terim yok. Kullanıcıya "sen" diye hitap.
- **Gece/Gündüz:** her ekran iki modda da çalışır; seçim düğmesi başlıkta (`aria-label="Aydınlık moda geç"` / `"Karanlık moda geç"`). İki modda ekran görüntüsü PR'a eklenir.
- **Telefon:** önce 390 px. 390 px'de yatay kaydırma olmaz (tablo kendi kutusunda kayar). Panelin yan menüsü telefonda içeriğin üstüne yığılır.

### Ortak hata metinleri (her ekranda aynı)

| Durum | Kullanıcının göreceği metin | Davranış |
| --- | --- | --- |
| `401 UNAUTHENTICATED` | — (metin yok) | `/giris?sonra=<şu anki yol>` adresine yönlendir. Girişten sonra geri dön. |
| `403 BAD_ORIGIN` | "Bir şeyler ters gitti. Sayfayı yenileyip tekrar dene." | Normalde görülmez; görülürse hatayı kaydet (log). |
| `404 NOT_FOUND` (kayıt) | "Bunu bulamadım. Panelinden kontrol edebilirsin." + "Panelime git" bağlantısı | Başkasının kaydı da aynı metni görür; varlık sızdırılmaz. |
| Ağ hatası / zaman aşımı | "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene." | "Tekrar dene" düğmesi. |
| `5xx` / beklenmeyen kod | "Bir şeyler ters gitti, benim tarafımda. Birazdan tekrar dene." | "Tekrar dene" düğmesi. API'nin `message` alanı kullanıcıya **gösterilmez**; metinler buradan gelir. |

### Satın alma adım göstergesi

Satın alma akışındaki ekranların üstünde 4 adım: **Paket → Hesap → Bilgiler ve ödeme → Hazır**. `<ol aria-label="Satın alma adımları">`, şu anki adımda `aria-current="step"`, biten adımlarda tik ikonu + ekran okuyucu için "(tamamlandı)". Telefonda "Adım 3 / 4 · Bilgiler ve ödeme" metni + 4 parçalı çubuk (çubuk `aria-hidden`).

---

## 1. Hesap oluştur / Giriş yap

- **Yol:** `/kayit` (Hesap oluştur sekmesi açık) ve `/giris` (Giriş yap sekmesi açık). Aynı sayfa, iki sekme; sekme değişince adres de değişir (`history.replaceState`).
- **Sorgu:** `?sonra=<yol>` girişten sonra gidilecek yer (yalnızca site içi yol kabul edilir, `/` ile başlamalı, `//` ile başlamamalı). `?plan=<planId>` varsa sol tarafta paket özeti gösterilir.
- **Artboard:** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-Giris
- **Nereden gelir:** fiyat kartındaki "Satın al" (girişsizse), başlıktaki "Giriş yap" / "Hesap oluştur", 401 yönlendirmesi.
- **Amaç:** hesap açmak ya da giriş yapmak.
- **Sonra:** kayıt → `/kayit/eposta` durumu (bkz. 2). Giriş → `sonra` varsa oraya, yoksa `/panel`.

**Sol sütun (sadece `plan` varsa):** adım göstergesi (Adım 2), başlık "Önce seni tanıyayım.", paket kartı: ürün adı, "[FİYAT] ₺ · kişi başına · aylık" (`GET /api/plans`'tan), "Paketi değiştir" bağlantısı (→ `/#fiyatlar`). `plan` yoksa sadece form ortada, başlık "Hoş geldin.".

**Hesap oluştur alanları** (`POST /api/auth/register`):

| Etiket | Alan | Kural (istemci) | Not |
| --- | --- | --- | --- |
| Adın soyadın | `name` | boş olamaz | `autocomplete="name"` |
| E-posta | `email` | `type="email"` | `autocomplete="email"`, `inputmode="email"` |
| Şifre | `password` | en az 10 karakter | `autocomplete="new-password"`, "Şifreyi göster" ikon düğmesi (`aria-label` "Şifreyi göster" / "Şifreyi gizle"), ipucu "En az 10 karakter." |

Altında: "Kişisel verilerini nasıl kullandığımı KVKK aydınlatma metninde anlattım." (bağlantı `/kvkk`, metni hukukçu yazar).

**Giriş yap alanları** (`POST /api/auth/login`): E-posta, Şifre (`autocomplete="current-password"`, göster düğmesi), "Şifremi unuttum" bağlantısı (→ `/sifre-sifirla`).

**Durumlar**

| Durum | Görünüm |
| --- | --- |
| Boş | Alanlar boş, düğme etkin. İstemci doğrulaması alandan çıkınca (blur) ve gönderimde çalışır, yazarken değil. |
| Yükleniyor | Düğme devre dışı: "Hesap açılıyor…" / "Giriş yapılıyor…". |
| Başarılı (kayıt, `202`) | `/kayit/eposta` durumuna geç, e-posta adresini taşı. API e-posta zaten kayıtlı olsa da `202` döner; ekran **aynı** olmalı (hesabın varlığı sızmaz). |
| Başarılı (giriş, `200`) | `sonra`'ya ya da `/panel`'e git. |

**Hata kodları**

| Kod | Nerede | Metin |
| --- | --- | --- |
| `400 INVALID_EMAIL` | E-posta alanı altında | "Bu e-posta adresi geçerli görünmüyor. Kontrol edip tekrar yaz." |
| `400 WEAK_PASSWORD` | Şifre alanı altında | "Şifren en az 10 karakter olmalı." |
| `401 INVALID_CREDENTIALS` | Formun üstünde `Alert` | "E-posta ya da şifre yanlış. Tekrar dene ya da şifreni sıfırla." + "Şifremi unuttum" bağlantısı. Hangisinin yanlış olduğu söylenmez. |
| `403 EMAIL_NOT_VERIFIED` | Formun üstünde `Alert` | "Önce e-postanı doğrulaman gerekiyor. Gelen kutundaki bağlantıya tıkla." |
| `429 TOO_MANY_ATTEMPTS` | Formun üstünde `Alert` | "Çok fazla deneme oldu. 15 dakika bekleyip tekrar dene ya da şifreni sıfırla." Bu sürede düğme etkin kalır (sunucu yine 429 döner). |

**Telefon:** iki sütun alt alta; sol sütun telefonda tek satırlık paket özetine iner ("Moonvale Randevu · [FİYAT] ₺ / kişi / ay"), adım göstergesi kısa haliyle. Form tam genişlik.
**Gece/Gündüz:** seçili sekme hem zemin (`surfaceRaised`) hem `accent` çerçeve ile ayrılır, sadece renkle değil. Sekmeler `role="tablist"`, ok tuşlarıyla geçilir (shadcn `Tabs` bunu sağlar).

---

## 2. E-postanı kontrol et (kayıttan sonra)

- **Yol:** `/kayit/eposta` (kayıttan sonra istemci tarafında geçilir; e-posta adresi `history.state` ile taşınır, adres çubuğuna yazılmaz). Doğrudan açılırsa adres yerine "e-posta adresine" yazılır.
- **Artboard:** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-EpostaKontrol
- **Amaç:** kullanıcıya bir sonraki işi söylemek: e-postayı aç, bağlantıya tıkla.
- **İçerik:** başlık "E-postanı kontrol et.", metin "**<e-posta>** adresine bir bağlantı gönderdim. Bağlantıya tıkla, hesabın açılsın." Kutu "E-posta gelmedi mi?": spam klasörü, "Bağlantı 24 saat geçerli.", "Hâlâ gelmediyse [E-POSTA] adresinden bana yaz." Düğme "Adresi yanlış yazdım" → `/kayit`. Paket seçiliyse: "Seçtiğin paket kayıtlı: <ürün>. E-postanı doğrulayıp giriş yapınca kaldığın yerden devam edeceksin."
- **Kaldığın yer:** kayıt anında `sonra` değeri `localStorage['mv_next']`'e yazılır (e-postadaki bağlantı başka sekmede açılır). Doğrulama ve girişten sonra okunur ve silinir.
- **Durumlar:** sadece başarılı durum var. "Tekrar gönder" düğmesi **yok**, çünkü API'de bu uç yok (bkz. sorular).
- `role="status"` ile başlık ekran okuyucuya okunur.

---

## 3. E-posta doğrulama

- **Yol:** `/dogrula?token=...` (e-postadaki bağlantı).
- **Artboard:** ayrı çizilmedi; "E-postanı kontrol et" ekranının yerleşimini kullanır: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-EpostaKontrol
- **Amaç:** sayfa açılınca `POST /api/auth/verify-email { token }` kendiliğinden çağrılır. Kullanıcı bir şeye basmaz.
- **Sonra:** giriş yapılmış değildir (API çerez vermez) → "Giriş yap" düğmesi `/giris?sonra=<mv_next ya da /panel>`.

| Durum | Metin |
| --- | --- |
| Yükleniyor | Başlık "E-postanı doğruluyorum…" (`role="status"`) |
| Başarılı `200` | Başlık "E-postan doğrulandı." Metin "Giriş yap, kaldığın yerden devam et." Düğme "Giriş yap". |
| `400 INVALID_TOKEN` | Başlık "Bu bağlantı artık geçerli değil." Metin "Bağlantı 24 saat geçerli ve bir kez kullanılabilir. Daha önce tıkladıysan hesabın zaten açıktır, giriş yapmayı dene." Düğmeler "Giriş yap", "[E-POSTA] adresinden bana yaz". |
| `token` yok | `INVALID_TOKEN` ile aynı ekran. |

---

## 4. Şifre sıfırlama

- **Yol:** `/sifre-sifirla` (istek formu) ve `/sifre-sifirla?token=...` (yeni şifre formu; e-postadaki bağlantı).
- **Artboard:** ayrı çizilmedi; "Hesap oluştur / giriş yap" ekranındaki form kartı tek başına, ortada: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-Giris

**a) İstek** (`POST /api/auth/forgot-password { email }`)

| Durum | Görünüm |
| --- | --- |
| Boş | Başlık "Şifreni mi unuttun?" Metin "E-postanı yaz, sana yeni şifre bağlantısı göndereyim." Alan "E-posta". Düğme "Bağlantıyı gönder". |
| Yükleniyor | Düğme "Gönderiliyor…" |
| Başarılı `202` | "Bu adres kayıtlıysa bir bağlantı gönderdim. Bağlantı 1 saat geçerli." Kayıtlı olup olmadığı söylenmez. |
| `400 INVALID_EMAIL` (gelirse) | Alan altında "Bu e-posta adresi geçerli görünmüyor. Kontrol edip tekrar yaz." |

**b) Yeni şifre** (`POST /api/auth/reset-password { token, password }`)

| Durum | Görünüm |
| --- | --- |
| Boş | Başlık "Yeni şifreni belirle." Alan "Yeni şifre" (`autocomplete="new-password"`, göster düğmesi, ipucu "En az 10 karakter."). Düğme "Şifremi değiştir". |
| Yükleniyor | Düğme "Değiştiriliyor…" |
| Başarılı `200` | "Şifren değişti. Güvenliğin için bütün cihazlarda oturumun kapandı; yeni şifrenle giriş yap." Düğme "Giriş yap". |
| `400 WEAK_PASSWORD` | Alan altında "Şifren en az 10 karakter olmalı." |
| `400 INVALID_TOKEN` | "Bu bağlantının süresi dolmuş ya da kullanılmış. Bağlantı 1 saat geçerli." Düğme "Yeni bağlantı iste" → `/sifre-sifirla`. |

---

## 5. Satın alma: bilgiler ve ödeme

- **Yol:** `/satin-al/[planId]` (ör. `/satin-al/randevu-aylik`).
- **Artboard (masaüstü):** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-SatinAl
- **Artboard (telefon 390, "adres alınmış" hata durumuyla):** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-SatinAlTelefon
- **Giriş şartı:** oturum + doğrulanmış e-posta. Oturum yoksa sayfa açılmadan `/kayit?plan=<planId>&sonra=/satin-al/<planId>`'e yönlendirilir (yeni gelen çoğunlukla hesapsızdır, bu yüzden kayıt sekmesi).
- **Nereden gelir:** fiyat kartındaki "Satın al", girişten sonra `sonra` ile.
- **Amaç:** kişi sayısını ve salonun adresini seçip ödemeye geçmek.
- **Sonra:** `POST /api/checkout` → `201 { orderId, checkoutUrl, amountKurus }` → tarayıcı `checkoutUrl`'e gider (ödeme şirketinin sayfası/formu). Ödemeden dönüş adresi `/odeme/[orderId]`.

**Veri:** `GET /api/plans` → `planId` ile eşleşen plan. Plan yoksa ya da `purchasable: false` ise form gösterilmez (bkz. durumlar).

**Alanlar**

| Etiket | Gövde alanı | Kural | Not |
| --- | --- | --- | --- |
| Kaç kişi kullanacak? | `seats` | 1–100 tam sayı | Sadece `perSeat: true` planlarda görünür. − / + düğmeleri (`aria-label` "Bir kişi azalt" / "Bir kişi ekle"), arada sayı alanı. 1'de − devre dışı, 100'de + devre dışı. İpucu "Sen dahil, sisteme kendi telefonuyla girecek herkesi say. Her kişi kendi hesabıyla girer." Varsayılan 1. |
| Salonunun adı | `companyName` | boş olamaz | Sadece `product: "randevu"`. `autocomplete="organization"`. |
| Salonunun adresi | `companySlug` | `^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$` | Sadece `randevu`. Alanın sağında sabit ".moonvalesoft.com" eki (telefonda altında). Kullanıcı adresi elle değiştirene kadar adres, salon adından kendiliğinden üretilir: küçük harf, ç→c ğ→g ı→i ö→o ş→s ü→u, diğer karakterler "-", baştaki/sondaki tire silinir, en fazla 30 karakter. Yazarken büyük harf küçültülür. `autocapitalize="none"`, `spellcheck="false"`. |
| Onay kutusu | (API'de alan yok, bkz. sorular) | işaretli olmalı | "Ön bilgilendirme formunu ve mesafeli satış sözleşmesini okudum, kabul ediyorum." Bağlantılar `/on-bilgilendirme`, `/mesafeli-satis` (metinleri hukukçu yazar). |

**Canlı adres önizlemesi:** alanın altında kutu: "Müşterilerin seni burada bulacak" + `https://<slug>.moonvalesoft.com` (slug `accent` renkte). Boşken `salonun-adi` yazar. `aria-live` değil (her tuşta okunmasın).

**Özet kartı** (masaüstünde sağda, telefonda formun altında; telefonda ayrıca en üstte tek satır paket özeti):
- Ürün adı, "Aylık · kişi başına", "Değiştir" bağlantısı (→ `/#fiyatlar`).
- Kişi başı: "[FİYAT] ₺ / ay" (`priceKurus`).
- Kişi sayısı: "× <seats>" (canlı).
- Vergiler: [KDV NOTU] (KDV dahil mi, ayrıca mı eklenir: teyit edilecek).
- **Bugün ödeyeceğin:** `priceKurus × seats` canlı önizleme olarak gösterilir. Bu tek istemci hesabı; gönderimden sonra sunucunun `amountKurus` değeri ile karşılaştırılır, farklıysa yönlendirme yapılmaz, sayfa "Tutar değişti, lütfen kontrol et." uyarısıyla sunucunun tutarını gösterir.
- "Her ay aynı gün aynı tutar çekilir. İstediğin zaman panelinden iptal edersin; dönem sonuna kadar kullanmaya devam edersin."
- Onay kutusu, "Ödemeye geç" düğmesi, kilit ikonu + "Kart bilgini ödeme şirketinin güvenli formuna gireceksin. Kart bilgin bana gelmez, saklanmaz."

**Durumlar**

| Durum | Görünüm |
| --- | --- |
| Yükleniyor (plan) | Form ve özet kartı iskelet. |
| Boş | Kişi 1, salon adı ve adres boş, önizleme `salonun-adi`, onay kutusu işaretsiz. |
| İstemci hatası | Gönderimde: boş salon adı → "Salonunun adını yaz."; adres biçimi → aşağıdaki `INVALID_SLUG` metni; onay işaretsiz → kutunun altında "Devam etmek için sözleşmeyi onaylaman gerekiyor." Odak ilk hatalı alana. |
| Gönderiliyor | Düğme devre dışı, "Ödeme sayfası hazırlanıyor…" |
| Başarılı `201` | `checkoutUrl`'e yönlendir (aynı sekme). |
| Plan bulunamadı (`404 NOT_FOUND` ya da listede yok) | Başlık "Bu paketi bulamadım." Düğme "Paketlere bak" → `/#fiyatlar`. |
| Plan satılmıyor (`purchasable: false` ya da `422 PLAN_NOT_PURCHASABLE`) | Başlık "Bu paket henüz satışta değil." Metin "Hazır olunca haber vermemi istersen bana yaz." Düğme "Benimle konuş" → `/#iletisim`. `logo-erp` için: "Bu iş projeye göre fiyatlanıyor." Düğme "Teklif iste". |

**Hata kodları**

| Kod | Nerede | Metin |
| --- | --- | --- |
| `409 SLUG_TAKEN` | Adres alanı altında, alan çerçevesi `danger` 2 px, `aria-invalid` | "Bu adres alınmış. Sonuna semtini ekleyerek dene, ör. **<slug>-kadikoy**" (öneri sadece örnek metin, kontrol edilmiş değil). Odak adres alanına. |
| `400 INVALID_SLUG` | Adres alanı altında | "Adres 3–30 karakter olmalı; sadece küçük harf, rakam ve tire kullan. Başında ve sonunda tire olmasın." |
| `422 PLAN_NOT_PURCHASABLE` | Sayfa | Yukarıdaki "Bu paket henüz satışta değil." durumu. |
| `404 NOT_FOUND` | Sayfa | Yukarıdaki "Bu paketi bulamadım." durumu. |
| `403 EMAIL_NOT_VERIFIED` (gelirse) | Formun üstünde `Alert` | "Önce e-postanı doğrulaman gerekiyor. Gelen kutundaki bağlantıya tıkla." |
| `401 UNAUTHENTICATED` | — | Ortak kural: `/giris?sonra=/satin-al/<planId>`. Girilen bilgiler `sessionStorage`'da saklanır, dönünce geri doldurulur. |

Not: "Bu adres alınmış" bilgisi şimdilik ancak "Ödemeye geç"e basınca gelir (API'de anlık kontrol ucu yok). Biçim hatası ise yazarken, alandan çıkınca gösterilir.

**Telefon (390):** tek sütun, sıra: adım göstergesi (kısa) → başlık → tek satır paket özeti → kişi sayısı → salon → özet + onay + düğme. − / + düğmeleri 56 px, sayı alanı aradaki boşluğu doldurur. ".moonvalesoft.com" eki alanın altına iner. "Ödemeye geç" tam genişlik.
**Gece/Gündüz:** özet kartı Gece'de `surfaceRaised` + `accent` çerçeve; Gündüz'de `surface` + `accent` (`#1B2350`) çerçeve. Hata rengi `danger` token'ı.

---

## 6. Ödeme sonrası

- **Yol:** `/odeme/[orderId]` (ödeme şirketinden dönüş adresi; panelden de açılabilir).
- **Artboard'lar:**
  - Ödemen bekleniyor: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-OdemeBekleniyor
  - Hazırsın, salonun kuruluyor: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-Kuruluyor
  - Hazırsın, salonun açıldı: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-Kuruldu
- **Önemli:** tarayıcıdaki dönüş "ödeme başarılı" demek değildir. Ekran yalnızca `GET /api/orders/:id`'nin `status` alanına bakar; sorgu parametresindeki "success" gibi değerler yok sayılır.
- **Veri:** `GET /api/orders/:id` her 3 sn'de bir (sekme görünürken; `document.visibilityState`). `paid` olunca `GET /api/subscriptions` ile `orderId` eşleşen abonelik bulunur, `provisioning` her 5 sn'de bir sorgulanır. `done`, `failed`, `refunded` olunca sorgu durur. 10 dakikadan sonra sorgu durur ve "Sayfayı yenile" düğmesi çıkar.
- **Ortak içerik:** adım göstergesi; sipariş kartı (paket, kişi sayısı, adres, tutar `amountKurus`); "Panelime git" ikincil düğmesi. Başlık bölgesi `role="status" aria-live="polite"`: durum değişince ekran okuyucu okur.

| `status` / `provisioning` | Başlık | Metin | Düğmeler |
| --- | --- | --- | --- |
| Yükleniyor (ilk istek) | — | Sipariş kartı iskelet | — |
| `pending` | "Ödemen bekleniyor." | "Ödeme şirketinden onay gelince bu sayfa kendiliğinden değişecek. Sayfayı kapatırsan da sorun değil: durumu panelinde görürsün." 2 dakikadan uzun sürerse eklenir: "Biraz uzun sürdü. Ödemeyi tamamlamadıysan tekrar deneyebilirsin." + "Ödemeye dön" (bkz. sorular: aynı `checkoutUrl`'e dönülebiliyor mu). | "Panelime git" |
| `paid` + `pending` (Randevu) | "Hazırsın. Salonun kuruluyor." | "Ödemen alındı, teşekkür ederim. Salonunu şimdi açıyorum; bitince bu sayfa kendiliğinden değişecek." Liste: Ödeme alındı (Tamam), Ödeme belgen panelinde (Tamam), `<slug>.moonvalesoft.com` açılıyor (Sürüyor). Her satırda ikon + metin etiketi. | "Panelime git" |
| `paid` + `done` | "Hazırsın. Salonun açıldı." | Büyük adres kartı, "Salonuna git" ana düğmesi (`https://<slug>.moonvalesoft.com`). "Bundan sonra": 1) İlk girişte Google Authenticator kurulumu, 2) Çalışanlarını ekle, 3) Takılırsan panelden bana yaz. | "Salonuna git", "Panelime git" |
| `paid` + `failed` | "Ödemen alındı, kurulumda bir sorun çıktı." | "Merak etme, haberim var; düzeltip sana e-postayla yazacağım. Paran güvende." → **"Paran güvende" ifadesi Ozan onayı bekliyor.** | "Bana yaz" (→ `/panel/destek`), "Panelime git" |
| `paid`, Randevu dışı ürün (`provisioning: none`) | "Hazırsın." | "Ödemen alındı. Kurulum için seninle iletişime geçeceğim." (teyit edilecek: CRM/Emlak kurulumu nasıl olacak) | "Panelime git" |
| `failed` | "Ödeme tamamlanmadı." | "Kartından ödeme alınamadı. Başka bir kartla tekrar dene." | "Tekrar dene" → `/satin-al/<planId>` (bilgiler dolu gelir), "Bana yaz" |
| `refunded` | "Bu ödeme iade edildi." | "Sorun olduğunu düşünüyorsan bana yaz." | "Bana yaz" |
| `404 NOT_FOUND` | Ortak metin | "Bunu bulamadım. Panelinden kontrol edebilirsin." | "Panelime git" |

**Telefon:** tek sütun, aynı sıra. Adres kartında uzun adres `word-break: break-all` ile kırılır. "Salonuna git" tam genişlik.

---

## 7. Panel: Paketlerim

- **Yol:** `/panel`
- **Artboard:** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-Panel
- **Giriş şartı:** oturum. Yoksa `/giris?sonra=/panel`.
- **Panel iskeleti (üç sayfada ortak):** başlıkta e-posta, mod düğmesi, "Çıkış yap" (`POST /api/auth/logout` → `/`). Yan menü `<nav aria-label="Panel">`: Paketlerim, Faturalarım, Destek; açık olanda `aria-current="page"` + zemin + çerçeve (sadece renk değil). Telefonda menü içeriğin üstünde yatay sıra (3 öğe sığar, 44 px).
- **Amaç:** aldıklarını ve durumlarını görmek; salonuna gitmek; gerekirse iptal etmek.
- **Veri:** `GET /api/subscriptions`.

**Abonelik kartı** (her abonelik için bir kart):
- Başlık: ürün adı (`planId` → `GET /api/plans`'taki `name`); alt satır "Aylık · <seats> kişi".
- Durum etiketi (`Badge`, ikon + metin):

  | Durum | Etiket | Renk |
  | --- | --- | --- |
  | `active`, `cancelAtPeriodEnd: false` | "Aktif" (tik) | `success` |
  | `active`, `cancelAtPeriodEnd: true` | "<tarih>'te bitecek" (saat) | `accent` |
  | `past_due` | "Ödeme alınamadı" (ünlem) | `danger` |
  | `canceled` | "İptal edildi" | `textSubtle` |

- Bilgiler (`<dl>`): Salon adresi (`companySlug` + `.moonvalesoft.com`, sadece Randevu), Kurulum, Yenilenme tarihi (`currentPeriodEnd`; iptal istendiyse etiket "Bitiş tarihi"), Aylık tutar ([TOPLAM]: API'deki abonelik kaydında tutar yok, bkz. sorular).
- Kurulum (`provisioning`): `pending` "Kuruluyor", `done` "Hazır" (tik), `failed` "Sorun çıktı, ilgileniyorum", `none` satır gizli.
- Düğmeler: "Salonuna git" (sadece `provisioning: done`), "İptal et" (sadece `active` ve `cancelAtPeriodEnd: false`).
- `past_due` kartında ek uyarı: "Son ödemen alınamadı. [KART GÜNCELLEME YOLU: teyit edilecek]" (API'de kart güncelleme ucu yok).
- `canceled` kartında: "Salonun donduruldu, verilerin duruyor. Yeniden başlamak istersen bana yaz." + "Bana yaz".

**İptal akışı** (`AlertDialog`):
- "İptal et" → diyalog. Başlık "Aboneliğini iptal etmek istiyor musun?" Metin "<tarih>'e kadar her şey çalışmaya devam eder. Sonra yeni ödeme alınmaz ve salonun dondurulur; verilerin silinmez." Düğmeler: "Vazgeç" (ana düğme, odak burada açılır), "Evet, iptal et" (`danger` çerçeveli). Esc ve "Vazgeç" kapatır, odak "İptal et" düğmesine döner.
- Gönderiliyor: "İptal ediliyor…", iki düğme devre dışı.
- Başarılı `200` (`cancelAtPeriodEnd: true`): diyalog kapanır, kartta etiket "<tarih>'te bitecek", kartın içinde bilgi kutusu (`role="status"`): "İptal isteğini aldım. <tarih>'e kadar her şey çalışır, sonra yeni ödeme alınmaz ve salonun dondurulur. Verilerin silinmez."
- `404 NOT_FOUND`: diyalog içinde "Bu aboneliği bulamadım. Sayfayı yenileyip tekrar bak."
- Diğer hatalar: ortak metinler, diyalog içinde.

**Durumlar**

| Durum | Görünüm |
| --- | --- |
| Yükleniyor | Bir kart iskeleti. |
| Boş (dizi boş) | "Henüz bir paketin yok." + "Paketlere bak" (→ `/#fiyatlar`). Bekleyen sipariş varsa (bkz. sorular) "Ödemen bekleniyor" kartı. |
| Başarılı | Kartlar, yeniden eskiye. |
| Hata | Ortak metinler + "Tekrar dene". |

**Telefon:** dl tek sütun; düğmeler alt alta, tam genişlik.

---

## 8. Panel: Faturalarım

- **Yol:** `/panel/faturalar`
- **Artboard (boş durum dahil):** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-PanelFaturalar
- **Amaç:** ödeme belgelerini görmek ve açmak.
- **Veri:** `GET /api/invoices` (yeniden eskiye). Satır açma: `/panel/faturalar/[id]` → `GET /api/invoices/:id` (belgenin görünümü teyit edilecek: PDF mi sayfa mı).
- **Tablo** (`Table`, `<caption>` "Ödeme belgelerin, yeniden eskiye"): Belge no (`number`, `tabular-nums`), Tarih (`issuedAt`), Ürün (sipariş üzerinden; API'de bu alan faturada yok, bkz. sorular), Tutar (`amountKurus`, sağa yaslı), "Aç" bağlantısı (`aria-label="<number> belgesini aç"`).
- Üst metin: "Her ödemenden sonra belgen buraya düşer, bir kopyası da e-postana gelir." (e-posta gönderimi teyit edilecek)
- Alt not: [FATURA NOTU] (e-Arşiv kararı gelince metni yazacağım; şimdilik "ödeme belgesi").

| Durum | Görünüm |
| --- | --- |
| Yükleniyor | 3 satır iskelet. |
| Boş | "Henüz bir belgen yok." "İlk ödemenden sonra burada görünecek." + "Paketlere bak". |
| Başarılı | Tablo. |
| Hata | Ortak metinler. `GET /api/invoices/:id` → `404`: "Bu belgeyi bulamadım." + "Faturalarıma dön". |

**Telefon:** tablo kendi kutusunda yatay kayar (`overflow-x: auto`, en az 560 px). Alternatif olarak frontend satırları kart listesine çevirebilir; tercih: kart listesi (her kartta no, tarih, tutar, "Aç").

---

## 9. Panel: Destek

- **Yol:** `/panel/destek` (liste + yeni talep formu), `/panel/destek/[id]` (talep ayrıntısı, mesajlar).
- **Artboard (boş durum dahil):** https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL#artboard-PanelDestek
- **Amaç:** bana yazmak ve önceki taleplerini görmek.
- **Üst metin:** "Yazdığın her talebi ben okurum; karşında sistemi yazan kişi var." + [YANIT SÜRESİ] (Ozan söyleyecek; söz vermeyeceğimiz bir süre yazılmaz).

**Yeni talep formu** (`POST /api/tickets`):

| Etiket | Alan | Kural |
| --- | --- | --- |
| Konu | `subject` | 3–120 karakter. Örnek yer tutucu "ör. Çalışan ekleyemiyorum" (etiketin yerine geçmez). |
| Ne oldu? | `message` | 10–5000 karakter. `Textarea`, 6 satır. Altında ipucu "Ne yapmaya çalıştın, ne oldu? Ekran görüntüsü gerekirse yanıtımda isterim." ve sayaç "<n> / 5000" (sayaç 4900'den sonra `aria-live="polite"`). |

| Durum | Görünüm |
| --- | --- |
| Boş | Alanlar boş, "Gönder" etkin. |
| Gönderiliyor | "Gönderiliyor…" |
| Başarılı `201` | Form temizlenir, form üstünde `role="status"`: "Talebini aldım. Yanıtım buraya ve e-postana gelecek." Yeni talep listenin başına eklenir. (Yanıtın e-postaya gelmesi teyit edilecek.) |
| `400 VALIDATION` | İstemci önce kendisi kontrol eder. Konu: "Konu 3 ile 120 karakter arasında olmalı." Mesaj: "Mesajın en az 10 karakter olmalı." / "Mesajın 5000 karakteri geçmesin." Sunucudan gelirse hangi alan olduğu bilinmediği için formun üstünde: "Konu 3–120, mesaj 10–5000 karakter olmalı. Kontrol edip tekrar gönder." |

**Talep listesi** (`GET /api/tickets`): her satır bir bağlantı (→ `/panel/destek/[id]`): konu, tarih (`createdAt`), durum etiketi (ikon + metin). `open` → "Açık". Diğer durumlar [DURUM]: API'de sadece `open` tanımlı.

| Durum | Görünüm |
| --- | --- |
| Yükleniyor | 2 satır iskelet. |
| Boş | "Henüz bir talebin yok." "Bir sorun olursa yukarıdaki formdan yaz; ben bakarım." |
| Hata | Ortak metinler. |

**Talep ayrıntısı** (`GET /api/tickets/:id`): konu, durum, mesajlar sırayla (kimin yazdığı metinle: "Sen" / "Ozan"). Yanıt yazma API'de yok (bkz. sorular). `404`: "Bu talebi bulamadım." + "Destek sayfasına dön".

**Telefon:** form ve liste tek sütun; "Gönder" tam genişlik.

---

## Ozan / pm için açık sorular

1. **Hata ve form rengi token'ları** (`danger`, `inputBorder`): renkler yukarıda; onay → tokens.json'a eklerim.
2. **Doğrulama e-postasını tekrar gönderme** ucu yok. Kullanıcı e-postayı kaybederse ne yapacak? Öneri: `POST /api/auth/resend-verification` (her zaman 202).
3. **Adres (slug) uygunluğu anlık kontrol** ucu yok; "alınmış" ancak gönderimde çıkıyor. Öneri: `GET /api/slugs/:slug` → `{ available }`.
4. **Ödenmemiş/başarısız sipariş adresi tutuyor mu?** `SLUG_TAKEN` "başka bir siparişin aldığı slug" diyor. Ödemesi başarısız olan kullanıcı aynı adresle tekrar denerse kendi eski siparişi yüzünden reddedilir mi? Öneri: aynı üyenin `pending/failed` siparişi adresi kilitlemesin, ya da `pending` sipariş için yeni `checkoutUrl` alınabilsin.
5. **Onay kutusu** (ön bilgilendirme + mesafeli satış): checkout gövdesinde onayın kaydı yok. Hukuken onayın zamanı/sürümü saklanmalı mı? (hukukçu)
6. **KDV:** fiyatlar KDV dahil mi? Özette ne yazacak? [KDV NOTU]
7. **Kişi sayısı:** salon sahibi de bir kişi sayılıyor mu? (Ekranda "sen dahil" yazdım.) Sonradan kişi artırma/azaltma olacak mı?
8. **Abonelik kaydında tutar yok:** panelde "Aylık tutar" göstermek için `amountKurus` eklensin mi? Faturada da ürün adı yok (`orderId` var).
9. **`past_due`** durumunda kullanıcı kartını nasıl güncelleyecek? Sağlayıcıya göre değişir.
10. **Kurulum başarısız** ekranında "Paran güvende" diyebilir miyiz? Ne kadar sürede çözülür?
11. **Salon sahibinin ilk girişi:** salon açılınca sahip `<slug>.moonvalesoft.com`'a hangi bilgiyle girecek (aynı e-posta + şifre mi, davet e-postası mı)? "Kuruldu" ekranının metni buna bağlı.
12. **Destek:** talep durumları (`open` dışında), üyenin yanıt yazabilmesi, yanıt süresi [YANIT SÜRESİ], yanıtların e-postaya gidip gitmediği.
13. **Fatura:** e-Arşiv kararı, belgenin görünümü (PDF?), e-postaya gönderim.
14. **Panelde bekleyen sipariş:** `GET /api/orders` (liste) yok; ödemeyi yarıda bırakan kullanıcı panelde siparişini göremez.
15. **Fiyatlar:** [FİYAT], [TOPLAM] her yerde yer tutucu.
