# Moonvalesoft Web

Moonvalesoft'un firma sitesi: https://moonvalesoft.github.io/moonvalesoft-web/ (GitHub Pages, `main`'e her birleştirmede kendiliğinden yayınlanır; alt yol yayın akışında otomatik). Ürünleri ve Logo hizmetlerini tanıtır; müşteri teklif, öneri ve şikâyet için Ozanay'a **Telegram'dan** ulaşır. Sitede yazı: "Moonvalesoft" (büyük M); kişi adı "Ozanay".
Kurucu ve son onay mercii: **Ozan**. Ana dala Ozan onaylamadan kod girmez.

Kapsam (Ozan, 23 Kasım 2026): üyelik, giriş, fiyat, ödeme ve hukuk sayfaları **yok**. Her ürün ve hizmette "Teklif al" düğmesi Telegram sohbetini açar. Önceki üyelikli/ödemeli sürüm `demo` dalında duruyor.

## İçerik

Bütün ürün ve hizmet metinleri `apps/web/lib/site.ts` içinde. Telegram: `ozanay24` (`NEXT_PUBLIC_TELEGRAM_USERNAME` ile değişir).

- Yazılımlar (`SOFTWARE`): Randevu, CRM, Emlak Sistemi, B2B.
- Entegrasyonlar (`INTEGRATIONS`): E-Ticaret, Banka, Kasa; "Senin sistemin" merkezine bağlanır.
- Logo hizmetleri: Logo ERP entegrasyonu; Logo Object Designer ile uyarlama (Tiger serisi, Bordro Plus); Logo Cloud Connect kuralları.
- "Nasıl çalışır": ayın dört evresi = projenin dört adımı (keşif, plan ve teklif, kurulum, destek), `PROJECT_PHASES`.
- Logo: "Hilal Vadi" (hilal, içindeki vadiyi kucaklar), `design/brand/logo.svg`.
- Sonra: her ürün için görsel/video sayfası (`/urunler/<slug>`), ürünler bitince.

Fiyat, özellik veya müşteri sayısı uydurma; bilinmiyorsa yazma ya da "teyit edilecek" de.

## Tasarım kuralları (değiştirmeden önce Ozan'a sor)

- Kimlik kurumsal değil kişisel: "ben" dili, Ozan'ın kendisi konuşur. Çağrı merkezi değil, sistemi yazan kişi.
- Tema: ay teması. İki mod var: **Gece** (koyu lacivert, ay sarısı vurgu) ve **Gündüz** (açık zemin, aynı vurgular koyulaştırılmış). Varsayılan cihazın tercihi; menüde ay/güneş düğmesiyle değişir, seçim hatırlanır.
- Renkler, yazı tipleri ve aralıklar yalnızca `design/tokens.json` dosyasından gelir. Bileşende elle renk kodu yazılmaz.
- Yazı tipleri: başlık Space Grotesk, metin Inter.
- Erişilebilirlik: her iki modda metin kontrastı en az 4.5:1, dokunma alanı en az 44 px, klavyeyle gezilebilir.
- Onaylı tasarım tuvali: https://claude.ai/artifact/1SscxbqpGfU3zmStL96iVL (artboard "3 · Gece" ve "3b · Gündüz").

## Uyum

Site şu an kişisel veri toplamıyor (form, üyelik, çerez yok; tema seçimi yalnız tarayıcıda). Bir form veya üyelik eklenirse `docs/uyum-standardi.md` (bütün Moonvalesoft ürünleri) hemen geçerli olur: aydınlatma metni, kampanya izni, RLS.

## Teknik kararlar

- Next.js, statik dışa aktarım (`output: 'export'`): sunucu ve veritabanı yok; `npm run build` çıktısı `apps/web/out` herhangi bir statik barındırmaya konur.
- Tailwind; renkler `design/tokens.json` → `app/tokens.css`.
- Fotoğraf: önce `apps/web/public/ozanay.jpg`, yoksa GitHub sitesindeki profile.jpg, o da yoksa baş harf.
- Güvenlik başlıkları (CSP, HSTS) barındırma tarafında verilir.

## Çalışma kuralları (bütün roller)

- Her değişiklik bir PR'dır; testler geçmeden ve Ozan onaylamadan birleştirme yok.
- Ekran işi önce ui-ux'ten geçer: ui-ux tasarımı ve kabul kriterlerini yazar, frontend uygular, ui-ux PR'ı tasarıma uygunluk için inceler.
- Her PR'da: `npm run typecheck`, `npm run build`, iki modda ve telefonda görünüm kontrolü.
- Uydurma rakam, fiyat veya hukuki kesinlik yazma; bilmiyorsan "teyit edilecek" de.
- Yazışma dili Türkçe; kod, tablo ve değişken adları İngilizce.
