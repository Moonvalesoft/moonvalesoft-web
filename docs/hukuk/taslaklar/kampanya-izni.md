TASLAK: avukat onayı olmadan yayımlanamaz.

# Ticari Elektronik İleti İzni (Kampanya İzni)

- Belge türü: `kampanya_izni` · Sitedeki yeri: `/kampanya-izni` · Sürüm: `taslak-1`
- Dayanak: 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun m.6 (onay), m.8 (ret hakkı), m.11 (onay ve ret kayıt sistemi); Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik (RG 15.07.2015; İYS hükümleriyle değişiklik 04.01.2020); İleti Yönetim Sistemi (İYS).
- Şu an tek kanal: **e-posta**. Veritabanı SMS ve arama kanallarına hazır (`marketing_consents.channel`), ama bu kanallar için izin istenmiyor.

> Taslakçı notları (sayfaya girmez):
> - Kanun m.6: ticari elektronik ileti ancak önceden onay alınarak gönderilir; onay yazılı olarak veya elektronik iletişim araçlarıyla alınabilir.
> - Ticaret Bakanlığı bilgilendirmesine göre onay, alıcı ret hakkını kullanana kadar geçerlidir ve alıcının e-posta adresine ileti gönderilerek onay istenemez. **Yani "kampanya e-postası almak ister misin?" diye e-posta atılamaz;** izin yalnızca site/panel formlarında istenir.
> - Tacir ve esnaf olan alıcılara önceden onay alınmadan gönderilebilir, ama ret ederlerse gönderim durur. Önerim: bu istisnaya dayanmamak, herkesten aynı şekilde izin almak (müşterinin tacir olup olmadığını ayırt etmek kodda ek iş ve hata riski). Avukat ve Ozan onaylayacak.
> - Mevcut müşteriye satın aldığı hizmetin değişikliği, kullanımı ve bakımıyla ilgili iletiler ile abonelik, tahsilat, satın alma gibi bildirimler için ayrıca onay gerekmez. İşlem e-postaları bu yüzden izinden bağımsızdır ve **içlerine kampanya konmaz** (uyum standardı).
> - Kanun m.8: alıcı istediği zaman, gerekçe göstermeden reddedebilir; ret kolay ve ücretsiz olmalı ve her iletide bu imkân belirtilmeli; ret ulaştıktan sonra gönderim **üç iş günü** içinde durdurulmalı. Bizde ret anında uygulanıyor (panel ve bağlantı yeni kayıt ekler, gönderim son kayda bakar), bu yeterli.
> - Aydınlatma ile bu izin **ayrı** kutucuklardır (KVKK Kurulu 2018/90 kararı yönünde). İzin kutucuğu isteğe bağlı ve işaretsiz gelir; işaretlenmemesi üyeliği veya satın almayı engellemez.
> - İYS: hizmet sağlayıcının İYS'ye kaydı, onayların İYS'ye yüklenmesi ve süreleri, e-posta kanalında istisna/eşik olup olmadığı **resmî kaynaktan doğrulanamadı** (iys.org.tr ve mevzuat.gov.tr bu oturumda açılamadı). Avukata sorulacak; İYS'ye aktarım gerekiyorsa kod işi doğar.

---

## Kutucuk metni (üyelik formunda ve panelde)

> ☐ Moonvalesoft'tan yeni özellikler, kampanyalar ve duyurular hakkında **e-posta** almak istiyorum. ([İzin metni](/kampanya-izni))

- İşaretsiz gelir. İsteğe bağlıdır.
- Aydınlatma metni kutucuğundan ayrıdır; ikisi tek kutucukta birleştirilmez.
- Altında küçük not: "İstemezsen işaretleme. Üyeliğin ve aldığın hizmet aynen devam eder. İznini istediğin an panelden geri alabilirsin."

## Sayfa metni (`/kampanya-izni`)

**[UNVAN]** ("Moonvalesoft") olarak, yalnızca izin verdiğin takdirde sana ticari elektronik ileti gönderirim. Bu metin, verdiğin iznin kapsamını anlatır.

### 1. Hangi iletileri gönderirim

