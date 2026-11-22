import Link from 'next/link';
import { Portrait } from '@/components/portrait';
import { buttonClass } from '@/components/ui/button';
import { formatTL } from '@/lib/api';
import { serverApi, type Plan } from '@/lib/server-api';

// Fiyatlar her istekte API'den gelir (Ozan fiyat değiştirince sayfa yeniden derlenmesin).
export const dynamic = 'force-dynamic';

const PRODUCTS = [
  {
    title: 'Randevu Sistemi',
    text: 'Online randevu, otomatik hatırlatma ve personel takvimi.',
    icon: (
      <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM16 3v4M8 3v4M3 10h18" />
    ),
    tone: 'accent',
  },
  {
    title: 'CRM',
    text: 'Müşteriler, teklifler ve satış hattı tek yerde.',
    icon: <path d="M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-1.5-5-4-5.6" />,
    tone: 'secondary',
  },
  {
    title: 'Emlak Sistemi',
    text: 'Portföy yönetimi ve alıcı–ilan eşleştirme.',
    icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    tone: 'accent',
  },
  {
    title: 'Logo ERP Entegrasyonu',
    text: 'E-ticaret, pazaryeri ve özel sistemlerle Logo arasında köprü.',
    icon: <path d="M8 7h12l-3-3M16 17H4l3 3" />,
    tone: 'secondary',
  },
] as const;

const FEATURES: Record<string, string[]> = {
  'randevu-aylik': ['Online randevu sayfası', 'SMS / e-posta hatırlatma', 'Personel takvimi'],
  'crm-aylik': ['Müşteri ve firma kartları', 'Teklif ve satış takibi', 'Ekip yetkileri'],
  'emlak-aylik': ['Portföy yönetimi', 'Alıcı–ilan eşleştirme', 'Danışman raporları'],
  'logo-erp': ['Ücretsiz ön görüşme', 'Kapsam ve fiyat netleşir', 'Ödeme siteden, aşamalı'],
};

const PHASES = [
  { title: 'Paketini seç', text: 'İhtiyacına uyan ürün ve plan.', fill: 'none' },
  { title: 'Hesap oluştur', text: 'E-postanla bir dakikada üye ol.', fill: 'quarter' },
  { title: 'Güvenle öde', text: 'Kartla öde, faturan e-postana gelsin.', fill: 'half' },
  { title: 'Kurulumu ben yaparım', text: 'Panelinden takip et, destek iste.', fill: 'full' },
] as const;

