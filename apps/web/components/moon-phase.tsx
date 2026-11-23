import type { Phase } from '@/lib/site';

/** Ayın evresi: koyu disk + aydınlık kısım. Yeni ayda yalnız ince bir hale görünür. */
export function MoonPhase({ phase, size = 72 }: { phase: Phase; size?: number }) {
  const lit = { fill: 'var(--mv-logo-moon)' };
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true" focusable="false">
      <circle cx="36" cy="36" r="30" style={{ fill: 'var(--mv-surface-raised)', stroke: 'var(--mv-logo-moon)' }} strokeOpacity="0.55" strokeWidth="1.5" />
      {phase === 'ilk' && <path d="M36 6 A30 30 0 0 1 36 66 Z" style={lit} />}
      {phase === 'dolunay' && <circle cx="36" cy="36" r="30" style={lit} />}
      {phase === 'son' && <path d="M36 6 A30 30 0 0 0 36 66 Z" style={lit} />}
    </svg>
  );
}
