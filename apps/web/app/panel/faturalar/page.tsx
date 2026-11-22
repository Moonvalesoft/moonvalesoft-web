'use client';

import Link from 'next/link';
import { LoadError, Skeleton } from '@/components/load-error';
import { ButtonLink } from '@/components/ui/button';
import { formatDate, formatTL } from '@/lib/api';
import { useLoad } from '@/lib/use-load';
import type { Invoice } from '@/lib/types';

export default function Page() {
  const { data, error, loading, reload } = useLoad<Invoice[]>('/api/invoices');
  return (
    <section aria-labelledby="baslik">
      <h1 id="baslik" className="text-3xl font-semibold">
        Faturalarım
      </h1>
      <p className="mb-6 mt-2 text-muted">Her ödemenden sonra belgen buraya düşer.</p>
      {loading && !data ? (
        <Skeleton className="h-40" />
      ) : error ? (
        <LoadError message={error} retry={reload} />
      ) : !data?.length ? (
        <div className="rounded-lg border border-line bg-surface p-8">
          <p className="text-lg">Henüz bir belgen yok.</p>
          <p className="mt-1 text-muted">İlk ödemenden sonra burada görünecek.</p>
          <ButtonLink href="/#fiyatlar" className="mt-5">
            Paketlere bak
          </ButtonLink>
        </div>
      ) : (
        <ul aria-label="Ödeme belgelerin, yeniden eskiye" className="flex flex-col gap-3">
          {data.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4">
              <div>
                <p className="font-semibold tabular-nums">{i.number}</p>
                <p className="text-sm text-muted">{formatDate(i.issuedAt)}</p>
              </div>
              <div className="flex items-center gap-5">
                <span className="font-semibold tabular-nums">{formatTL(i.amountKurus)}</span>
                <Link href={`/panel/faturalar/${i.id}`} aria-label={`${i.number} belgesini aç`} className="inline-flex min-h-11 items-center">
                  Aç
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-subtle">[FATURA NOTU: e-Arşiv kararı gelince yazılacak; şimdilik ödeme belgesi.]</p>
    </section>
  );
}
