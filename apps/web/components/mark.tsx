import { useId } from 'react';

/**
 * Moonvalesoft logosu, "Ay Vadisi": hilal, öndeki ve arkadaki dağ, aradaki vadiden çıkan nehir.
 * Renkler tokens.json'daki logoMoon / logoHillFront / logoHillBack / logoWater değişkenlerinden (Gece ve Gündüz).
 * Aynı çizim: design/brand/logo.svg, favicon (app/icon.svg), Telegram profil resmi.
 */
export function Mark({ size = 36, title }: { size?: number; title?: string }) {
  const mask = useId();
  const v = (n: string) => ({ fill: `var(--mv-logo-${n})` });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      <mask id={mask}>
        <rect width="120" height="120" fill="#fff" />
        <circle cx="76" cy="22" r="22" fill="#000" />
      </mask>
      <circle cx="64" cy="32" r="25" style={v('moon')} mask={`url(#${mask})`} />
      <path d="M50 100 L84 50 Q88 45 92 50 L122 100 Z" style={v('hill-back')} />
      <path d="M-2 100 L32 56 Q36 51 40 56 L76 100 Z" style={v('hill-front')} />
      <rect x="0" y="98" width="120" height="16" style={v('hill-front')} />
      <path d="M64.5 86 C58 94 71 99.5 61.5 105 C55 109 51 111.5 48 114 H60 C61 112.5 62 110.5 66.5 107 C77 100.5 62 94 67.5 86 Z" style={v('water')} />
    </svg>
  );
}
