import { Icon, TelegramIcon } from '@/components/icon';
import { Portrait } from '@/components/portrait';
import { HeroScene, RidgeStrip } from '@/components/scene';
import { buttonClass } from '@/components/ui/button';
import { LOGO_SERVICES, PRODUCTS, quoteText, telegramLink, type Offering, type Tone } from '@/lib/site';

const TONE: Record<Tone, string> = {
  moon: 'var(--mv-tile-moon)',
  violet: 'var(--mv-tile-violet)',
  teal: 'var(--mv-tile-teal)',
  water: 'var(--mv-tile-water)',
};

const GLOW = 'color-mix(in srgb, var(--mv-logo-moon) 35%, transparent)';

const PHASES = [
  { title: 'Bana yaz', text: "Telegram'dan ihtiyacını anlat.", inset: 0 },
  { title: 'Konuşalım', text: 'Kapsamı birlikte netleştirelim.', inset: 15 },
  { title: 'Teklifini al', text: 'Sana özel teklifi hazırlarım.', inset: 26 },
  { title: 'Kurulumu ben yaparım', text: 'Kurar, teslim eder, yanında olurum.', inset: 48 },
] as const;

function OfferingRow({ o }: { o: Offering }) {
  const c = TONE[o.tone];
  return (
    <li className="grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-4 rounded-lg px-3 py-6 transition-colors hover:bg-surface sm:-mx-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-md"
        style={{ background: `color-mix(in srgb, ${c} 16%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 35%, transparent)` }}
      >
        <Icon name={o.icon} color={c} />
      </span>
      <div>
        <h3 className="text-2xl font-semibold">{o.title}</h3>
        <p className="mt-1 max-w-[52ch] text-muted">{o.text}</p>
      </div>
      <a
        href={telegramLink(quoteText(o.title))}
        className={buttonClass('outline', 'col-start-2 gap-2 justify-self-start sm:col-start-auto sm:justify-self-end')}
        aria-label={`${o.title} için teklif al`}
      >
        <TelegramIcon />
        Teklif al
      </a>
    </li>
  );
}

function OfferingGroup({ id, title, intro, items }: { id: string; title: string; intro: string; items: Offering[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-baslik`} className="container-mv grid scroll-mt-8 gap-8 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
      <div className="md:sticky md:top-8 md:self-start">
        <h2 id={`${id}-baslik`} className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.1]">
          {title}
        </h2>
        <p className="mt-3 max-w-[40ch] text-muted">{intro}</p>
      </div>
      <ul className="divide-y divide-line">
        {items.map((o) => (
          <OfferingRow key={o.slug} o={o} />
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  return (
    <>
      {/* Açılış: boydan boya gece vadisi; üst menü sahnenin üstünde durur. */}
      <section className="mv-sky relative isolate -mt-[96px] overflow-hidden pt-[96px]">
        <HeroScene className="absolute inset-x-0 bottom-0 -z-10 h-[460px] w-full sm:h-[600px] lg:h-[740px]" />
        <div className="container-mv pb-[390px] pt-14 sm:pb-[360px] md:pt-20 lg:pb-[400px]">
          <div className="max-w-[860px]">
            <h1 className="text-[clamp(44px,6vw,84px)] font-semibold leading-[1.02] tracking-[-0.035em] text-fg">
              Sen uyurken işini yürüten sistemler kuruyorum.
            </h1>
            <p className="mt-7 max-w-[36em] text-[19px] text-fg">
              Randevular kendiliğinden dolsun, müşteriler unutulmasın, siparişler Logo&apos;ya kendiliğinden düşsün. Ne istediğini yaz,
              birlikte netleştirelim; kurulumu ben yaparım.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#urunler" className={buttonClass('primary', 'px-7 py-4 shadow-[0_8px_30px_color-mix(in_srgb,var(--mv-accent)_35%,transparent)]')}>
                Ürünlere bak
              </a>
              <a href={telegramLink()} className={buttonClass('outline', 'gap-2 bg-bg/40 px-7 py-4 backdrop-blur-md')}>
                <TelegramIcon />
                Telegram&apos;dan yaz
              </a>
            </div>
          </div>
        </div>
      </section>

      <OfferingGroup id="urunler" title="Ürünler" intro="Her biri gerçek işletmelerin sorunlarından doğdu." items={PRODUCTS} />
      <OfferingGroup id="logo" title="Logo hizmetleri" intro="Logo tarafında entegrasyon, uyarlama ve kural yazımı." items={LOGO_SERVICES} />

      <section id="nasil" className="mt-8 scroll-mt-8 border-y border-line bg-section px-6 py-28">
        <div className="mx-auto max-w-[var(--mv-max-width)]">
          <h2 className="mb-14 text-[clamp(32px,4vw,52px)] font-semibold">Ayın evreleri gibi, dört adım</h2>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
            {PHASES.map((ph) => (
              <li key={ph.title} className="flex flex-col gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-12 w-12 rounded-full border-2"
                  style={{
                    borderColor: 'var(--mv-logo-moon)',
                    boxShadow: `inset -${ph.inset}px 0 0 var(--mv-logo-moon), 0 0 28px ${GLOW}`,
                  }}
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

      <section id="iletisim" className="mv-sky relative isolate scroll-mt-8 overflow-hidden px-6 pb-36 pt-24">
        <RidgeStrip className="absolute inset-x-0 bottom-0 -z-10 h-[110px] w-full" />
        <div className="mx-auto flex max-w-[var(--mv-max-width)] flex-wrap items-center justify-between gap-6">
          <div className="max-w-[680px]">
            <h2 className="text-[clamp(34px,4.5vw,64px)] font-semibold leading-[1.08] tracking-[-0.03em] text-fg">
              Bu gece yaz, yarın sabah konuşalım.
            </h2>
            <p className="mt-4 text-lg text-fg">Öneri, şikâyet ya da teklif için bana Telegram&apos;dan ulaş.</p>
          </div>
          <a
            href={telegramLink()}
            className={buttonClass('primary', 'gap-2 px-8 py-4 text-lg shadow-[0_8px_30px_color-mix(in_srgb,var(--mv-accent)_35%,transparent)]')}
          >
            <TelegramIcon />
            Telegram&apos;dan yaz
          </a>
        </div>
      </section>
    </>
  );
}
