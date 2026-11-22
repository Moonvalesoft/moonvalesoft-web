'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LoadError, Skeleton } from '@/components/load-error';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { api, formatDate } from '@/lib/api';
import { commonError } from '@/lib/messages';
import { useLoad } from '@/lib/use-load';

interface Consents {
  marketingEmail: { granted: boolean; version: string | null; updatedAt: string | null };
}
interface Ack {
  kind: 'aydinlatma' | 'on_bilgilendirme' | 'mesafeli_satis';
  version: string;
  orderId: string | null;
  acceptedAt: string;
}

const DOCS: Record<Ack['kind'], { title: string; path: string }> = {
  aydinlatma: { title: 'KVKK Aydınlatma Metni', path: '/kvkk' },
  on_bilgilendirme: { title: 'Ön Bilgilendirme Formu', path: '/on-bilgilendirme' },
  mesafeli_satis: { title: 'Mesafeli Satış Sözleşmesi', path: '/mesafeli-satis' },
};

export default function Page() {
  const consents = useLoad<Consents>('/api/me/consents');
  const acks = useLoad<Ack[]>('/api/me/legal');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const granted = consents.data?.marketingEmail.granted ?? false;

  async function toggle() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<Consents>('/api/me/consents', { method: 'PUT', body: { marketingEmail: !granted } });
      consents.setData(r);
      setMsg({
        tone: 'success',
        text: r.marketingEmail.granted ? 'İzin verdin. Yeniliklerden e-postayla haberdar edeceğim.' : 'İzni geri aldın. Artık sana kampanya e-postası göndermeyeceğim.',
      });
    } catch (e) {
      const m = commonError(e);
      if (m) setMsg({ tone: 'error', text: m });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="baslik" className="flex flex-col gap-10">
      <div>
        <h1 id="baslik" className="text-3xl font-semibold">
          İzinlerim
        </h1>
        <p className="mt-2 text-muted">Hangi izni verdiğini ve hangi metinleri onayladığını burada görürsün.</p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-sans text-xl font-semibold">Kampanya e-postaları</h2>
        <p className="mt-2 text-muted">
          Yeni özellik ve kampanya duyuruları. Fatura, şifre ve kurulum e-postaları bu izinden bağımsızdır; onlar her zaman gelir.{' '}
          <Link href="/kampanya-izni">İzin metni</Link>
        </p>
        {consents.loading && !consents.data ? (
          <Skeleton className="mt-4 h-12" />
        ) : consents.error ? (
          <div className="mt-4">
            <LoadError message={consents.error} retry={consents.reload} />
          </div>
        ) : (
          <>
            <p className="mt-4" role="status">
              Durum: <strong>{granted ? 'İzin verdin' : 'İzin vermedin'}</strong>
              {consents.data?.marketingEmail.updatedAt && (
                <span className="text-subtle"> · {formatDate(consents.data.marketingEmail.updatedAt)}</span>
              )}
            </p>
            {msg && (
              <div className="mt-4">
                <Notice tone={msg.tone}>{msg.text}</Notice>
              </div>
            )}
            <Button variant={granted ? 'outline' : 'primary'} onClick={toggle} disabled={busy} className="mt-4">
              {busy ? 'Kaydediliyor…' : granted ? 'İzni geri al' : 'İzin ver'}
            </Button>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-sans text-xl font-semibold">Onayladığın metinler</h2>
        {acks.loading && !acks.data ? (
          <Skeleton className="h-24" />
        ) : acks.error ? (
          <LoadError message={acks.error} retry={acks.reload} />
        ) : !acks.data?.length ? (
          <p className="text-muted">Kayıt yok.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {acks.data.map((a, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-5 py-3">
                <span>
                  <Link href={`${DOCS[a.kind].path}?surum=${encodeURIComponent(a.version)}`}>{DOCS[a.kind].title}</Link>
                  <span className="text-sm text-subtle"> · sürüm {a.version}</span>
                </span>
                <span className="text-sm text-muted">{formatDate(a.acceptedAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-subtle">
          Verilerinle ilgili bir talebin varsa (görme, düzeltme, silme) <Link href="/panel/destek?konu=KVKK%20ba%C5%9Fvurusu">destekten yaz</Link>.
          Başvuru yolu aydınlatma metninde de yazacak (teyit edilecek).
        </p>
      </div>
    </section>
  );
}
