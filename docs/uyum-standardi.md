# Moonvalesoft uyum standardı (bütün ürünler)

Bu dosya Moonvalesoft'un geliştirdiği **her ürün** için geçerlidir: firma sitesi (moonvalesoft.com), Moonvale Randevu, CRM, Emlak Sistemi, Logo ERP entegrasyonları ve bundan sonra açılacak her proje.
Karar sahibi Ozan. Yasal metinlerin içeriğini hukukçu yazar; biz yerini, sürümünü ve kaydını tutarız. Hukuki kesinlik içeren cümle uydurmayız, bilmediğimize "teyit edilecek" deriz.

Yeni bir proje açılırken bu dört madde CLAUDE.md'ye eklenir ve aşağıdaki kontrol listesi PR şablonuna girer.

## 1. Veritabanında Row Level Security (RLS) açık

- Kişisel veya müşteri verisi tutan **her tabloda** `ENABLE ROW LEVEL SECURITY` **ve** `FORCE ROW LEVEL SECURITY` açıktır. Politika yazılmamış tablo hiçbir satır göstermez (varsayılan: kapalı kapı).
- Uygulama veritabanına **süper kullanıcı veya tablo sahibi olarak bağlanmaz**. Uygulamanın kendi rolü vardır (`mv_app`): `NOLOGIN`, `BYPASSRLS` yok, sadece gereken tablo yetkileri.
- Kim adına çalışıldığı her istekte, işlem başında ayarlanır (`set_config(..., true)`, yani yalnızca o işlem için):
  - Çok kiracılı ürünlerde (Randevu, CRM, Emlak): `app.tenant_id`. Politika yalnızca `tenant_id` eşitliğidir; her indeks `tenant_id` ile başlar.
  - Firma sitesinde: `app.user_id`. Politika yalnızca `user_id` eşitliğidir.
  - Ödeme bildirimi, zamanlanmış işler, giriş gibi "kimse adına değil" işler: `app.system = on`. Bu kapsam kodda açıkça yazılır (`asSystem`), varsayılan değildir.
- Bağlam ayarlanmamış bir sorgu **hiçbir satır görmez ve yazamaz**. "Unuttum" hatası veri sızdırmaz, boş sonuç verir.
- Sorgulardaki `WHERE user_id = ...` / `WHERE tenant_id = ...` filtreleri kalır; RLS ikinci kilittir, ilkinin yerine geçmez.
- Asla atlanmayacak testler:
  - Her tabloda `relrowsecurity` ve `relforcerowsecurity` açık (yeni tablo eklenince test kendiliğinden yakalar).
  - Uygulama rolü süper kullanıcı değil, `BYPASSRLS` yok.
  - Bağlamsız sorgu 0 satır döner.
  - A kullanıcısı/firması bağlamında, `WHERE` yazılmadan bile B'nin satırı görünmez ve B adına satır yazılamaz.

## 2. KVKK aydınlatma metni

- Kişisel veri toplanan **her formda** (üyelik, satın alma, iletişim, destek, randevu alma) aydınlatma metnine görünür bir bağlantı vardır; form gönderilmeden önce okunabilir.
- Aydınlatma bir "rıza" değildir; onunla birlikte başka bir izin istenmez, kutucuklar birleştirilmez.
- Üyelikte "Aydınlatma Metni'ni okudum" kutucuğu zorunludur; işaretlenmeden hesap açılmaz.
- Hangi sürümün gösterildiği kaydedilir: kullanıcı, belge, sürüm, zaman, IP, tarayıcı (`legal_acknowledgements`). Kayıt silinmez, güncellenmez.
- Metin değişince sürüm numarası artar; eski sürümler arşivde okunabilir kalır.
- Teyit edilecek (hukukçu): veri sorumlusu bilgileri, işleme amaçları ve hukuki sebepler, aktarılan taraflar (ödeme sağlayıcı, e-posta, sunucu), saklama süreleri, ilgili kişi başvuru yolu, yurt dışı aktarım olup olmadığı.

## 3. Kampanya (ticari elektronik ileti) izni

- Kampanya, duyuru, indirim gibi tanıtım iletileri **yalnızca açık izin verenlere** gönderilir (6563 sayılı Kanun).
- İzin kutucuğu **ayrıdır, isteğe bağlıdır ve işaretsiz gelir**. İzin vermemek üyeliği, satın almayı veya hizmeti hiçbir şekilde engellemez.
- İzin kanal bazındadır (e-posta, SMS, arama). Her değişiklik silinmeyen bir kayıt olarak tutulur: kanal, verildi/geri alındı, metin sürümü, kaynak (üyelik, panel, bağlantı), zaman, IP, tarayıcı (`marketing_consents`).
- Kullanıcı izni panelden tek tıkla geri alır. Gönderilen her kampanya iletisinde zahmetsiz "izni geri al" bağlantısı olur.
- İşlem e-postaları (doğrulama, fatura, şifre, kurulum) izinden bağımsızdır ve **içlerine kampanya konmaz**.
- Teyit edilecek: İleti Yönetim Sistemi (İYS) kaydı ve izinlerin İYS'ye aktarılması (Ozan + muhasebeci/hukukçu), izin metninin son hali.

## 4. Ön bilgilendirme (ve mesafeli satış sözleşmesi)

- Siteden yapılan **her satın almada**, ödeme sayfasına gitmeden önce müşteriye ön bilgilendirme formu ve mesafeli satış sözleşmesi gösterilir.
- Formun üstünde siparişin kendi bilgileri yer alır: satıcı bilgileri, ürün, kişi sayısı, KDV dahil toplam tutar, ödeme sıklığı, cayma/iptal koşulları. Tutar sunucunun hesapladığı tutardır.
- "Ön Bilgilendirme Formu'nu ve Mesafeli Satış Sözleşmesi'ni okudum, onaylıyorum" kutucuğu zorunludur; işaretlenmeden ödeme düğmesi çalışmaz. Sunucu da onay sürümü gelmeden siparişi açmaz.
- Onay siparişe bağlı olarak kaydedilir: belge, sürüm, sipariş, zaman, IP, tarayıcı. Belgelerin bir kopyası sipariş sonrası e-postayla gönderilir (kalıcı veri saklayıcısı).
- Teyit edilecek (hukukçu): müşterilerin çoğu işletme (tacir) olduğu için Mesafeli Sözleşmeler Yönetmeliği'nin hangi müşterilere uygulandığı, dijital hizmette cayma hakkının istisnası ve nasıl bildirileceği, abonelik iptal ve iade koşulları.

## PR kontrol listesi

- [ ] Yeni tablo eklendiyse RLS + FORCE açık, politika yazıldı, RLS testi yeşil.
- [ ] Yeni bir form kişisel veri topluyorsa aydınlatma metni bağlantısı var.
- [ ] Yeni bir ileti türü eklendiyse: işlem iletisi mi kampanya mı? Kampanyaysa izin kontrolü ve "izni geri al" bağlantısı var.
- [ ] Satın alma akışına dokunulduysa ön bilgilendirme onayı hâlâ zorunlu ve kaydediliyor.
