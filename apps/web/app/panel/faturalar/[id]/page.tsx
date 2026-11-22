'use client';

import { use } from 'react';
import { LoadError, Skeleton } from '@/components/load-error';
import { ButtonLink } from '@/components/ui/button';
import { formatDate, formatTL } from '@/lib/api';
import { useLoad } from '@/lib/use-load';
import type { Invoice } from '@/lib/types';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, reload } = useLoad<Invoice>(`/api/invoices/${encodeURIComponent(id)}`);
  return (
    <section>
      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : error ? (
        <LoadError message={error.startsWith('Bunu bulamadım') ? 'Bu belgeyi bulamadım.' : error} retry={reload} />
      ) : data ? (
        <div className="rounded-lg border border-line bg-surface p-8">
          <p className="text-sm text-subtle">Ödeme belgesi</p>
          <h1 className="mt-1 text-3xl font-semibold tabular-nums">{data.number}</h1>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            <dt className="text-subtle">Tarih</dt>
            <dd>{formatDate(data.issuedAt)}</dd>
            <dt className="text-subtle">Tutar</dt>
            <dd className="font-semibold">{formatTL(data.amountKurus)}</dd>
          </dl>
          <p className="mt-6 text-sm text-subtle">Resmî fatura görünümü (e-Arşiv) teyit edilecek.</p>
        </div>
      ) : null}
      <ButtonLink href="/panel/faturalar" variant="outline" className="mt-6">
        Faturalarıma dön
      </ButtonLink>
    </section>
  );
}
