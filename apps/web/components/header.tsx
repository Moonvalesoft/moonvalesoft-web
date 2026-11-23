import { telegramLink } from '@/lib/site';
import { TelegramIcon } from './icon';
import { Logo } from './logo';
import { ThemeToggle } from './theme';
import { buttonClass } from './ui/button';

export function Header() {
  return (
    <header className="container-mv relative z-20 flex h-24 items-center justify-between gap-4">
      <Logo />
      <nav aria-label="Ana menü" className="hidden gap-x-7 text-[15px] md:flex [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">
        <a href="#urunler" className="text-muted no-underline hover:text-fg">Ürünler</a>
        <a href="#logo" className="text-muted no-underline hover:text-fg">Logo hizmetleri</a>
        <a href="#nasil" className="text-muted no-underline hover:text-fg">Nasıl çalışır</a>
        <a href="#ben" className="text-muted no-underline hover:text-fg">Hakkımda</a>
      </nav>
      <div className="flex shrink-0 items-center gap-2 text-[15px] sm:gap-3">
        <ThemeToggle />
        <a href={telegramLink()} className={buttonClass("primary", "gap-2 px-3 sm:px-5")}>
          <TelegramIcon />
          <span className="sr-only sm:not-sr-only">Bana yaz</span>
        </a>
      </div>
    </header>
  );
}
