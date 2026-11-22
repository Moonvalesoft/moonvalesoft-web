'use client';

import { useEffect, useRef, useState } from 'react';
import { LoadError, Skeleton } from '@/components/load-error';
import { Button, ButtonLink } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { api, ApiError, formatDate } from '@/lib/api';
import { commonError } from '@/lib/messages';
import { useLoad } from '@/lib/use-load';
import { PLAN_NAMES, salonUrl, type Subscription } from '@/lib/types';

function Badge({ s }: { s: Subscription }) {
  const [label, cls, icon] =
    s.status === 'canceled'
      ? ['İptal edildi', 'border-line-strong text-subtle', '–']
      : s.status === 'past_due'
        ? ['Ödeme alınamadı', 'border-danger text-danger', '!']
        : s.cancelAtPeriodEnd
          ? [`${formatDate(s.currentPeriodEnd)}'te bitecek`, 'border-accent text-accent-text', '◷']
          : ['Aktif', 'border-success text-success', '✓'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${cls}`}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

const PROVISIONING: Record<string, string> = { pending: 'Kuruluyor', done: '✓ Hazır', failed: 'Sorun çıktı, ilgileniyorum' };

function CancelDialog({ sub, onClose, onDone }: { sub: Subscription; onClose: () => void; onDone: (s: Subscription) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    ref.current?.showModal();
    keep.current?.focus();
  }, []);
  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      onDone(await api<Subscription>(`/api/subscriptions/${sub.id}/cancel`, { body: {} }));
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 404) setError('Bu aboneliği bulamadım. Sayfayı yenileyip tekrar bak.');
      else if (e instanceof ApiError && e.code === 'ALREADY_CANCELED') setError('Bu abonelik zaten iptal edilmiş.');
      else setError(commonError(e));
    }
  }
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="iptal-baslik"
      className="m-auto max-w-lg rounded-lg border border-line bg-surface p-6 text-fg backdrop:bg-black/60"
    >
      <h2 id="iptal-baslik" className="text-2xl font-semibold">
        Aboneliğini iptal etmek istiyor musun?
      </h2>
      <p className="mt-3 text-muted">
        {formatDate(sub.currentPeriodEnd)}&apos;e kadar her şey çalışmaya devam eder. Sonra yeni ödeme alınmaz ve salonun dondurulur; verilerin
        silinmez.
      </p>
      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button ref={keep} onClick={() => ref.current?.close()} disabled={busy}>
          Vazgeç
        </Button>
        <Button variant="danger" onClick={confirm} disabled={busy}>
          {busy ? 'İptal ediliyor…' : 'Evet, iptal et'}
        </Button>
      </div>
    </dialog>
  );
}

export default function Page() {
  const { data, setData, error, loading, reload } = useLoad<Subscription[]>('/api/subscriptions');
  const [cancel, setCancel] = useState<Subscription | null>(null);
  const [canceled, setCanceled] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  return (
    <section aria-labelledby="baslik">
      <h1 id="baslik" className="mb-6 text-3xl font-semibold">
        Paketlerim
      </h1>
      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : error ? (
        <LoadError message={error} retry={reload} />
      ) : !data?.length ? (
        <div className="rounded-lg border border-line bg-surface p-8">
          <p className="text-lg">Henüz bir paketin yok.</p>
          <ButtonLink href="/#fiyatlar" className="mt-5">
            Paketlere bak
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((s) => (
            <article key={s.id} className="rounded-lg border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-sans text-xl font-semibold">{PLAN_NAMES[s.planId] ?? s.planId}</h2>
                  <p className="text-sm text-muted">Aylık · {s.seats} kişi</p>
                </div>
                <Badge s={s} />
              </div>
              <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                {s.companySlug && (
                  <>
                    <dt className="text-subtle">Salon adresi</dt>
                    <dd className="break-all">{salonUrl(s.companySlug).replace('https://', '')}</dd>
                  </>
                )}
                {s.provisioning !== 'none' && (
                  <>
                    <dt className="text-subtle">Kurulum</dt>
                    <dd>{PROVISIONING[s.provisioning]}</dd>
                  </>
                )}
                {s.status !== 'canceled' && (
                  <>
                    <dt className="text-subtle">{s.cancelAtPeriodEnd ? 'Bitiş tarihi' : 'Yenilenme tarihi'}</dt>
                    <dd>{formatDate(s.currentPeriodEnd)}</dd>
                  </>
                )}
              </dl>
              {canceled === s.id && (
                <div className="mt-4">
                  <Notice>
                    İptal isteğini aldım. {formatDate(s.currentPeriodEnd)}&apos;e kadar her şey çalışır, sonra yeni ödeme alınmaz ve salonun
                    dondurulur. Verilerin silinmez.
                  </Notice>
                </div>
              )}
              {s.status === 'past_due' && (
                <div className="mt-4">
                  <Notice tone="error">Son ödemen alınamadı. [KART GÜNCELLEME YOLU: teyit edilecek]</Notice>
                </div>
              )}
              {s.status === 'canceled' && (
                <p className="mt-4 text-muted">Salonun donduruldu, verilerin duruyor. Yeniden başlamak istersen bana yaz.</p>
              )}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {s.provisioning === 'done' && s.companySlug && (
                  <a href={salonUrl(s.companySlug)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-on-accent no-underline">
                    Salonuna git
                  </a>
                )}
                {s.status === 'active' && !s.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      opener.current = e.currentTarget;
                      setCancel(s);
                    }}
                  >
                    İptal et
                  </Button>
                )}
                {s.status === 'canceled' && (
                  <ButtonLink href="/panel/destek" variant="outline">
                    Bana yaz
                  </ButtonLink>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {cancel && (
        <CancelDialog
          sub={cancel}
          onClose={() => {
            setCancel(null);
            opener.current?.focus();
          }}
          onDone={(updated) => {
            setData((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
            setCanceled(updated.id);
            setCancel(null);
          }}
        />
      )}
    </section>
  );
}
