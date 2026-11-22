'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const ITEMS = [
  { href: '/panel', label: 'Paketlerim' },
  { href: '/panel/faturalar', label: 'Faturalarım' },
  { href: '/panel/destek', label: 'Destek' },
  { href: '/panel/izinler', label: 'İzinlerim' },
];

export function PanelNav() {
  const path = usePathname();
  return (
    <nav aria-label="Panel" className="flex gap-2 overflow-x-auto md:flex-col">
      {ITEMS.map((i) => {
        const active = i.href === '/panel' ? path === '/panel' : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-md border px-4 no-underline ${
              active ? 'border-accent bg-surface-raised font-semibold text-fg' : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await api('/api/auth/logout', { body: {} }).catch(() => undefined);
        window.location.assign('/');
      }}
    >
      Çıkış yap
    </Button>
  );
}
