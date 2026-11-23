import { useId } from 'react';

/**
 * Açılış manzarası: gece vadisi (Gündüz modunda gün doğumu). Logonun büyük hali: hilal, katman katman dağlar,
 * vadiden çıkan ve ayı yansıtan nehir. Renkler tokens.json'daki sky* / mt* / river* / moonGlow / star.
 * En öndeki katman sayfa zeminiyle aynı renk: manzara bir sonraki bölüme kesintisiz kavuşur.
 */

const f = (v: string) => ({ fill: `var(--mv-${v})` });

const STARS: [number, number, number][] = [
  [80, 60, 1.6], [190, 140, 1.1], [300, 40, 1.4], [420, 110, 1], [520, 60, 1.8], [610, 170, 1.1], [700, 80, 1.3],
  [800, 30, 1], [880, 150, 1.5], [1010, 70, 1.2], [1260, 60, 1.7], [1350, 150, 1.1], [1400, 40, 1.3], [140, 250, 1],
  [360, 220, 1.2], [660, 260, 1], [1300, 250, 1.2], [960, 220, 0.9], [240, 330, 0.9], [560, 300, 1],
];

export function HeroScene({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 1440 760" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--mv-moon-glow)" stopOpacity="0.55" />
          <stop offset="0.4" stopColor="var(--mv-moon-glow)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--mv-moon-glow)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}horizon`} cx="0.68" cy="0.82" r="0.6">
          <stop offset="0" stopColor="var(--mv-sky-glow)" stopOpacity="0.75" />
          <stop offset="1" stopColor="var(--mv-sky-glow)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}river`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mv-river-light)" />
          <stop offset="0.35" stopColor="var(--mv-river)" />
          <stop offset="1" stopColor="var(--mv-river)" />
        </linearGradient>
        <mask id={`${id}crescent`}>
          <rect width="1440" height="760" fill="#fff" />
          <circle cx="1166" cy="212" r="76" fill="#000" />
        </mask>
      </defs>

      <rect width="1440" height="760" fill={`url(#${id}horizon)`} />

      <g style={f('star')}>
        {STARS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={0.5 + (i % 3) * 0.2} />
        ))}
      </g>

      {/* Ay: ışıltı + hilal */}
      <circle cx="1120" cy="250" r="210" fill={`url(#${id}glow)`} />
      <circle cx="1120" cy="250" r="84" style={f('logo-moon')} mask={`url(#${id}crescent)`} />

      {/* Dağlar: uzaktan yakına; her katman açılışta sırayla yerine oturur */}
      <g transform="translate(0 120)">
      <g className="mv-rise" style={{ animationDelay: '0ms' }}>
        <path
          style={f('mt-far')}
          d="M0 420 L120 362 L220 396 L340 300 Q350 292 360 300 L470 380 L560 342 L700 252 Q710 245 720 252 L820 350 L930 322 L1040 232 Q1050 225 1060 232 L1160 330 L1260 292 L1440 360 V640 H0Z"
        />
      </g>
      <g className="mv-rise" style={{ animationDelay: '120ms' }}>
        <path
          style={f('mt-mid')}
          d="M0 482 L180 412 L330 456 L520 372 Q530 365 540 372 L700 452 L812 366 Q822 358 832 366 L982 506 L1172 346 Q1182 338 1192 346 L1330 432 L1440 402 V640 H0Z"
        />
      </g>
      <g className="mv-rise" style={{ animationDelay: '240ms' }}>
        <path
          style={f('mt-near')}
          d="M0 562 C200 500 380 522 560 482 C700 456 840 520 950 566 L1018 566 C1120 520 1250 472 1440 502 V640 H0Z"
        />
        {/* Nehir: vadiden çıkar, kıvrılarak öne gelir ve ayı yansıtır */}
        <path
          fill={`url(#${id}river)`}
          d="M979 506 C968 532 1002 548 986 574 C966 604 928 620 890 640 H1110 C1066 618 1032 598 1038 572 C1044 546 992 530 987 506 Z"
        />
        <g style={{ stroke: 'var(--mv-river-light)' }} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8">
          <path d="M984 560 h16" />
          <path d="M968 592 h30" />
          <path d="M950 616 h44" />
          <path d="M1020 606 h26" />
        </g>
      </g>
      <path style={f('background')} d="M0 612 C300 582 620 592 900 622 L1100 622 C1240 604 1340 598 1440 602 V640 H0Z" />
      </g>
    </svg>
  );
}

/** Kapanış bölümü için küçük manzara şeridi. */
export function RidgeStrip({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false" className={className}>
      <path style={f('mt-far')} d="M0 70 L160 30 L300 60 L470 14 L640 64 L820 22 L1000 66 L1180 18 L1320 52 L1440 30 V120 H0Z" opacity="0.9" />
      <path style={f('mt-mid')} d="M0 96 L200 56 L380 88 L560 46 L760 92 L940 52 L1120 90 L1300 58 L1440 80 V120 H0Z" />
    </svg>
  );
}
