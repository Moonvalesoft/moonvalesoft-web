# Moonvalesoft Web

Moonvalesoft'un firma sitesi: `moonvalesoft.com`. Ürünleri tanıtır, üyelik açtırır, ödemeyi alır ve satın alınan ürünü kendiliğinden kurar.
Kurucu ve son onay mercii: **Ozan**. Ana dala Ozan onaylamadan kod girmez.

Hedef: Ozan satış sürecinde elle hiçbir şey yapmasın. Müşteri paketi seçer, üye olur, öder; ürün hazır olur, fatura e-postasına gider.

## Ürünler

- Moonvale Randevu (aylık, kullanıcı başına) — ödeme sonrası `<firma>.moonvalesoft.com` kendiliğinden açılır.
- CRM (aylık) — teyit edilecek: ayrı ürün mü, ne zaman satışa çıkacak.
- Emlak Sistemi (aylık) — teyit edilecek.
- Logo ERP Entegrasyonu — projeye göre teklif; ödeme siteden, aşama aşama alınır.

Fiyatlar Ozan'dan gelir. Fiyat, özellik veya yasal metin uydurma; bilinmiyorsa `[FİYAT]`, "teyit edilecek" yaz.

## Tasarım kuralları (değiştirmeden önce Ozan'a sor)

- Kimlik kurumsal değil kişisel: "ben" dili, Ozan'ın kendisi konuşur. Çağrı merkezi değil, sistemi yazan kişi.
- Tema: ay teması. İki mod var: **Gece** (koyu lacivert, ay sarısı vurgu) ve **Gündüz** (açık zemin, aynı vurgular koyulaştırılmış). Varsayılan cihazın tercihi; menüde ay/güneş düğmesiyle değişir, seçim hatırlanır.
- Renkler, yazı tipleri ve aralıklar yalnızca `design/tokens.json` dosyasından gelir. Bileşende elle renk kodu yazılmaz.
- Yazı tipleri: başlık Space Grotesk, metin Inter.
- Erişilebilirlik: her iki modda metin kontrastı en az 4.5:1, dokunma alanı en az 44 px, klavyeyle gezilebilir.
- Onaylı tasarım tuvali: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL (artboard "3 · Gece" ve "3b · Gündüz").

## Teknik kararlar (taslak — Ozan onayı bekliyor)

- Moonvale Randevu ile aynı yığın, tek geliştirici iki farklı dünya öğrenmesin diye:
  - Web: Next.js (arama motorları için sunucu tarafı sayfa), shadcn/ui + Tailwind.
  - API: TypeScript + NestJS (Fastify), PostgreSQL.
- Üyelik: e-posta + şifre, e-posta doğrulaması zorunlu. Müşteri paneli: paketlerim, faturalarım, destek taleplerim.
- Ödeme: sağlayıcı henüz seçilmedi (aday: Lemon Squeezy / Paddle veya iyzico / PayTR). Kod tek bir `PaymentProvider` arayüzünün arkasında yazılır; sağlayıcı değişince sadece adaptör değişir.
- Kart bilgisi bizde asla tutulmaz ve sunucumuzdan geçmez; sağlayıcının ödeme sayfası veya gömülü formu kullanılır.
- Satın alma kesinleşmesi yalnızca sağlayıcının imzalı webhook'u ile olur; tarayıcıdan gelen "ödeme başarılı" yönlendirmesine güvenilmez. Webhook'lar idempotenttir.
- Randevu satın alınınca Randevu API'sindeki yetkili bir uç noktayla firma (tenant) kendiliğinden açılır. Abonelik biterse firma dondurulur, veri silinmez.
- Fatura: e-Arşiv zorunluluğu ve hangi entegratörün kullanılacağı teyit edilecek (muhasebeci ile).
- Yasal sayfalar: KVKK aydınlatma metni, mesafeli satış sözleşmesi, ön bilgilendirme formu, iptal ve iade — metinleri hukukçu yazar, biz yer açarız.
- Altyapı: Randevu ile aynı sunucu, Docker Compose, Caddy. `moonvalesoft.com` ve `www` bu projeye gider.

## Çalışma kuralları (bütün roller)

- Her değişiklik bir PR'dır; testler geçmeden ve Ozan onaylamadan birleştirme yok.
- Ekran işi önce ui-ux'ten geçer: ui-ux tasarımı ve kabul kriterlerini yazar, frontend uygular, ui-ux PR'ı tasarıma uygunluk için inceler.
- Kabul testlerini QA önceden yazar; kodu yazan ajan kendi kabul testini yazıp geçirmez.
- Asla atlanmayacak testler: ödeme webhook'u (sahte, tekrarlanan, sırası bozuk istek), başarısız ödeme, abonelik iptali, bir üyenin başka üyenin faturasını görememesi.
- Uydurma rakam, fiyat veya hukuki kesinlik yazma; bilmiyorsan "teyit edilecek" de.
- Yazışma dili Türkçe; kod, tablo ve değişken adları İngilizce.
