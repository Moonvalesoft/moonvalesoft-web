import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { serverApi, type Me } from '@/lib/server-api';
import { LogoutButton, PanelNav } from './panel-nav';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const me = await serverApi<Me>('/api/me');
  if (!me) {
    redirect('/giris?sonra=/panel');
  }
  return (
    <div className="container-mv py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-subtle">Panelim</p>
          <p className="font-semibold">{me.email}</p>
        </div>
        <LogoutButton />
      </div>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <PanelNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
