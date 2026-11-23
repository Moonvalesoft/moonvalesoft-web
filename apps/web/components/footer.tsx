import { telegramLink } from '@/lib/site';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-mv flex flex-wrap items-center justify-between gap-4 py-10 text-sm text-subtle">
        <span>© {new Date().getFullYear()} Moonvalesoft · İstanbul</span>
        <a href={telegramLink()} className="inline-flex min-h-11 items-center">
          Telegram
        </a>
      </div>
    </footer>
  );
}
