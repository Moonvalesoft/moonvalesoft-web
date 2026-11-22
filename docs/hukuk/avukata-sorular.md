# Avukata sorular (moonvalesoft.com yasal metinleri)

Hazırlayan: hukuk taslak ajanı (avukat değildir) · Tarih: 22 Kasım 2026
Taslaklar: `docs/hukuk/taslaklar/` (aydinlatma, on-bilgilendirme, mesafeli-satis, iptal-iade, kampanya-izni). Hepsi `taslak-1` sürümündedir ve avukat onayı olmadan yayımlanamaz.

**Önce okunması gereken 5 soru** (yıldızlı: ★). Diğerleri belge sırasıyla.

---

## Genel ve satış modeli

1. ★ **Tüketici / işletme ayrımı.** Müşterilerin çoğu kuaför, güzellik salonu, emlakçı gibi işletmeler; az bir kısmı tüketici olabilir (şahıs işletmesi sahibinin bireysel alımı gibi sınır durumlar dahil). Mesafeli Sözleşmeler Yönetmeliği yalnızca ticari veya mesleki olmayan amaçla hareket edene uygulanıyor (m.4).
   - Ödeme sayfasında "işletme adına mı, bireysel mi?" diye sormalı mıyız? Sorarsak beyanın hukuki değeri ne?
   - Tek metin mi (tüketici hükümleri işaretli), yoksa tüketici ve işletme için iki ayrı sözleşme mi?
   - Kuaför/güzellik salonu için satın alınan randevu yazılımında alıcı tüketici sayılabilir mi?
