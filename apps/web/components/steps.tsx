const STEPS = ['Paket', 'Hesap', 'Bilgiler ve ödeme', 'Hazır'];

/** Satın alma adım göstergesi (docs/ekranlar.md). `current` 1'den başlar. */
export function Steps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mb-8">
      <ol aria-label="Satın alma adımları" className="hidden flex-wrap gap-6 text-sm sm:flex">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = n < current;
          const now = n === current;
          return (
            <li key={s} aria-current={now ? 'step' : undefined} className={`flex items-center gap-2 ${now ? 'font-semibold text-fg' : 'text-subtle'}`}>
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${done || now ? 'border-accent text-accent-text' : 'border-line-strong'}`}
              >
                {done ? '✓' : n}
              </span>
              {s}
              {done && <span className="sr-only">(tamamlandı)</span>}
            </li>
          );
        })}
      </ol>
      <div className="sm:hidden">
        <p className="text-sm text-muted">
          Adım {current} / 4 · {STEPS[current - 1]}
        </p>
        <div aria-hidden="true" className="mt-2 grid grid-cols-4 gap-1">
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 rounded-full ${i < current ? 'bg-accent' : 'bg-line'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
