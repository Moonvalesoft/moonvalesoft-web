'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { api, ApiError, formatTL } from '@/lib/api';
import { commonError } from '@/lib/messages';
import type { Plan } from '@/lib/server-api';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

export function slugify(name: string): string {
  return name
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (c) => TR[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
    .replace(/-$/, '');
}

const slugError = 'Adres 3–30 karakter olmalı; sadece küçük harf, rakam ve tire kullan. Başında ve sonunda tire olmasın.';
const STORE = 'mv_satin_al';

export function PurchaseForm({
  plan,
  buyer,
  preInfoVersion,
  distanceSalesVersion,
}: {
  plan: Plan;
  buyer: { name: string; email: string };
  preInfoVersion: string | null;
  distanceSalesVersion: string | null;
}) {
  const randevu = plan.product === 'randevu';
  const [seats, setSeats] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [pageError, setPageError] = useState<string | null>(null);

  // 401 sonrası geri dönünce girilenler geri gelsin.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null');
      if (saved?.planId === plan.id) {
        setSeats(saved.seats ?? 1);
        setCompanyName(saved.companyName ?? '');
        setSlug(saved.slug ?? '');
        setSlugTouched(!!saved.slugTouched);
      }
    } catch {
      /* yok */
    }
  }, [plan.id]);

  const unit = plan.priceKurus ?? 0;
  const total = unit * (plan.perSeat ? seats : 1);
  const shownSlug = slug || 'salonun-adi';

  function onName(v: string) {
    setCompanyName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPageError(null);
    const errs: Record<string, string | null> = {};
    if (randevu) {
      if (companyName.trim().length < 2) errs.companyName = 'Salonunun adını yaz.';
      if (!SLUG_RE.test(slug) || slug.includes('--')) errs.slug = slugError;
    }
    if (!accepted) errs.accepted = 'Devam etmek için ön bilgilendirme formunu ve sözleşmeyi onaylaman gerekiyor.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!preInfoVersion || !distanceSalesVersion) return setPageError('Sözleşme bilgisi yüklenemedi. Sayfayı yenileyip tekrar dene.');
    setBusy(true);
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ planId: plan.id, seats, companyName, slug, slugTouched }));
    } catch {
      /* yok */
    }
    try {
      const r = await api<{ orderId: string; checkoutUrl: string; amountKurus: number }>('/api/checkout', {
        body: {
          planId: plan.id,
          seats,
          ...(randevu ? { companyName: companyName.trim(), companySlug: slug } : {}),
          preInfoVersion,
          distanceSalesVersion,
        },
      });
      if (r.amountKurus !== total) {
        setPageError(`Tutar değişti, lütfen kontrol et. Ödeyeceğin tutar: ${formatTL(r.amountKurus)}.`);
        setBusy(false);
        return;
      }
      sessionStorage.removeItem(STORE);
      window.location.assign(r.checkoutUrl);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError) {
        if (err.code === 'SLUG_TAKEN') {
          setErrors({ slug: `Bu adres alınmış. Sonuna semtini ekleyerek dene, ör. ${slug}-kadikoy` });
          setTimeout(() => document.getElementById('slug')?.focus());
          return;
        }
        if (err.code === 'INVALID_SLUG') return setErrors({ slug: slugError });
        if (err.code === 'LEGAL_ACCEPTANCE_REQUIRED') return setPageError('Sözleşme metni güncellendi. Sayfayı yenileyip yeni metni onayla.');
        if (err.code === 'PLAN_NOT_PURCHASABLE') return setPageError('Bu paket henüz satışta değil.');
      }
      const m = commonError(err);
      if (m) setPageError(m);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-6">
        {pageError && <Notice tone="error">{pageError}</Notice>}
        {plan.perSeat && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Kaç kişi kullanacak?</legend>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" aria-label="Bir kişi azalt" disabled={seats <= 1} onClick={() => setSeats((s) => s - 1)} className="h-14 w-14 px-0">
                −
              </Button>
              <input
                aria-label="Kişi sayısı"
                inputMode="numeric"
                value={seats}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, ''));
                  setSeats(Math.min(100, Math.max(1, n || 1)));
                }}
                className="h-14 w-24 rounded-sm border border-line-strong bg-bg text-center text-lg tabular-nums"
              />
              <Button type="button" variant="outline" aria-label="Bir kişi ekle" disabled={seats >= 100} onClick={() => setSeats((s) => s + 1)} className="h-14 w-14 px-0">
                +
              </Button>
            </div>
            <p className="text-sm text-subtle">Sen dahil, sisteme kendi telefonuyla girecek herkesi say. Her kişi kendi hesabıyla girer.</p>
          </fieldset>
        )}
        {randevu && (
          <>
            <Field label="Salonunun adı" autoComplete="organization" value={companyName} onChange={(e) => onName(e.target.value)} error={errors.companyName} required />
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="grow">
                  <Field
                    id="slug"
                    label="Salonunun adresi"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase());
                    }}
                    onBlur={() => setErrors((x) => ({ ...x, slug: slug && (!SLUG_RE.test(slug) || slug.includes('--')) ? slugError : null }))}
                    error={errors.slug}
                    required
                  />
                </div>
                <span className="pb-3 text-muted sm:pb-3.5">.moonvalesoft.com</span>
              </div>
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-sm text-subtle">Müşterilerin seni burada bulacak</p>
                <p className="break-all font-semibold">
                  https://<span className="text-accent-text">{shownSlug}</span>.moonvalesoft.com
                </p>
              </div>
            </div>
          </>
        )}

        <section aria-labelledby="onbilgi" className="rounded-lg border border-line bg-surface p-6">
          <h2 id="onbilgi" className="font-sans text-lg font-semibold">
            Ön bilgilendirme
          </h2>
          <p className="mt-1 text-sm text-subtle">Ödemeye geçmeden önce siparişinin özetini oku. Tam metin bağlantılarda.</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-subtle">Satıcı</dt>
            <dd>Moonvalesoft · [UNVAN, ADRES, VERGİ NO, MERSİS: teyit edilecek]</dd>
            <dt className="text-subtle">Alıcı</dt>
            <dd>
              {buyer.name} · {buyer.email}
            </dd>
            <dt className="text-subtle">Hizmet</dt>
            <dd>
              {plan.name}
              {plan.perSeat ? `, ${seats} kişi` : ''}
              {plan.interval === 'month' ? ', aylık abonelik' : ''}
            </dd>
            <dt className="text-subtle">Toplam</dt>
            <dd className="font-semibold">{formatTL(total)} [KDV NOTU: teyit edilecek]</dd>
            <dt className="text-subtle">İptal</dt>
            <dd>İstediğin zaman panelinden iptal edersin; dönem sonuna kadar kullanırsın. Cayma hakkı ve iade koşulları: teyit edilecek.</dd>
          </dl>
        </section>
      </div>

      <aside className="h-fit rounded-lg border border-accent bg-surface-raised p-6 lg:sticky lg:top-6">
        <p className="font-semibold">{plan.name}</p>
        <p className="text-sm text-muted">
          {plan.interval === 'month' ? 'Aylık' : 'Tek sefer'}
          {plan.perSeat ? ' · kişi başına' : ''} ·{' '}
          <Link href="/#fiyatlar" className="inline-flex min-h-11 items-center">
            Değiştir
          </Link>
        </p>
        <dl className="mt-4 flex flex-col gap-2 border-y border-line py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{plan.perSeat ? 'Kişi başı' : 'Fiyat'}</dt>
            <dd>{formatTL(unit)} / ay</dd>
          </div>
          {plan.perSeat && (
            <div className="flex justify-between">
              <dt className="text-muted">Kişi sayısı</dt>
              <dd>× {seats}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Vergiler</dt>
            <dd>[KDV NOTU]</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-semibold">Bugün ödeyeceğin</span>
          <span className="font-heading text-3xl font-semibold tabular-nums">{formatTL(total)}</span>
        </div>
        {plan.interval === 'month' && (
          <p className="mt-3 text-sm text-muted">
            Her ay aynı gün aynı tutar çekilir. İstediğin zaman panelinden iptal edersin; dönem sonuna kadar kullanmaya devam edersin.
          </p>
        )}
        <div className="mt-5">
          <Checkbox checked={accepted} onChange={setAccepted} error={errors.accepted} required>
            <Link href="/on-bilgilendirme" target="_blank">
              Ön Bilgilendirme Formu
            </Link>
            &apos;nu ve{' '}
            <Link href="/mesafeli-satis" target="_blank">
              Mesafeli Satış Sözleşmesi
            </Link>
            &apos;ni okudum, onaylıyorum.
          </Checkbox>
        </div>
        <Button type="submit" disabled={busy} className="mt-5 min-h-14 w-full">
          {busy ? 'Ödeme sayfası hazırlanıyor…' : 'Ödemeye geç'}
        </Button>
        <p className="mt-4 flex gap-2 text-sm text-subtle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="mt-1 shrink-0">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Kart bilgini ödeme şirketinin güvenli formuna gireceksin. Kart bilgin bana gelmez, saklanmaz.
        </p>
      </aside>
    </form>
  );
}
