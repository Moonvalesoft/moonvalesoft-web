import { Icon, TelegramIcon } from '@/components/icon';
import { Portrait } from '@/components/portrait';
import { HeroScene, RidgeStrip } from '@/components/scene';
import { buttonClass } from '@/components/ui/button';
import { MoonPhase } from '@/components/moon-phase';
import { INTEGRATIONS, LOGO_SERVICES, PROJECT_PHASES, SOFTWARE, quoteText, telegramLink, type Offering, type Tone } from '@/lib/site';

const TONE: Record<Tone, string> = {
  moon: 'var(--mv-tile-moon)',
  violet: 'var(--mv-tile-violet)',
  teal: 'var(--mv-tile-teal)',
  water: 'var(--mv-tile-water)',
};

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

function TileIcon({ o, size = 'md' }: { o: Offering; size?: 'md' | 'lg' }) {
  const c = TONE[o.tone];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md ${size === 'lg' ? 'h-16 w-16' : 'h-14 w-14'}`}
      style={{ background: `color-mix(in srgb, ${c} 16%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 35%, transparent)` }}
    >
      <Icon name={o.icon} color={c} />
    </span>
  );
}

function QuoteButton({ o, className = '' }: { o: Offering; className?: string }) {
  return (
    <a href={telegramLink(quoteText(o.title))} className={buttonClass('outline', `gap-2 ${className}`)} aria-label={`${o.title} için teklif al`}>
      <TelegramIcon />
      Teklif al
    </a>
  );
}

/** Yazılımlar: dört büyük kart; her kartın köşesinde kendi renginde ışıltı. */
function SoftwareSection() {
  return (
    <section id="urunler" aria-labelledby="urunler-baslik" className="container-mv scroll-mt-8 pb-16 pt-20">
      <h2 id="urunler-baslik" className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.1]">
        Yazılımlar
      </h2>
      <p className="mt-3 max-w-[48ch] text-muted">Her biri gerçek işletmelerin sorunlarından doğdu.</p>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {SOFTWARE.map((o) => {
          const c = TONE[o.tone];
          return (
            <li
              key={o.slug}
              className="relative flex flex-col gap-5 overflow-hidden rounded-lg border border-line bg-surface p-8"
              style={{ backgroundImage: `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${c} 14%, transparent), transparent 60%)` }}
            >
              <TileIcon o={o} size="lg" />
              <div className="grow">
                <h3 className="text-[28px] font-semibold leading-tight">{o.title}</h3>
                <p className="mt-2 max-w-[40ch] text-muted">{o.text}</p>
              </div>
              <QuoteButton o={o} className="self-start" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Entegrasyonlar: hepsi tek bir merkeze, senin sistemine bağlanır. */
function IntegrationsSection() {
  return (
    <section id="entegrasyonlar" aria-labelledby="entegrasyonlar-baslik" className="container-mv scroll-mt-8 py-16">
      <h2 id="entegrasyonlar-baslik" className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.1]">
        Entegrasyonlar
      </h2>
      <p className="mt-3 max-w-[48ch] text-muted">Satış, banka ve kasa tek bir yerde buluşsun; elle aktarma bitsin.</p>
      <div className="mt-10">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-raised px-5 py-2.5 text-[15px] font-semibold">
            <Icon name="sync" color="var(--mv-tile-water)" />
            Senin sistemin
          </span>
        </div>
        {/* Bağlantı çizgileri: merkezden her entegrasyona */}
        <div aria-hidden="true" className="relative hidden h-12 md:block">
          <span className="absolute left-1/2 top-0 h-6 border-l border-dashed border-line-strong" />
          <span className="absolute left-[16.66%] right-[16.66%] top-6 border-t border-dashed border-line-strong" />
          <span className="absolute left-[16.66%] top-6 h-6 border-l border-dashed border-line-strong" />
          <span className="absolute left-1/2 top-6 h-6 border-l border-dashed border-line-strong" />
          <span className="absolute right-[16.66%] top-6 h-6 border-l border-dashed border-line-strong" />
        </div>
        <ul className="mt-6 grid gap-4 md:mt-0 md:grid-cols-3">
          {INTEGRATIONS.map((o) => (
            <li key={o.slug} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-7">
              <TileIcon o={o} />
              <div className="grow">
                <h3 className="text-xl font-semibold">{o.title}</h3>
                <p className="mt-1.5 text-muted">{o.text}</p>
              </div>
              <QuoteButton o={o} className="self-start" />
            </li>
          ))}
        </ul>
      </div>
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

      <SoftwareSection />
      <IntegrationsSection />
      <OfferingGroup id="logo" title="Logo hizmetleri" intro="Logo tarafında entegrasyon, uyarlama ve kural yazımı." items={LOGO_SERVICES} />

      <section id="nasil" aria-labelledby="nasil-baslik" className="mt-8 scroll-mt-8 border-y border-line bg-section px-6 py-28">
        <div className="mx-auto max-w-[var(--mv-max-width)]">
          <h2 id="nasil-baslik" className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.1]">
            Her proje ayın dört evresinden geçer
          </h2>
          <p className="mt-3 max-w-[48ch] text-muted">Yeni aydan dolunaya: ilk mesajından sonra işin hangi evrede olduğunu hep bilirsin.</p>
          <ol className="relative mt-16 grid gap-12 md:grid-cols-4 md:gap-8">
            {/* Ayların yörüngesi: evreleri birbirine bağlar */}
            <span aria-hidden="true" className="absolute left-9 top-9 hidden h-px w-[75%] border-t border-dashed border-line-strong md:block" />
            {PROJECT_PHASES.map((p, i) => (
              <li key={p.phase} className="relative flex gap-5 md:flex-col md:gap-0">
                <span className="relative shrink-0 drop-shadow-[0_0_22px_color-mix(in_srgb,var(--mv-logo-moon)_35%,transparent)]">
                  <MoonPhase phase={p.phase} />
                </span>
                <div className="md:mt-6">
                  <p className="text-sm text-subtle">
                    {i + 1}. evre · {p.moon}
                  </p>
                  <h3 className="mt-1 font-sans text-xl font-semibold">{p.step}</h3>
                  <p className="mt-2 max-w-[32ch] text-muted">{p.text}</p>
                </div>
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
          <h2 className="text-[clamp(32px,4vw,52px)] font-semibold">Merhaba, ben Ozanay.</h2>
          <p className="mt-5 max-w-[60ch] text-[19px] text-muted">
            Logo ERP uyarlama ve entegrasyon projelerinde takım lideriyim. Her gün C#/.NET ve SQL Server ile çalışıyor, işletmelerin
            sistemlerini birbirine bağlıyorum.
          </p>
          <p className="mt-4 max-w-[60ch] text-[19px] text-muted">
            Moonvalesoft&apos;u, sağlam yazılım yalnız büyük şirketlerin işi olmasın diye kurdum.
          </p>
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
