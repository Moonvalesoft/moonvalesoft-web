import { telegramLink } from '@/lib/site';
import { TelegramIcon } from './icon';
import { Logo } from './logo';
import { ThemeToggle } from './theme';
import { buttonClass } from './ui/button';

export function Header() {
  return (
    <header className="container-mv flex flex-wrap items-center justify-between gap-4 py-6">
      <Logo />
      <nav aria-label="Ana menü" className="flex flex-wrap gap-x-7 gap-y-2 text-[15px] [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">
        <a href="#urunler" className="text-muted no-underline hover:text-fg">Ürünler</a>
        <a href="#logo" className="text-muted no-underline hover:text-fg">Logo hizmetleri</a>
        <a href="#nasil" className="text-muted no-underline hover:text-fg">Nasıl çalışır</a>
        <a href="#ben" className="text-muted no-underline hover:text-fg">Hakkımda</a>
      </nav>
      <div className="flex items-center gap-3 text-[15px]">
        <ThemeToggle />
        <a href={telegramLink()} className={buttonClass('primary', 'gap-2 px-5')}>
          <TelegramIcon />
          Bana yaz
        </a>
      </div>
    </header>
  );
}
