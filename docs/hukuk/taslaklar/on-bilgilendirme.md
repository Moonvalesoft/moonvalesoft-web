TASLAK: avukat onayı olmadan yayımlanamaz.

# Ön Bilgilendirme Formu

- Belge türü: `on_bilgilendirme` · Sitedeki yeri: `/on-bilgilendirme` · Sürüm: `taslak-1`
- Dayanak: 6502 sayılı Tüketicinin Korunması Hakkında Kanun m.48; Mesafeli Sözleşmeler Yönetmeliği (RG 27.11.2014, 29188; son değişiklik RG 23.08.2022, 31932) m.5–8.
- Kime uygulanır: Yönetmelik, ticari veya mesleki olmayan amaçla hareket eden **tüketiciye** yapılan satışları kapsar (m.4). Müşterilerin çoğu işletme olduğu için Yönetmelik onlara uygulanmayabilir; yine de form her satın almada herkese gösterilir (uyum standardı kuralı). Hangi hükmün kime uygulanacağı aşağıda `[T]` (tüketiciye) ve `[H]` (herkese) işaretleriyle ayrıldı; avukat teyit edecek.

> Taslakçı notları (sayfaya girmez):
> - Yönetmelik m.6/2-a: internet satışında hizmetin temel nitelikleri, vergiler dahil toplam fiyat, cayma hakkı ve cayma hakkının kullanılamayacağı durumlar, ödeme yükümlülüğü doğmadan **hemen önce** ayrıca ve açıkça gösterilmelidir. Bu dört bilgi ödeme düğmesinin hemen üstünde, formun bütününden ayrı bir kutuda gösterilmeli (ui-ux işi).
> - Yönetmelik m.6/2-b: kabul edilen ödeme araçları en geç sipariş verilmeden önce gösterilmeli.
> - Yönetmelik m.6/1: bilgiler en az 12 punto, açık ve anlaşılır şekilde verilir. Web için karşılığı (yazı boyutu) avukat ve ui-ux ile netleştirilecek.
> - Yönetmelik m.7: tüketicinin ön bilgileri edindiğini teyit etmesi gerekir; teyit yoksa sözleşme kurulmamış sayılır. Mevcut zorunlu kutucuk bu işi görür.
> - Yönetmelik m.8/1: sipariş onaylanmadan hemen önce, siparişin ödeme yükümlülüğü doğurduğu açıkça bildirilmeli. Ödeme düğmesinin metni buna göre seçilmeli; öneri: "Siparişi onayla ve öde". Bu yapılmazsa tüketici siparişle bağlı olmaz.
> - Üst bölümdeki köşeli parantezli sipariş alanları sunucunun hesapladığı değerlerle doldurulur (`GET /api/plans`, `POST /api/checkout`).

---

## 1. Satıcı / hizmet sağlayıcı bilgileri `[H]`

| | |
| --- | --- |
| Unvan | [UNVAN] |
| Adres | [ADRES] |
| Telefon | [TELEFON] |
| E-posta | [E-POSTA] |
| KEP | [KEP] |
| Vergi dairesi / no | [VERGİ DAİRESİ / NO] |
| MERSİS no | [MERSİS] |

Şikâyet ve itirazlarınızı yukarıdaki iletişim bilgilerine veya müşteri panelindeki "Destek" bölümüne iletebilirsiniz. [AYRI ŞİKÂYET KANALI VARSA]

> Ödeme kuruluşu satıcı adına değil kendi adına satış yapan bir aracıysa (ör. "Merchant of Record" modeli), satıcı bilgileri bu kuruluşa göre değişir. Bkz. avukata sorular.

## 2. Siparişin bilgileri `[H]`

| | |
| --- | --- |
| Hizmet | [ÜRÜN ADI] (ör. Moonvale Randevu) |
| Plan | [PLAN ADI] |
| Kullanıcı (kişi) sayısı | [KİŞİ SAYISI] |
| Birim fiyat (KDV dahil, aylık, kullanıcı başına) | [FİYAT] TL |
| Toplam tutar (KDV dahil) | [TOPLAM TUTAR] TL / ay |
| Ödeme sıklığı | Aylık, otomatik yenilenir |
| Firma adresi (yalnız Randevu) | `[FİRMA].moonvalesoft.com` |
| Ek masraf | Yoktur. [TEYİT EDİLECEK: ödeme kuruluşunun müşteriye yansıttığı bir masraf var mı] |

