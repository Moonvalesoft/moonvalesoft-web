'use client';

import { useEffect, useState } from 'react';

export type Theme = 'gece' | 'gunduz';
const KEY = 'mv-tema';

/** <head> içinde ilk boyamadan önce çalışır: sayfa yanlış modda yanıp sönmez. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t!=='gece'&&t!=='gunduz'){t=matchMedia('(prefers-color-scheme: light)').matches?'gunduz':'gece'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='gece'}})();`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) ?? 'gece');
  }, []);
  const next: Theme = theme === 'gunduz' ? 'gece' : 'gunduz';
  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* gizli sekme: sadece bu sayfada geçerli */
    }
    setTheme(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={next === 'gunduz' ? 'Aydınlık moda geç' : 'Gece moduna geç'}
      className="flex h-11 w-11 items-center justify-center rounded-sm border border-line-strong text-accent-text hover:bg-surface"
    >
      {theme === 'gunduz' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}
