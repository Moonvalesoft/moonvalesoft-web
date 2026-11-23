import { Icon, TelegramIcon } from '@/components/icon';
import { Portrait } from '@/components/portrait';
import { buttonClass } from '@/components/ui/button';
import { LOGO_SERVICES, PRODUCTS, quoteText, telegramLink, type Offering } from '@/lib/site';

const PHASES = [
  { title: 'Bana yaz', text: "Telegram'dan ihtiyacını anlat.", fill: 'none' },
  { title: 'Konuşalım', text: 'Kapsamı birlikte netleştirelim.', fill: 'quarter' },
  { title: 'Teklifini al', text: 'Sana özel teklifi hazırlarım.', fill: 'half' },
  { title: 'Kurulumu ben yaparım', text: 'Kurar, teslim eder, yanında olurum.', fill: 'full' },
] as const;

function OfferingCard({ o, tone }: { o: Offering; tone: 'accent' | 'secondary' }) {
  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-8">
      <Icon name={o.icon} tone={tone} />
      <h3 className="text-2xl font-semibold">{o.title}</h3>
      <p className="grow text-muted">{o.text}</p>
      <a href={telegramLink(quoteText(o.title))} className={buttonClass('outline', 'mt-2 gap-2')} aria-label={`${o.title} için teklif al`}>
        <TelegramIcon />
        Teklif al
      </a>
    </article>
  );
}

export default function Home() {
  return (
    <>
      <section className="container-mv flex flex-wrap items-center gap-12 pb-28 pt-20 md:pt-24">
        <div className="min-w-0 flex-[999_1_540px]">
          <p className="mb-6 text-[15px] font-medium text-secondary">Gece yarısı da çalışan yazılımlar</p>
          <h1 className="text-[clamp(42px,5.6vw,78px)] font-semibold leading-[1.04] tracking-[-0.03em]">
            Sen uyurken işini <span className="text-accent-text">yürüten</span> sistemler kuruyorum.
          </h1>
          <p className="mt-7 max-w-[560px] text-[19px] text-muted">
            Randevular kendiliğinden dolsun, müşteriler unutulmasın, siparişler Logo&apos;ya kendiliğinden düşsün. Ne istediğini yaz,
            birlikte netleştirelim; kurulumu ben yaparım.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#urunler" className={buttonClass('primary', 'px-7 py-4')}>
              Ürünlere bak
            </a>
            <a href={telegramLink()} className={buttonClass('outline', 'gap-2 px-7 py-4')}>
              <TelegramIcon />
              Telegram&apos;dan yaz
            </a>
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

      <section id="urunler" className="container-mv scroll-mt-8 pb-24 pt-10">
        <h2 className="mb-3 text-[clamp(32px,4vw,52px)] font-semibold">Ürünler</h2>
        <p className="mb-12 max-w-[560px] text-muted">Her biri gerçek işletmelerin sorunlarından doğdu.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {PRODUCTS.map((o) => (
            <OfferingCard key={o.slug} o={o} tone="accent" />
          ))}
        </div>
      </section>

      <section id="logo" className="container-mv scroll-mt-8 pb-28">
        <h2 className="mb-3 text-[clamp(32px,4vw,52px)] font-semibold">Logo hizmetleri</h2>
        <p className="mb-12 max-w-[560px] text-muted">Logo tarafında entegrasyon, uyarlama ve kural yazımı.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {LOGO_SERVICES.map((o) => (
            <OfferingCard key={o.slug} o={o} tone="secondary" />
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

      <section id="ben" className="container-mv flex scroll-mt-8 flex-wrap items-center gap-14 py-28">
        <div className="flex min-w-0 flex-[1_1_260px] justify-center">
          <Portrait />
        </div>
        <div className="min-w-0 flex-[999_1_520px]">
          <h2 className="text-[clamp(32px,4vw,52px)] font-semibold">Merhaba, ben Ozan.</h2>
          <p className="mt-5 text-[19px] text-muted">
            Logo ERP uyarlama ve entegrasyonunda takım lideriyim; C#/.NET ve SQL Server ile çalışıyorum. Moonvalesoft&apos;u, küçük
            işletmelerin de sağlam yazılıma kolayca ulaşabilmesi için kurdum.
          </p>
          <p className="mt-4 text-[19px] text-muted">Bana yazdığında karşında sistemi yazan kişi var.</p>
        </div>
      </section>

      <section id="iletisim" className="scroll-mt-8 border-t border-line px-6 py-24">
        <div className="mx-auto flex max-w-[var(--mv-max-width)] flex-wrap items-center justify-between gap-6">
          <div className="max-w-[680px]">
            <h2 className="text-[clamp(34px,4.5vw,64px)] font-semibold tracking-[-0.03em]">Bu gece yaz, yarın sabah konuşalım.</h2>
            <p className="mt-4 text-lg text-muted">Öneri, şikâyet ya da teklif için bana Telegram&apos;dan ulaş.</p>
          </div>
          <a href={telegramLink()} className={buttonClass('primary', 'gap-2 px-8 py-4 text-lg')}>
            <TelegramIcon />
            Telegram&apos;dan yaz
          </a>
        </div>
      </section>
    </>
  );
}
