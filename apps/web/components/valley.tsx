import { useId } from 'react';

/**
 * Moonvale: vadiden doğan ay. Logo, Telegram resmi ve ana görsel aynı çizimden çıkar.
 * Renkler tokens.json'daki sky / valeFar / valeMid / valeNear / moon / star değişkenlerinden.
 */

const fill = (v: string) => ({ fill: `var(--mv-${v})` });

/** Ana sayfanın büyük vadisi. Geniş ekranda ay sağdaki vadide; dar ekranda sağ taraf korunur. */
export function ValleyScene({ className = '' }: { className?: string }) {
  const glow = useId();
  return (
    <svg
      viewBox="0 0 1440 520"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--mv-moon)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--mv-moon)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g style={fill('star')} opacity="0.7">
        <circle cx="140" cy="70" r="1.6" />
        <circle cx="420" cy="40" r="1.2" />
        <circle cx="660" cy="120" r="1.4" />
        <circle cx="1290" cy="60" r="1.6" />
        <circle cx="1380" cy="170" r="1.1" />
        <circle cx="860" cy="50" r="1.1" />
      </g>
      <g className="mv-moonrise">
        <circle cx="1020" cy="300" r="230" fill={`url(#${glow})`} />
        <circle cx="1020" cy="300" r="118" style={fill('moon')} />
        <circle cx="985" cy="262" r="20" style={fill('moon')} className="brightness-90" opacity="0.9" />
        <circle cx="1058" cy="330" r="13" style={fill('moon')} className="brightness-90" opacity="0.9" />
      </g>
      <path
        style={fill('vale-far')}
        d="M0 340 C180 320 420 300 600 270 C700 252 780 258 850 300 C930 350 980 410 1020 420 C1070 405 1120 330 1180 260 C1220 215 1270 200 1320 215 C1380 232 1420 250 1440 258 V520 H0Z"
      />
      <path
        style={fill('vale-mid')}
        d="M0 400 C220 380 480 360 680 350 C800 345 900 380 960 430 C990 455 1010 470 1020 472 C1040 468 1080 430 1130 380 C1190 320 1260 300 1340 310 C1390 316 1420 325 1440 330 V520 H0Z"
      />
      <path style={fill('vale-near')} d="M0 460 C260 445 560 440 780 460 C880 470 960 495 1020 512 C1080 495 1180 450 1300 430 C1370 420 1410 422 1440 424 V520 H0Z" />
    </svg>
  );
}

/** Küçük işaret (menüdeki logo): yuvarlak içinde vadi ve ay. */
export function Mark({ size = 32 }: { size?: number }) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="64" height="64" style={fill('sky')} />
        <circle cx="32" cy="30" r="15" style={fill('moon')} />
        <path style={fill('vale-far')} d="M0 40 C10 36 20 34 26 40 C29 43 31 46 32 47 C34 44 38 36 44 30 C50 25 58 27 64 31 V64 H0Z" />
        <path style={fill('vale-mid')} d="M0 50 C12 47 22 48 28 52 C30 53 31 54 32 54 C36 51 44 45 52 44 C58 43 62 44 64 45 V64 H0Z" />
      </g>
    </svg>
  );
}
