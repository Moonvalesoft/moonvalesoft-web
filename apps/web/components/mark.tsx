import { useId } from 'react';

/**
 * Moonvalesoft logosu, "Hilal Vadi": hilal, içindeki vadiyi kucaklar; vadide iki dağ ve aralarından akan nehir.
 * Renkler tokens.json'daki logoMoon / logoHillFront / logoHillBack / logoWater (Gece ve Gündüz).
 * Aynı çizim: design/brand/logo.svg, favicon (app/icon.svg), Telegram profil resmi.
 */
export function Mark({ size = 36, title }: { size?: number; title?: string }) {
  const id = useId().replace(/:/g, '');
  const v = (n: string) => ({ fill: `var(--mv-logo-${n})` });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      <defs>
        <mask id={`${id}m`}>
          <rect width="120" height="120" fill="#fff" />
          <circle cx="74" cy="50" r="40" fill="#000" />
        </mask>
        <clipPath id={`${id}in`}>
          <circle cx="74" cy="50" r="40" />
        </clipPath>
        <clipPath id={`${id}out`}>
          <circle cx="60" cy="60" r="50" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="50" style={v('moon')} mask={`url(#${id}m)`} />
      <g clipPath={`url(#${id}out)`}>
        <g clipPath={`url(#${id}in)`}>
          <path d="M50 92 L82 46 Q85 42 88 46 L118 92 Z" style={v('hill-back')} />
          <path d="M30 92 L58 56 Q61 52 64 56 L92 92 Z" style={v('hill-front')} />
          <path d="M72.5 70 C68 77 79 81 73 87 C70 90 66 91 62 92 H86 C82 90 84 86 81 82 C77 77 75 74 75.5 70 Z" style={v('water')} />
        </g>
      </g>
    </svg>
  );
}