2. ★ **Ödeme sağlayıcısı satıcı yerine geçerse.** Aday sağlayıcılardan bazıları (Lemon Squeezy, Paddle) "Merchant of Record" olarak, yani kendi adına satış yapan taraf olarak çalışıyor; iyzico / PayTR ise ödeme kuruluşu. MoR seçilirse: mesafeli sözleşmenin ve ön bilgilendirmenin satıcısı kim olur, fatura kim keser, cayma ve iade kime karşı kullanılır, bizim metinlerimiz nasıl değişir? Sağlayıcı seçimi öncesi görüşünüzü rica ederiz.
3. Satıcının e-ticaret mevzuatı kapsamındaki diğer yükümlülükleri (6563 sayılı Kanun'daki genel bilgi verme ve sipariş teyidi, ETBİS kaydı vb.) bizim için geçerli mi, sitede nereye ne yazılmalı? (Bu oturumda kaynaktan doğrulanamadı.)
4. Şirket türü henüz belli değil (şahıs / limited / anonim). Hangisi seçilirse metinlerde hangi bilgiler zorunlu (MERSİS, ticaret sicil no, KEP)?

## Aydınlatma metni (`aydinlatma.md`)

5. Amaç ↔ hukuki sebep eşleştirmesi doğru mu? Özellikle: güvenlik kayıtları (IP, başarısız girişler, istek sınırı) için meşru menfaat mi, hukuki yükümlülük mü? Fatura için hangi mevzuata atıf yapılmalı?
6. Kampanya e-postası için KVKK bakımından hukuki sebep ne? 6563 kapsamındaki onay ayrıca KVKK açık rızası sayılır mı, yoksa ayrı bir açık rıza metni mi gerekir?
7. ★ **Yurt dışı aktarım.** Kural verileri Türkiye'de tutmak; ama (a) e-posta hizmet sağlayıcısı, (b) ödeme kuruluşu, (c) sitede GitHub sunucusundan yüklenen bir fotoğraf (ziyaretçinin IP ve tarayıcı bilgisi GitHub'a gider) yurt dışı aktarım olabilir. KVKK m.9'un güncel hâline göre her biri için dayanak ne olmalı (yeterlilik kararı, standart sözleşme, arızi aktarım)? Standart sözleşme gerekirse Kuruma bildirim süresi ve usulü nedir? (Bu konudaki Kurum sayfaları bu oturumda açılamadı; güncel hükmü sizin teyidiniz gerekiyor.)
8. ★ **Saklama süreleri ve silinmeyen kayıtlar.**
   - Fatura/ödeme, sipariş, destek, oturum, güvenlik kayıtları ve üyelik sona erdikten sonra hesap bilgileri için süreler neler olmalı? (Mesafeli Sözleşmeler Yönetmeliği m.20'deki 3 yıllık kayıt saklama hükmünü gördük; vergi ve ticaret mevzuatındaki süreleri sizden bekliyoruz.)
   - Aydınlatma okuma ve kampanya izni kayıtları teknik olarak değiştirilemez ve silinemez tasarlandı (ispat için). Süre sonunda anonimleştirme yeterli mi? Silme talebine nasıl yanıt verilmeli?
   - **Abonelik bitince Randevu firması dondurulur ve veri "silinmez".** Süresiz saklama KVKK'daki "gerekli süre kadar saklama" ilkesiyle çelişir mi? Önerilen bir süre (sonra imha veya müşteriye dışa aktarma) var mı?
9. Moonvale Randevu'da salonların kendi müşterilerinin verisi işleniyor. Salon veri sorumlusu, Moonvalesoft veri işleyen mi? Öyleyse:
   - Veri işleme sözleşmesi mesafeli satış sözleşmesine ek mi olmalı, ayrı onay mı?
   - Salonun kendi müşterisine göstereceği aydınlatma metni şablonunu biz mi sağlamalıyız?
   - Salon personeli (Moonvalesoft hesabıyla giriş yapan çalışanlar) için ayrı aydınlatma gerekir mi?
10. Destek mesajlarına kullanıcı kendiliğinden özel nitelikli veri (ör. sağlık) yazarsa ne yapmalıyız?
11. Yalnızca zorunlu oturum çerezi var. Çerez için ayrı aydınlatma veya bildirim gerekir mi? İleride analiz çerezi eklenirse ne gerekir?
12. VERBİS kayıt yükümlülüğü bizim için doğar mı?

## Ön bilgilendirme ve mesafeli satış (`on-bilgilendirme.md`, `mesafeli-satis.md`)

13. ★ **Cayma hakkı istisnası aylık SaaS aboneliğine uygulanır mı?** Hizmet ödemeden hemen sonra kendiliğinden kuruluyor. Yönetmelik m.15/1-(ğ) (elektronik ortamda anında ifa edilen hizmetler) ve (h) (cayma süresi dolmadan tüketicinin onayıyla ifasına başlanan hizmetler) bentlerinden hangisi uygun?
    - (h) için ön bilgilendirme kutucuğundan ayrı, açık bir "hizmetin hemen başlamasını istiyorum, cayma hakkımı kaybedeceğimi biliyorum" onayı yeterli mi? Bu onay ayrı kayıt olarak saklanmalı mı? (Şu an veritabanında böyle bir onay türü yok; gerekiyorsa tablo değişir.)
    - Her aylık yenilemede yeni bir sözleşme ve yeni bir cayma süresi doğar mı?
    - İstisna uygulanmazsa, cayma süresinde kullanılan günlerin bedeli düşülebilir mi?
    - Taslakta iki seçenek (A: istisna, B: 14 gün cayma) var; hangisi?
14. Sözleşme ne zaman kurulmuş sayılır: siparişte (onay kaydı anında) mı, ödeme kesinleştiğinde mi? Ödeme hiç gerçekleşmezse onay kaydı ne ifade eder?
15. Yönetmelik m.6/1'deki "en az 12 punto" şartının web sayfasındaki karşılığı nedir?
16. Ödeme düğmesinin metni "Siparişi onayla ve öde" Yönetmelik m.8/1'deki ödeme yükümlülüğü bildirimini karşılar mı?
17. Otomatik yenileme ve fiyat değişikliği: kaç gün önceden, hangi kanaldan bildirilmeli? Müşterinin değişiklikten önce iptal hakkı nasıl yazılmalı? Belirsiz süreli abonelik sözleşmeleri için ayrı bir tüketici mevzuatı hükmü var mı (6502'deki abonelik sözleşmeleri hükmü vb.)?
18. Uyuşmazlık maddesi: tüketici hakem heyeti parasal sınırlarına nasıl atıf yapalım (yıllık değişiyor)? Tüketici mahkemesinden önce arabuluculuk zorunluluğu yazılmalı mı? İşletmeler için yetkili mahkeme ne olmalı?
19. Sorumluluk sınırlaması, hizmet seviyesi (erişilebilirlik) taahhüdü, delil sözleşmesi ve Satıcı'nın fesih halleri tüketiciye ve işletmeye karşı ayrı ayrı nasıl yazılmalı? Ayrı bir "Kullanım Koşulları" metni gerekir mi?
20. Logo ERP entegrasyonu: teklifle ve aşama aşama siteden ödeme alınacak. Her aşama ödemesi için de ön bilgilendirme/mesafeli satış gerekir mi, yoksa yazılı proje sözleşmesi yeterli mi?
21. Ön bilgilendirme ve sözleşmenin e-postayla gönderilmesi (bağlantı ile) "kalıcı veri saklayıcısı" şartını karşılar mı, yoksa e-postanın içine tam metin / PDF eki mi konmalı? (Şu an e-postada sürüm ve belge bağlantısı var.)

## İptal ve iade (`iptal-iade.md`)

22. Taslaktaki üç iade seçeneğinin (iade yok + cayma istisnası / ilk X gün koşulsuz / 14 gün cayma) hukuki riskleri neler?
23. Hizmet bizden kaynaklı açılamazsa (ör. adres çakışması) ve aynı siparişe çift ödeme alınırsa tam iade taahhüdü uygun mu?
24. İşletme müşterileri için iade koşulları serbestçe belirlenebilir mi?
25. "Ben" dili (Ozan'ın ağzından) iptal-iade sayfasında kullanılabilir mi, yoksa resmî dil mi olmalı?

## Kampanya izni (`kampanya-izni.md`)

26. ★ **İYS yükümlülüğü.** Yalnızca e-posta ile kampanya gönderecek küçük bir hizmet sağlayıcı olarak İYS'ye kaydolmak ve onayları İYS'ye yüklemek zorunda mıyız? Zorunluysa hangi sürede, İYS'de kayıtlı olmayan izinle gönderim yapılabilir mi? (iys.org.tr ve Yönetmelik metni bu oturumda açılamadı.)
27. Onay kaydında hangi bilgiler bulunmalı? Biz kanal, verildi/geri alındı, metin sürümü, kaynak, zaman, IP ve tarayıcıyı; kullanıcı kimliği üzerinden de ad ve e-postayı tutuyoruz. Yeterli mi? Onay ve ret kayıtları ne kadar saklanmalı?
28. Tacir/esnaf istisnasına dayanmadan herkesten izin almayı öneriyoruz. Uygun mu?
29. Her kampanya e-postasında bulunması gereken tanıtıcı bilgiler (unvan, adres, MERSİS vb.) nelerdir?
30. İzin metni değişince eski izinler geçerli kalır mı? Kullanıcı e-posta adresini değiştirirse izin yeni adrese geçer mi?
31. Randevu uygulamasında salonların kendi müşterilerine kontörle gönderdiği SMS/WhatsApp kampanyalarında hizmet sağlayıcı kim (salon mu, Moonvalesoft mu)? İYS ve onay yükümlülüğü kimde?

---

## Ozan'dan gelmesi gereken bilgiler

**Şirket ve iletişim**
- [ ] Unvan, şirket türü, adres
- [ ] Vergi dairesi ve numarası, MERSİS numarası (varsa ticaret sicil no)
- [ ] KEP adresi, destek e-postası, telefon
- [ ] Yurt dışında temsilci gerekip gerekmediği (şirket Türkiye'de yerleşikse gerekmez)

**Sağlayıcılar**
- [ ] Ödeme sağlayıcısı (MoR mu, ödeme kuruluşu mu; bkz. soru 2) ve kabul edilecek ödeme araçları
- [ ] E-posta hizmet sağlayıcısı ve sunucularının ülkesi
- [ ] Sunucu / barındırma sağlayıcısı ve veri merkezinin yeri
- [ ] Mali müşavir ve e-Arşiv / e-Fatura entegratörü
- [ ] GitHub'dan yüklenen fotoğraf: kendi sunucumuza taşınabilir mi? (Taşınırsa bir yurt dışı aktarım maddesi kalkar.)
- [ ] Sitede oturum çerezi dışında çerez veya üçüncü taraf betik (analiz, sohbet, font) var mı / olacak mı?

**Satış ve abonelik kararları**
- [ ] Fiyatlar (KDV dahil) ve her ürünün özellik listesi
- [ ] CRM ve Emlak satışa çıkıyor mu, ne zaman?
- [ ] İade politikası (iptal-iade.md'deki seçeneklerden biri)
- [ ] Cayma hakkı tercihi (avukatın görüşüyle birlikte)
- [ ] Ödeme alınamazsa: kaç gün ek süre, ne zaman dondurma
- [ ] Fiyat değişikliğinin kaç gün önceden bildirileceği
- [ ] Dönem içinde kullanıcı sayısı artırma/azaltma kuralı
- [ ] Dondurulan firmanın verisi ne kadar saklanacak; dışa aktarma ve yeniden açma var mı?
- [ ] İptali dönem sonundan önce geri alma özelliği olacak mı?
- [ ] Kurulum için söz verilecek azami süre; kurulamazsa iade mi, yeni adres mi?
- [ ] Hizmet seviyesi (erişilebilirlik) taahhüdü olacak mı?
- [ ] Kampanya e-postalarının kapsamı (yalnız kendi ürünleri mi)
- [ ] İYS kaydı yapılacak mı (avukat görüşüne göre)

## Ürün tarafına notlar (avukat cevabına göre iş doğurabilir; kod değiştirilmedi)

- Cayma istisnası için ayrı onay kutucuğu gerekirse: `legal_acknowledgements.document` yalnızca `aydinlatma`, `on_bilgilendirme`, `mesafeli_satis` değerlerini kabul ediyor; yeni bir onay türü için migration ve `POST /api/checkout`'a yeni alan gerekir.
- Yönetmelik m.6/2-a gereği temel nitelikler, toplam fiyat, cayma hakkı ve istisnası ödeme düğmesinin hemen üstünde ayrı gösterilmeli; düğme metni ödeme yükümlülüğünü açıkça söylemeli (ui-ux işi).
- Tüketici/işletme ayrımı yapılacaksa checkout'a alan eklenir.
- İYS aktarımı gerekirse izin değişikliklerinin İYS'ye gönderilmesi için bir iş (job) türü gerekir.
- Saklama süreleri belirlenince süre sonu silme/anonimleştirme işleri gerekir; silinmeyen kayıt tablolarıyla ilişkisi ayrıca tasarlanmalı.

---

## Kaynaklar

Bu oturumda içeriği **okunabilen** resmî kaynaklar:

- Mesafeli Sözleşmeler Yönetmeliği (RG 27.11.2014, 29188; değişiklikler RG 09.02.2019, 30681 ve 23.08.2022, 31932), Ticaret Bakanlığı kopyası: https://tuketici.ticaret.gov.tr/data/5e819a8e13b876a1b04c7a4a/Mesafeli%20S%C3%B6zle%C5%9Fmeler%20Y%C3%B6netmeli%C4%9Fi.pdf — kullanılan maddeler: m.4 (tüketici), m.5 (ön bilgilendirme içeriği, a–k bentleri), m.6 (12 punto; internet satışında ödeme öncesi ayrıca gösterilecek bilgiler), m.7 (teyit), m.8/1 (ödeme yükümlülüğü bildirimi), m.9 (14 gün; hizmette sözleşme günü başlar), m.10 (eksik bilgilendirmede süre), m.11 (cayma bildirimi), m.12 (14 gün içinde iade), m.15/1-(ğ) ve (h) (istisnalar), m.20 (kayıtların 3 yıl saklanması).
- KVKK Aydınlatma Yükümlülüğünün Yerine Getirilmesi Rehberi (Aydınlatma Tebliği RG 10.03.2018, 30356 hükümlerini içerir): https://kvkk.gov.tr/SharedFolderServer/CMSFiles/a569a068-c079-4189-b134-f57bc727af7d.pdf — aydınlatma unsurları, amaç/hukuki sebebin açıkça belirtilmesi, aydınlatma ile açık rızanın ayrı yapılması, m.11 hakları, m.9 (değişiklik öncesi anlatım).
- KVKK Hakkında Sıkça Sorulan Sorular: https://kvkk.gov.tr/SharedFolderServer/CMSFiles/c148901d-cd7f-43ff-ae9a-978fb78fb43c.pdf — m.13 (30 gün), başvuru yolları (Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ), veri işleyen, saklama, m.5/2-c.
- Ticaret Bakanlığı, Ticari Elektronik İletiler — Genel Bilgiler: https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler — onay şartı, onayın ret edilene kadar geçerliliği, e-postayla onay istenememesi, tacir/esnaf istisnası, şikâyet süresi.
- Ticaret Bakanlığı, Yönetmelik yürürlük haberi: https://ticaret.gov.tr/haberler/ticari-iletisim-ve-ticari-elektronik-i%CC%87letiler-hakkinda-yonetmelik-resmi-gazetede-yayimlanarak-yururluge-girdi — onay gerektirmeyen bilgilendirme iletileri, ret ve üç iş günü.
- Ticaret Bakanlığı, Tüketici Hakem Heyetleri SSS (2019), 15. soru: https://ticaret.gov.tr/data/5d43e87b13b876433065530b/08770c83dd8bc377676ab1575ebf8d99.pdf — 6563 m.6 (yazılı veya elektronik onay), m.8 (ret, üç iş günü), m.11.
- Ticaret Bakanlığı, İleti Yönetim Sistemi sayfası: https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/ileti-yonetim-sistemi-iys — İYS'nin kuruluşu, 04.01.2020 Yönetmelik değişikliği.
- Uşak Ticaret İl Müdürlüğü, Ticari Elektronik İleti SSS: https://usak.ticaret.gov.tr/sikca-sorulan-sorular/ticari-elektronik-ileti-ile-ilgili-sorular — ret sonrası 3 iş günü, İYS'nin vatandaş tarafı.

Bağlantısı bulunan ama bu oturumda **açılamayan** kaynaklar (erişim engeli; avukatın güncel metinden teyit etmesi gerekir):

- 6698 sayılı KVKK ve değişiklikleri: https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=32610&MevzuatTertip=5 (değişiklik), Kanun metni mevzuat.gov.tr'de "6698" numarasıyla
- Aydınlatma Yükümlülüğü Tebliği: https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig ve https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=24454&mevzuatTur=Teblig&mevzuatTertip=5
- Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik: https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20914&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5
- İYS kanun, yönetmelik ve SSS sayfaları: https://iys.org.tr/iys/kanun, https://iys.org.tr/iys/yonetmelik, https://iys.org.tr/iys/yonetmelik-degisiklik, https://iys.org.tr/iys/sss
- KVKK yurt dışı aktarım: https://www.kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu, https://www.kvkk.gov.tr/Icerik/8142/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi
- KVKK Kurul kararı 2018/90 (aydınlatma ve açık rızanın ayrı alınması): https://www.kvkk.gov.tr/Icerik/5420/2018-90

Doğrulanamadığı için taslaklarda kesin hüküm olarak **yazılmayan** konular: İYS kayıt/yükleme yükümlülüğü ve süreleri, ticari ileti onay kayıtlarının saklama süresi, iletide bulunması gereken tanıtıcı bilgiler, KVKK m.9'un güncel hâli ve standart sözleşme bildirim süresi, vergi/ticaret mevzuatındaki saklama süreleri, VERBİS eşikleri, tüketici uyuşmazlıklarında arabuluculuk ve parasal sınırlar.