Fiyatlara KDV dahildir.

## 3. Hizmetin temel nitelikleri `[H]`

- [ÜRÜN ADI], internet üzerinden sunulan bir yazılım hizmetidir (bulut yazılım aboneliği). Fiziksel teslimat yoktur.
- Moonvale Randevu: kuaför ve güzellik salonları için online randevu uygulamasıdır. Satın alınan kullanıcı sayısı kadar personel, her biri kendi hesabı ve iki adımlı doğrulamasıyla uygulamaya girer. [ÖZELLİK LİSTESİ — Ozan'dan gelecek; uydurulmadı]
- Hizmet için gereken: internet bağlantısı ve güncel bir web tarayıcısı; iki adımlı doğrulama için Google Authenticator uyumlu bir doğrulama uygulaması yüklü akıllı telefon. [DESTEKLENEN TARAYICI / CİHAZ BİLGİSİ — teyit edilecek] (Yönetmelik m.5/1-j: dijital içeriğin çalıştığı donanım ve yazılım bilgisi.)
- Teknik koruma önlemi: [VARSA — ör. hesap başına cihaz sınırı; yoksa "yoktur"] (Yönetmelik m.5/1-i.)

## 4. Hizmetin başlaması ve süresi `[H]`

- Ödeme, ödeme kuruluşundan Moonvalesoft'a ulaşan onay bildirimiyle kesinleşir. Kesinleştikten sonra hizmet kendiliğinden kurulur ve genellikle birkaç dakika içinde kullanıma açılır. [KURULUM SÜRESİ İÇİN SÖZ VERİLEN AZAMİ SÜRE — Ozan karar verecek]
- Abonelik bir aylık dönemler hâlinde, siz iptal edene kadar her ay aynı günde otomatik olarak yenilenir ve ödeme kayıtlı ödeme aracınızdan alınır.
- Fiyat değişikliği: [FİYAT DEĞİŞİKLİĞİ BİLDİRİMİ — kaç gün önceden, nasıl; Ozan + avukat]
- Kullanıcı sayısını dönem içinde artırma/azaltma: [KARAR BEKLİYOR — Ozan]

## 5. Ödeme `[H]`

- Ödeme, [ÖDEME KURULUŞU]'nun güvenli ödeme sayfasında yapılır. Kart bilgileriniz Moonvalesoft'a iletilmez.
- Kabul edilen ödeme araçları: [ÖDEME ARAÇLARI — ör. kredi kartı, banka kartı; sağlayıcı seçilince yazılacak]
- Ödeme alınamazsa: [ÖDEME ALINAMAZSA NE OLUR — kaç gün ek süre, ne zaman dondurulur; Ozan karar verecek]
- Fatura: [FATURA TÜRÜ — e-Arşiv / e-Fatura; muhasebeci ile teyit edilecek] düzenlenir ve [E-POSTA / PANEL] üzerinden iletilir.

## 6. İptal `[H]`

- Aboneliğinizi istediğiniz zaman müşteri panelinden ("Paketlerim" > "İptal et") iptal edebilirsiniz.
- İptal, içinde bulunulan ödeme döneminin sonunda yürürlüğe girer; dönem sonuna kadar hizmeti kullanmaya devam edersiniz ve yeni ödeme alınmaz.
- Dönem bitince Randevu firmanız dondurulur: erişim durur, verileriniz silinmez. [DONDURULAN VERİNİN NE KADAR SAKLANACAĞI ve NASIL GERİ ALINACAĞI / DIŞA AKTARILACAĞI — Ozan + avukat]
- İade koşulları: [İADE KOŞULLARI — karar bekliyor; bkz. İptal ve İade Koşulları]

## 7. Cayma hakkı `[T]`

> Bu bölüm avukatın kararına bağlıdır. İki seçenek hazırlandı; avukat birini seçecek. Ayrıntı: avukata sorular, "Cayma hakkı" bölümü.

**Genel kural (Yönetmelik m.9):** Tüketici, hizmet sözleşmelerinde sözleşmenin kurulduğu günden başlayarak 14 gün içinde gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilir.

**Seçenek A — istisna uygulanır (cayma hakkı yok):**

Satın aldığınız hizmet, ödeme kesinleşir kesinleşmez elektronik ortamda kurulur ve kullanımınıza açılır. Mesafeli Sözleşmeler Yönetmeliği m.15/1-(ğ) (elektronik ortamda anında ifa edilen hizmetler) ve (h) (cayma süresi dolmadan tüketicinin onayıyla ifasına başlanan hizmetler) bentleri uyarınca, siparişi verirken hizmetin hemen başlamasını onayladığınız için **bu sözleşmede cayma hakkınız bulunmamaktadır.** (Yönetmelik m.5/1-h: cayma hakkının kullanılamayacağı durumun bildirilmesi.)

Bunun için ödeme sayfasında, ön bilgilendirme kutucuğundan **ayrı**, zorunlu bir onay kutucuğu önerilir:

> ☐ Hizmetin ödeme kesinleşir kesinleşmez başlamasını istiyorum. Hizmet başladığında cayma hakkımı kullanamayacağımı biliyorum.

**Seçenek B — cayma hakkı tanınır:**

Sözleşmenin kurulduğu günden itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Cayma bildiriminizi [E-POSTA] adresine, [ADRES]'e veya müşteri panelindeki [CAYMA BÖLÜMÜ] üzerinden açık bir beyanla ya da ekteki örnek cayma formuyla iletebilirsiniz (Yönetmelik m.11). Bildiriminiz bize ulaştıktan sonra en geç 14 gün içinde ödediğiniz tutar, ödemede kullandığınız araçla ve size masraf yüklenmeden iade edilir (Yönetmelik m.12). [CAYMA SÜRESİNDE KULLANILAN GÜNLERİN BEDELİ — avukata sorulacak]

- Cayma bildirimi adresi (Yönetmelik m.5/1-ğ): [E-POSTA], [ADRES]
- Fiziksel ürün olmadığından iade için taşıyıcı yoktur.

> Önemli (avukata sorulacak): Cayma hakkı doğru bildirilmezse 14 günlük süre başlamaz; hak, sürenin bitiminden itibaren bir yıl sonra sona erer (Yönetmelik m.10). Bu yüzden bu bölümün yanlış yazılması iade riskini büyütür.

## 8. Uyuşmazlık ve şikâyet `[T]`

Şikâyetleriniz için önce bizimle iletişime geçebilirsiniz. Uyuşmazlık hâlinde, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar içinde yerleşim yerinizdeki veya işlemi yaptığınız yerdeki Tüketici Hakem Heyetine, bu sınırların üzerindeki uyuşmazlıklarda Tüketici Mahkemesine başvurabilirsiniz (Yönetmelik m.5/1-k). [PARASAL SINIR — her yıl güncellenir, teyit edilecek] [ARABULUCULUK ŞARTI — tüketici mahkemesinden önce arabuluculuk zorunluluğu olup olmadığı avukata sorulacak]

İşletme müşterileri `[H, tüketici olmayanlar]` için: [YETKİLİ MAHKEME VE İCRA DAİRELERİ — avukat yazacak]

## 9. Diğer

- Ön bilgilendirme formu ve mesafeli satış sözleşmesi, sipariş tamamlandığında e-posta adresinize gönderilir ve müşteri panelinde ("Belgelerim") saklanır.
- Moonvalesoft, sipariş ve onay kayıtlarını [SAKLAMA SÜRESİ — Yönetmelik m.20 gereği en az 3 yıl] saklar.
- Sözleşme dili Türkçedir.

---

Onay (ödeme sayfasında, işaretsiz, zorunlu):

> ☐ Ön Bilgilendirme Formu'nu ve Mesafeli Satış Sözleşmesi'ni okudum, onaylıyorum.

Ödeme düğmesi: **"Siparişi onayla ve öde"** (Yönetmelik m.8/1).