- Moonvalesoft ürünlerindeki yeni özellikler ve güncellemeler,
- kampanya, indirim ve fiyat duyuruları,
- yeni ürün duyuruları ve etkinlik davetleri. [KAPSAM — Ozan teyit edecek]

Kendi mal ve hizmetlerim dışında, başka firmalar adına tanıtım iletisi göndermem. [Ozan teyit edecek]

### 2. Hangi kanaldan

Yalnızca **e-posta** ile, üyelikte verdiğin e-posta adresine. SMS ve arama için ayrıca izin istemedikçe bu kanallardan ileti göndermem.

### 3. İzin isteğe bağlıdır

İzin vermek zorunda değilsin. İzin vermemen veya sonradan geri alman üyeliğini, satın aldığın hizmeti ve fiyatını hiçbir şekilde etkilemez.

Hesabın, siparişin, faturan, şifren ve hizmetinle ilgili zorunlu bilgilendirme e-postaları bu izinden bağımsızdır; bunlar izin vermesen de gönderilir ve içlerinde kampanya bulunmaz.

### 4. İznini nasıl geri alırsın

İznini istediğin zaman, gerekçe göstermeden ve ücretsiz geri alabilirsin:

- Müşteri panelinde **İzinlerim** bölümünden tek tıkla,
- gönderdiğim her kampanya e-postasının altındaki **"İzni geri al"** bağlantısıyla,
- [E-POSTA] adresine yazarak,
- [İYS ÜZERİNDEN — İYS kaydı yapılırsa: vatandas.iys.org.tr, e-Devlet veya İYS mobil uygulaması üzerinden].

Geri alma talebini en geç üç iş günü içinde uygularım; panelden ve bağlantıdan yaptığın geri alma hemen geçerli olur.

### 5. Kayıt

İzin verdiğinde ve geri aldığında; kanal, işlem (verildi/geri alındı), bu metnin sürümü, işlemin yapıldığı yer (üyelik, panel, bağlantı), tarih-saat, IP adresi ve tarayıcı bilgisi kaydedilir. Bu kayıtlar ispat amacıyla [SAKLAMA SÜRESİ — ticari ileti mevzuatındaki süre teyit edilecek] saklanır. Kişisel verilerinin işlenmesi hakkında ayrıntı: [KVKK Aydınlatma Metni](/kvkk).

### 6. Şikâyet

İznin olmadan ileti aldığını düşünüyorsan önce bana [E-POSTA] adresinden ulaşabilirsin. Ayrıca Ticaret Bakanlığının Ticari Elektronik İleti Şikâyet Sistemi'ne (e-Devlet) başvurabilirsin.

---

## Kampanya e-postasının altında bulunacaklar (her iletide)

- Gönderen: [UNVAN] — [ADRES] — [MERSİS] — [E-POSTA] [Yönetmelikte iletide bulunması gereken tanıtıcı bilgiler resmî kaynaktan doğrulanamadı; avukata sorulacak]
- "Bu e-postayı, Moonvalesoft'tan kampanya e-postası almaya izin verdiğin için aldın."
- **İzni geri al** bağlantısı (tek tık, giriş gerektirmez; kayıt kaynağı `unsubscribe_link`).

## Ürün/teknik notlar (Ozan ve geliştiriciler için)

- `marketing_consents.text_version` alanı bu belgenin sürümünü tutar; metin değişince sürüm artar. Eski izinlerin yeni metne göre geçerli sayılıp sayılmayacağı avukata sorulacak.
- "İzni geri al" bağlantısı girişsiz çalışmalı; bağlantının başkası tarafından tahmin edilememesi (imzalı token) güvenlik incelemesine bırakıldı.
- İzin kaydında e-posta adresi ayrıca tutulmuyor; kullanıcı kimliği üzerinden bulunuyor. Kullanıcı e-posta adresini değiştirirse iznin yeni adrese geçip geçmeyeceği avukata sorulacak (şu an e-posta değiştirme özelliği yok).
- Randevu uygulamasında salonların kendi müşterilerine gönderdiği kampanya SMS/WhatsApp iletileri bu metnin kapsamında değildir; orada hizmet sağlayıcı salondur. Ayrı değerlendirme gerekir.
