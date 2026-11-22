'use client';

import { use } from 'react';
import { LoadError, Skeleton } from '@/components/load-error';
import { ButtonLink } from '@/components/ui/button';
import { formatDate } from '@/lib/api';
import { useLoad } from '@/lib/use-load';
import type { Ticket } from '@/lib/types';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, reload } = useLoad<Ticket>(`/api/tickets/${encodeURIComponent(id)}`);
  return (
    <section>
      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : error ? (
        <LoadError message={error.startsWith('Bunu bulamadım') ? 'Bu talebi bulamadım.' : error} retry={reload} />
      ) : data ? (
        <>
          <h1 className="text-3xl font-semibold">{data.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(data.createdAt)} · {data.status === 'open' ? 'Açık' : 'Kapandı'}
          </p>
          <ol className="mt-6 flex flex-col gap-3">
            {data.messages?.map((m, i) => (
              <li key={i} className={`rounded-lg border p-5 ${m.author === 'staff' ? 'border-accent bg-surface-raised' : 'border-line bg-surface'}`}>
                <p className="text-sm font-semibold">
                  {m.author === 'staff' ? 'Ozan' : 'Sen'} <span className="font-normal text-subtle">· {formatDate(m.createdAt)}</span>
                </p>
                <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      <ButtonLink href="/panel/destek" variant="outline" className="mt-6">
        Destek sayfasına dön
      </ButtonLink>
    </section>
  );
}
