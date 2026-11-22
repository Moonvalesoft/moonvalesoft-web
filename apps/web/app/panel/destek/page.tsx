'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { LoadError, Skeleton } from '@/components/load-error';
import { Button } from '@/components/ui/button';
import { Field, TextArea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { api, ApiError, formatDate } from '@/lib/api';
import { commonError } from '@/lib/messages';
import { useLoad } from '@/lib/use-load';
import type { Ticket } from '@/lib/types';

export default function Page() {
  const { data, setData, error, loading, reload } = useLoad<Ticket[]>('/api/tickets');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // /teklif ve "Teklif iste" bağlantıları konuyu hazır getirir.
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get('konu');
    if (k) setSubject(k.slice(0, 120));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSent(false);
    setFormError(null);
    const errs: Record<string, string | null> = {};
    const s = subject.trim();
    const m = message.trim();
    if (s.length < 3 || s.length > 120) errs.subject = 'Konu 3 ile 120 karakter arasında olmalı.';
    if (m.length < 10) errs.message = 'Mesajın en az 10 karakter olmalı.';
    else if (m.length > 5000) errs.message = 'Mesajın 5000 karakteri geçmesin.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const t = await api<Ticket>('/api/tickets', { body: { subject: s, message: m } });
      setData((list) => [t, ...(list ?? [])]);
      setSubject('');
      setMessage('');
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION') setFormError('Konu 3–120, mesaj 10–5000 karakter olmalı. Kontrol edip tekrar gönder.');
      else setFormError(commonError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="baslik">
      <h1 id="baslik" className="text-3xl font-semibold">
        Destek
      </h1>
      <p className="mb-6 mt-2 text-muted">Yazdığın her talebi ben okurum; karşında sistemi yazan kişi var. [YANIT SÜRESİ: Ozan söyleyecek]</p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6">
        {sent && <Notice tone="success">Talebini aldım. Yanıtım buraya gelecek.</Notice>}
        {formError && <Notice tone="error">{formError}</Notice>}
        <Field label="Konu" placeholder="ör. Çalışan ekleyemiyorum" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} maxLength={120} />
        <div>
          <TextArea label="Ne oldu?" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} maxLength={5000} />
          <p className="mt-1 flex justify-between gap-4 text-sm text-subtle">
            <span>Ne yapmaya çalıştın, ne oldu? Ekran görüntüsü gerekirse yanıtımda isterim.</span>
            <span aria-live={message.length > 4900 ? 'polite' : 'off'} className="shrink-0 tabular-nums">
              {message.length} / 5000
            </span>
          </p>
        </div>
        <p className="text-sm text-subtle">
          Yazdıklarını yalnız talebini çözmek için kullanırım. <Link href="/kvkk">Aydınlatma metni</Link>
        </p>
        <Button type="submit" disabled={busy} className="self-start max-sm:w-full">
          {busy ? 'Gönderiliyor…' : 'Gönder'}
        </Button>
      </form>

      <h2 className="mb-4 mt-10 font-sans text-xl font-semibold">Taleplerin</h2>
      {loading && !data ? (
        <Skeleton className="h-24" />
      ) : error ? (
        <LoadError message={error} retry={reload} />
      ) : !data?.length ? (
        <p className="text-muted">Henüz bir talebin yok. Bir sorun olursa yukarıdaki formdan yaz; ben bakarım.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((t) => (
            <li key={t.id}>
              <Link href={`/panel/destek/${t.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-5 py-3 text-fg no-underline hover:border-line-strong">
                <span className="font-semibold">{t.subject}</span>
                <span className="flex items-center gap-4 text-sm text-muted">
                  {formatDate(t.createdAt)}
                  <span className="rounded-full border border-line-strong px-3 py-0.5">{t.status === 'open' ? '● Açık' : '✓ Kapandı'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
