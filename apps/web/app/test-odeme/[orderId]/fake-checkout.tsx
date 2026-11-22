'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { api } from '@/lib/api';
import { commonError } from '@/lib/messages';

/**
 * Yalnız geliştirme: sahte ödeme sağlayıcısının "ödeme sayfası". Gerçek sağlayıcı seçilince bu sayfanın yerini
 * sağlayıcının sayfası alır. API üretimde bu ucu kapatır (404).
 */
export function FakeCheckout({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function pay(result: 'basarili' | 'basarisiz') {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/dev/fake-payments/${encodeURIComponent(orderId)}/${result}`, { body: {} });
      window.location.assign(`/odeme/${encodeURIComponent(orderId)}`);
    } catch (e) {
      setBusy(false);
      const m = commonError(e);
      if (m) setError(m);
    }
  }
  return (
    <div className="container-mv max-w-xl py-16">
      <p className="mb-3 inline-block rounded-sm border border-secondary px-3 py-1 text-sm text-secondary">Test ödemesi · gerçek para çekilmez</p>
      <h1 className="text-3xl font-semibold">Sahte ödeme sayfası</h1>
      <p className="mt-3 text-muted">Ödeme sağlayıcısı seçilene kadar akışı denemek için. Kart bilgisi istenmez.</p>
      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => pay('basarili')} disabled={busy}>
          Ödemeyi başarılı say
        </Button>
        <Button variant="outline" onClick={() => pay('basarisiz')} disabled={busy}>
          Ödemeyi başarısız say
        </Button>
      </div>
    </div>
  );
}
