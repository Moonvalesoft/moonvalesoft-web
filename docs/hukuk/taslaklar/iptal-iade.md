TASLAK: avukat onayı olmadan yayımlanamaz.

# İptal ve İade Koşulları

- Belge türü: `iptal_iade` · Sitedeki yeri: `/iptal-iade` · Sürüm: `taslak-1`
- Dayanak: 6502 sayılı Kanun; Mesafeli Sözleşmeler Yönetmeliği m.9–15 (cayma ve istisnaları).
- **Durum: iade politikası henüz kararlaştırılmadı.** Aşağıdaki iade bölümü karar seçenekleriyle hazırlandı; Ozan seçecek, avukat onaylayacak.

> Taslakçı notları (sayfaya girmez):
> - Bu sayfa bağımsız bir sözleşme değil, Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'ndeki iptal/iade hükümlerinin sade dille özetidir. Üç metin birbiriyle çelişmemeli; biri değişince üçünün sürümü birlikte gözden geçirilmeli.
> - Sitenin dili "ben" dili olduğundan bu sayfa Ozan'ın ağzından yazıldı; hukuki hükümler sözleşmede resmî dille yer alır. Avukat bu üslubu uygun bulmazsa resmî dile çevrilir.
> - Kodda tanımlı davranış (docs/api.md): iptal dönem sonunda geçerli; `payment.refunded` yalnızca **tam iade**dir, kısmi iade yoktur; iade olunca abonelik iptal edilir ve firma dondurulur.

---

## Aboneliğini nasıl iptal edersin

1. Müşteri panelinde **Paketlerim**'e gir.
2. İptal etmek istediğin aboneliğin yanındaki **İptal et** düğmesine bas ve onayla.

E-posta atmana veya beni aramana gerek yok. İptal ettiğinde sana bir onay e-postası gelir.

## İptal edince ne olur

- O ay için ödediğin dönemin sonuna kadar hizmeti kullanmaya devam edersin.
- Bir sonraki ay için kartından para çekilmez.
- Dönem bitince firman (ör. `ayse-kuafor.moonvalesoft.com`) **dondurulur**: sen ve personelin artık giremezsiniz, ama verileriniz silinmez.
- Dondurulan verileri ne kadar saklayacağım: [SAKLAMA SÜRESİ — karar bekliyor].
- Yeniden abone olursan: [YENİDEN AÇMA — aynı adresle ve verilerle mi açılır; Ozan karar verecek].
- Verilerini dışa aktarmak istersen: [DIŞA AKTARMA YOLU — var mı, hangi biçimde; Ozan karar verecek].

İptalden vazgeçersen dönem bitmeden: [İPTALİ GERİ ALMA — panelde var mı; şu an API'de yok].

## İade

[İADE KOŞULLARI — Ozan aşağıdaki seçeneklerden birini seçecek, avukat onaylayacak.]

**Seçenek 1 — İade yok, cayma istisnası:** Hizmet ödemeden hemen sonra açıldığı ve sen siparişte bunu onayladığın için ödenen aylık bedel iade edilmez. İptal yalnızca bir sonraki dönemi durdurur. (Tüketiciler için Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ/h istisnasının geçerli olmasına bağlıdır.)

**Seçenek 2 — İlk abonelikte belirli gün içinde koşulsuz iade:** İlk siparişinden sonraki [GÜN SAYISI] gün içinde iptal edersen ödediğin tutarın tamamını iade ederim. Yenileme dönemlerinde iade yoktur.

**Seçenek 3 — 14 günlük cayma hakkı (tüketiciler için):** Tüketiciysen sözleşmenin kurulduğu günden itibaren 14 gün içinde gerekçe göstermeden cayabilirsin; ödediğin tutar bildirimin bana ulaşmasından itibaren en geç 14 gün içinde, ödemede kullandığın araçla ve sana masraf çıkarmadan iade edilir (Yönetmelik m.9 ve m.12).

**Her seçenekte geçerli olması önerilenler:**

- Benden kaynaklanan bir nedenle hizmet hiç açılamazsa (ör. kurulum yapılamazsa) ödediğin tutarın tamamı iade edilir. [Ozan onaylayacak — API'deki "adres çakışması" durumunu kapsar]
- Aynı sipariş için yanlışlıkla iki kez ödeme alınırsa fazla ödeme iade edilir. [Ozan onaylayacak — API bu durumu "para ikinci kez alınmış" olarak tanımlıyor]
- İade, ödemeyi yaptığın araçla [ÖDEME KURULUŞU] üzerinden yapılır. Paranın hesabına geçme süresi bankana bağlıdır. [SÜRE — teyit edilecek]
- İade yapılan abonelik iptal edilir ve firma dondurulur.

## Kısmi dönem ve kullanıcı sayısı

- Ay ortasında iptal edersen kalan günler için kısmi iade: [YOK / VAR — karar bekliyor; şu an kodda kısmi iade yok].
- Ay ortasında kullanıcı sayısını azaltırsan: [KARAR BEKLİYOR].

## İşletme müşterileri

Mesafeli Sözleşmeler Yönetmeliği'ndeki cayma hakkı yalnızca tüketicilere uygulanır. İşletme olarak (ticari veya mesleki amaçla) satın aldıysan iade koşulları: [İŞLETMELER İÇİN İADE — avukat ve Ozan karar verecek].

## Logo ERP entegrasyonu

Proje bazlı satılır; iptal ve iade koşulları her projenin teklifinde ve sözleşmesinde ayrıca yazılır.

## Bana ulaşmak için

[E-POSTA] · [TELEFON] · [ADRES] · Panelde **Destek**
