import { Icon, TelegramIcon } from '@/components/icon';
import { Portrait } from '@/components/portrait';
import { ValleyScene } from '@/components/valley';
import { buttonClass } from '@/components/ui/button';
import { LOGO_SERVICES, PRODUCTS, quoteText, telegramLink, type Offering } from '@/lib/site';

const PHASES = [
  { title: 'Bana yaz', text: "Telegram'dan ihtiyacını anlat.", fill: 'none' },
  { title: 'Konuşalım', text: 'Kapsamı birlikte netleştirelim.', fill: 'quarter' },
  { title: 'Teklifini al', text: 'Sana özel teklifi hazırlarım.', fill: 'half' },
  { title: 'Kurulumu ben yaparım', text: 'Kurar, teslim eder, yanında olurum.', fill: 'full' },
] as const;

function OfferingRow({ o, tone }: { o: Offering; tone: 'accent' | 'secondary' }) {
  return (
    <li className="grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-3 border-t border-line py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span className="mt-1 sm:mt-0">
        <Icon name={o.icon} tone={tone} />
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

function OfferingGroup({ id, title, intro, items, tone }: { id: string; title: string; intro: string; items: Offering[]; tone: 'accent' | 'secondary' }) {
  return (
    <section id={id} aria-labelledby={`${id}-baslik`} className="container-mv grid scroll-mt-8 gap-8 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
      <div className="md:sticky md:top-8 md:self-start">
        <h2 id={`${id}-baslik`} className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.1]">
          {title}
        </h2>
        <p className="mt-3 max-w-[40ch] text-muted">{intro}</p>
      </div>
      <ul className="border-b border-line">
        {items.map((o) => (
          <OfferingRow key={o.slug} o={o} tone={tone} />
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[linear-gradient(to_bottom,var(--mv-background),var(--mv-sky)_70%)]">
        <ValleyScene className="absolute inset-x-0 bottom-0 -z-10 h-[300px] w-full sm:h-[440px] lg:h-[520px]" />
        <div className="container-mv pb-[260px] pt-16 sm:pb-[360px] md:pt-24 lg:pb-[300px]">
          <div className="max-w-[640px]">
            <h1 className="text-[clamp(42px,5.6vw,76px)] font-semibold leading-[1.04] tracking-[-0.03em]">
              Sen uyurken işini yürüten sistemler kuruyorum.
            </h1>
            <p className="mt-7 max-w-[34em] text-[19px] text-muted">
              Randevular kendiliğinden dolsun, müşteriler unutulmasın, siparişler Logo&apos;ya kendiliğinden düşsün. Ne istediğini yaz,
              birlikte netleştirelim; kurulumu ben yaparım.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#urunler" className={buttonClass('primary', 'px-7 py-4')}>
                Ürünlere bak
              </a>
              <a href={telegramLink()} className={buttonClass('outline', 'gap-2 bg-bg/40 px-7 py-4 backdrop-blur-sm')}>
                <TelegramIcon />
                Telegram&apos;dan yaz
              </a>
            </div>
          </div>
        </div>
      </section>

      <OfferingGroup id="urunler" title="Ürünler" intro="Her biri gerçek işletmelerin sorunlarından doğdu." items={PRODUCTS} tone="accent" />
      <OfferingGroup
        id="logo"
        title="Logo hizmetleri"
        intro="Logo tarafında entegrasyon, uyarlama ve kural yazımı."
        items={LOGO_SERVICES}
        tone="secondary"
      />

      <section id="nasil" className="mt-8 scroll-mt-8 border-y border-line bg-section px-6 py-28">
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
            <h2 className="text-[clamp(34px,4.5vw,64px)] font-semibold leading-[1.08] tracking-[-0.03em]">Bu gece yaz, yarın sabah konuşalım.</h2>
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
