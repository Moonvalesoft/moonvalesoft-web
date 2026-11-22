'use client';

import { use, useEffect, useRef, useState, type ReactNode } from 'react';
import { Steps } from '@/components/steps';
import { ButtonLink } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { api, formatTL } from '@/lib/api';
import { commonError } from '@/lib/messages';
import { PLAN_NAMES, salonUrl, type Order, type Subscription } from '@/lib/types';

const ORDER_EVERY = 3000;
const SUB_EVERY = 5000;
const GIVE_UP = 10 * 60 * 1000;

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);
  const [slow, setSlow] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    async function tick() {
      if (!alive) return;
      if (Date.now() - started.current > GIVE_UP) return setStopped(true);
      if (Date.now() - started.current > 2 * 60 * 1000) setSlow(true);
      let wait = ORDER_EVERY;
      if (document.visibilityState === 'visible') {
        try {
          const o = await api<Order>(`/api/orders/${encodeURIComponent(orderId)}`);
          setOrder(o);
          if (o.status === 'failed' || o.status === 'refunded') return;
          if (o.status === 'paid') {
            const subs = await api<Subscription[]>('/api/subscriptions');
            const s = subs.find((x) => x.orderId === o.id) ?? null;
            setSub(s);
            if (!s || s.provisioning === 'done' || s.provisioning === 'failed' || s.provisioning === 'none') return;
            wait = SUB_EVERY;
          }
        } catch (e) {
          const m = commonError(e);
          if (m) setError(m);
          return;
        }
      }
      timer = setTimeout(tick, wait);
    }
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="container-mv max-w-2xl py-16">
        <Notice tone="error">{error}</Notice>
        <ButtonLink href="/panel" variant="outline" className="mt-6">
          Panelime git
        </ButtonLink>
      </div>
    );
  }

  let title = '';
  let body: ReactNode = null;
  let actions: ReactNode = null;
  const panel = (
    <ButtonLink href="/panel" variant="outline">
      Panelime git
    </ButtonLink>
  );
  if (order?.status === 'pending') {
    title = 'Ödemen bekleniyor.';
    body = (
      <>
        <p>Ödeme şirketinden onay gelince bu sayfa kendiliğinden değişecek. Sayfayı kapatırsan da sorun değil: durumu panelinde görürsün.</p>
        {slow && <p className="mt-3">Biraz uzun sürdü. Ödemeyi tamamlamadıysan tekrar deneyebilirsin.</p>}
      </>
    );
    actions = panel;
  } else if (order?.status === 'paid') {
    const p = sub?.provisioning ?? 'pending';
    if (sub && p === 'done' && sub.companySlug) {
      title = 'Hazırsın. Salonun açıldı.';
      body = (
        <>
          <p className="break-all rounded-lg border border-accent bg-surface-raised p-5 font-heading text-2xl text-fg">{salonUrl(sub.companySlug).replace('https://', '')}</p>
          <ol className="mt-5 list-decimal pl-5">
            <li>İlk girişte Google Authenticator kurulumunu yapacaksın.</li>
            <li>Çalışanlarını ekle.</li>
            <li>Takılırsan panelden bana yaz.</li>
          </ol>
        </>
      );
      actions = (
        <>
          <a href={salonUrl(sub.companySlug)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-on-accent no-underline">
            Salonuna git
          </a>
          {panel}
        </>
      );
    } else if (p === 'failed') {
      title = 'Ödemen alındı, kurulumda bir sorun çıktı.';
      body = <p>Merak etme, haberim var; düzeltip sana e-postayla yazacağım.</p>;
      actions = (
        <>
          <ButtonLink href="/panel/destek">Bana yaz</ButtonLink>
          {panel}
        </>
      );
    } else if (sub && p === 'none') {
      title = 'Hazırsın.';
      body = <p>Ödemen alındı. Kurulum için seninle iletişime geçeceğim.</p>;
      actions = panel;
    } else {
      title = 'Hazırsın. Salonun kuruluyor.';
      body = (
        <>
          <p>Ödemen alındı, teşekkür ederim. Salonunu şimdi açıyorum; bitince bu sayfa kendiliğinden değişecek.</p>
          <ul className="mt-4 flex flex-col gap-2">
            <li>✓ Ödeme alındı <span className="text-subtle">(Tamam)</span></li>
            <li>✓ Ödeme belgen panelinde <span className="text-subtle">(Tamam)</span></li>
            <li>◌ {order.companySlug ? salonUrl(order.companySlug).replace('https://', '') : 'Salonun'} açılıyor <span className="text-subtle">(Sürüyor)</span></li>
          </ul>
        </>
      );
      actions = panel;
    }
  } else if (order?.status === 'failed') {
    title = 'Ödeme tamamlanmadı.';
    body = <p>Kartından ödeme alınamadı. Başka bir kartla tekrar dene.</p>;
    actions = (
      <>
        <ButtonLink href={`/satin-al/${order.planId}`}>Tekrar dene</ButtonLink>
        <ButtonLink href="/panel/destek" variant="outline">
          Bana yaz
        </ButtonLink>
      </>
    );
  } else if (order?.status === 'refunded') {
    title = 'Bu ödeme iade edildi.';
    body = <p>Sorun olduğunu düşünüyorsan bana yaz.</p>;
    actions = <ButtonLink href="/panel/destek">Bana yaz</ButtonLink>;
  }

  const done = order?.status === 'paid' && sub?.provisioning === 'done';
  return (
    <div className="container-mv max-w-3xl py-12 md:py-16">
      <Steps current={done || order?.status === 'paid' ? 4 : 3} />
      <div role="status" aria-live="polite">
        {order ? <h1 className="text-4xl font-semibold">{title}</h1> : <div className="h-12 w-2/3 animate-pulse rounded-md bg-surface" />}
      </div>
      {body && <div className="mt-5 text-lg text-muted">{body}</div>}
      {stopped && (
        <Notice>
          Durumu bir süredir kontrol ediyorum. <button className="underline" onClick={() => window.location.reload()}>Sayfayı yenile</button>
        </Notice>
      )}
      {order ? (
        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-line bg-surface p-6 text-sm">
          <dt className="text-subtle">Paket</dt>
          <dd>{PLAN_NAMES[order.planId] ?? order.planId}</dd>
          <dt className="text-subtle">Kişi sayısı</dt>
          <dd>{order.seats}</dd>
          {order.companySlug && (
            <>
              <dt className="text-subtle">Adres</dt>
              <dd className="break-all">{salonUrl(order.companySlug).replace('https://', '')}</dd>
            </>
          )}
          <dt className="text-subtle">Tutar</dt>
          <dd className="font-semibold">{formatTL(order.amountKurus)}</dd>
        </dl>
      ) : (
        <div className="mt-8 h-40 animate-pulse rounded-lg bg-surface" aria-label="Yükleniyor" />
      )}
      {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