function PlanCard({ plan, featured }: { plan: Plan; featured: boolean }) {
  const quote = plan.id === 'logo-erp';
  const price = quote ? 'Teklife göre' : plan.priceKurus === null ? 'Yakında' : formatTL(plan.priceKurus);
  const href = quote ? '/teklif' : `/satin-al/${plan.id}`;
  return (
    <article
      className={`flex flex-col gap-4 rounded-lg border p-8 ${featured ? 'border-accent bg-surface-raised' : 'border-line bg-surface'}`}
    >
      <h3 className="flex justify-between gap-2 font-sans text-lg font-semibold">{plan.name}</h3>
      <p className="font-heading text-4xl font-semibold">
        {price}
        {!quote && plan.priceKurus !== null && (
          <span className="font-sans text-[15px] font-normal text-subtle">{plan.perSeat ? ' / kişi / ay' : ' / ay'}</span>
        )}
      </p>
      <ul className="flex grow flex-col gap-1.5 pl-5 text-[15px] text-muted [list-style:disc]">
        {(FEATURES[plan.id] ?? []).map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {quote ? (
        <Link href={href} className={buttonClass('secondary')}>
          Teklif iste
        </Link>
      ) : plan.purchasable ? (
        <Link href={href} className={buttonClass(featured ? 'primary' : 'outline')} aria-label={`${plan.name} satın al`}>
          Satın al
        </Link>
      ) : (
        <Link href="/#iletisim" className={buttonClass('outline')} aria-label={`${plan.name} hazır olunca haber al`}>
          Hazır olunca haber ver
        </Link>
      )}
    </article>
  );
}

export default async function Home() {
  const plans = (await serverApi<Plan[]>('/api/plans')) ?? [];
  return (
    <>
      <section className="container-mv flex flex-wrap items-center gap-12 pb-28 pt-20 md:pt-24">
        <div className="min-w-0 flex-[999_1_540px]">
          <p className="mb-6 text-[15px] font-medium text-secondary">Gece yarısı da çalışan yazılımlar</p>
          <h1 className="text-[clamp(42px,5.6vw,78px)] font-semibold leading-[1.04] tracking-[-0.03em]">
            Sen uyurken işini <span className="text-accent-text">yürüten</span> sistemler kuruyorum.
          </h1>
          <p className="mt-7 max-w-[560px] text-[19px] text-muted">
            Randevular kendiliğinden dolsun, müşteriler unutulmasın, siparişler Logo&apos;ya kendiliğinden düşsün. Paketini seç,
            öde — kurulumu ben yaparım.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/#fiyatlar" className={buttonClass('primary', 'px-7 py-4')}>
              Paketleri gör
            </Link>
            <Link href="/#iletisim" className={buttonClass('outline', 'px-7 py-4')}>
              Benimle konuş
            </Link>
          </div>
        </div>
        <div aria-hidden="true" className="relative h-[420px] min-w-0 flex-[1_1_360px]">
          <div className="absolute left-1/2 top-10 -ml-[130px] h-[260px] w-[260px] rounded-full bg-moon shadow-[0_0_80px_color-mix(in_srgb,var(--mv-moon)_40%,transparent),0_0_160px_color-mix(in_srgb,var(--mv-moon)_20%,transparent)]" />
          <div className="absolute left-1/2 top-[70px] -ml-5 h-[46px] w-[46px] rounded-full bg-moon brightness-90" />
          <div className="absolute left-1/2 top-[190px] ml-10 h-[30px] w-[30px] rounded-full bg-moon brightness-90" />
          <div className="absolute left-[8%] top-5 h-1 w-1 rounded-full bg-fg" />
          <div className="absolute right-[6%] top-[120px] h-[3px] w-[3px] rounded-full bg-fg" />
          <div className="absolute left-[4%] top-[260px] h-[3px] w-[3px] rounded-full bg-secondary" />
          <div className="absolute inset-x-0 bottom-2.5 flex items-center gap-3.5 rounded-[18px] border border-line bg-surface px-5 py-4">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-[15px] text-muted">
              <span className="font-semibold text-fg">03:12</span> · Yeni randevu alındı, hatırlatma planlandı
            </span>
          </div>
        </div>
      </section>

      <section id="urunler" className="container-mv scroll-mt-8 pb-28 pt-10">
        <h2 className="mb-3 text-[clamp(32px,4vw,52px)] font-semibold">Ürünler</h2>
        <p className="mb-12 max-w-[560px] text-muted">Her biri gerçek işletmelerin sorunlarından doğdu.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {PRODUCTS.map((p) => (
            <article key={p.title} className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-8">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={p.tone === 'accent' ? 'var(--mv-accent-text)' : 'var(--mv-secondary)'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {p.icon}
              </svg>
              <h3 className="text-2xl font-semibold">{p.title}</h3>
              <p className="text-muted">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="nasil" className="scroll-mt-8 border-y border-line bg-section px-6 py-28">
        <div className="mx-auto max-w-[var(--mv-max-width)]">
          <h2 className="mb-14 text-[clamp(32px,4vw,52px)] font-semibold">Ayın evreleri gibi, dört adım</h2>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
            {PHASES.map((ph) => (
              <li key={ph.title} className="flex flex-col gap-2.5">
                <span
                  aria-hidden="true"
                  className={`h-11 w-11 rounded-full border-2 border-moon ${
                    ph.fill === 'quarter'
                      ? 'shadow-[inset_-14px_0_0_var(--mv-moon)]'
                      : ph.fill === 'half'
                        ? 'shadow-[inset_-24px_0_0_var(--mv-moon)]'
                        : ph.fill === 'full'
                          ? 'bg-moon'
                          : ''
                  }`}
                />
                <h3 className="mt-2 font-sans text-xl font-semibold">{ph.title}</h3>
                <p className="text-muted">{ph.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="fiyatlar" className="container-mv scroll-mt-8 py-28">
        <h2 className="mb-3 text-[clamp(32px,4vw,52px)] font-semibold">Fiyatlar</h2>
        <p className="mb-12 text-muted">Aylık plan, gizli ücret yok, istediğin zaman iptal.</p>
        {plans.length === 0 ? (
          <p className="text-muted" role="status">
            Fiyatları şu an getiremedim. Birazdan tekrar bak ya da bana yaz.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} featured={p.id === 'randevu-aylik'} />
            ))}
          </div>
        )}
      </section>

      <section id="ben" className="container-mv flex scroll-mt-8 flex-wrap items-center gap-14 pb-28 pt-10">
        <div className="flex min-w-0 flex-[1_1_260px] justify-center">
          <Portrait />
        </div>
        <div className="min-w-0 flex-[999_1_520px]">
          <h2 className="text-[clamp(32px,4vw,52px)] font-semibold">Merhaba, ben Ozan.</h2>
          <p className="mt-5 text-[19px] text-muted">
            Logo ERP uyarlama ve entegrasyonunda takım lideriyim; C#/.NET ve SQL Server ile çalışıyorum. Moonvalesoft&apos;u, küçük
            işletmelerin de sağlam yazılıma kolayca ulaşabilmesi için kurdum.
          </p>
          <p className="mt-4 text-[19px] text-muted">Destek istediğinde karşında sistemi yazan kişi var.</p>
        </div>
      </section>

      <section id="iletisim" className="scroll-mt-8 border-t border-line px-6 py-24">
        <div className="mx-auto flex max-w-[var(--mv-max-width)] flex-wrap items-center justify-between gap-6">
          <h2 className="max-w-[680px] text-[clamp(34px,4.5vw,64px)] font-semibold tracking-[-0.03em]">
            Bu gece kur, yarın sabah işini rahatlat.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/kayit" className={buttonClass('primary', 'px-8 py-4 text-lg')}>
              Hesap oluştur
            </Link>
            <Link href="/panel/destek" className={buttonClass('outline', 'px-8 py-4 text-lg')}>
              Bana yaz
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
