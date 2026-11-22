import Link from 'next/link';
import { serverApi, type Me } from '@/lib/server-api';
import { ThemeToggle } from './theme';
import { Logo } from './logo';
import { buttonClass } from './ui/button';

export async function Header() {
  const me = await serverApi<Me>('/api/me');
  return (
    <header className="container-mv flex flex-wrap items-center justify-between gap-4 py-6">
      <Logo />
      <nav aria-label="Ana menü" className="flex flex-wrap gap-x-7 gap-y-2 text-[15px]">
        <Link href="/#urunler" className="text-muted no-underline hover:text-fg">Ürünler</Link>
        <Link href="/#nasil" className="text-muted no-underline hover:text-fg">Nasıl çalışır</Link>
        <Link href="/#fiyatlar" className="text-muted no-underline hover:text-fg">Fiyatlar</Link>
        <Link href="/#ben" className="text-muted no-underline hover:text-fg">Hakkımda</Link>
      </nav>
      <div className="flex items-center gap-3 text-[15px]">
        <ThemeToggle />
        {me ? (
          <Link href="/panel" className={buttonClass('primary', 'px-5')}>Panelim</Link>
        ) : (
          <>
            <Link href="/giris" className={buttonClass('outline', 'px-5')}>Giriş yap</Link>
            <Link href="/kayit" className={buttonClass('primary', 'px-5')}>Hesap oluştur</Link>
          </>
        )}
      </div>
    </header>
  );
}
