'use client';

import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { api } from '@/lib/api';
import { safeNext } from '@/lib/messages';

export default function Page() {
  const [state, setState] = useState<'loading' | 'ok' | 'bad'>('loading');
  const [next, setNext] = useState('/panel');
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    try {
      setNext(safeNext(sessionStorage.getItem('mv_next')));
    } catch {
      /* yok */
    }
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return setState('bad');
    api('/api/auth/verify-email', { body: { token } })
      .then(() => setState('ok'))
      .catch(() => setState('bad'));
  }, []);
  const login = `/giris?sonra=${encodeURIComponent(next)}`;
  return (
    <div className="container-mv max-w-2xl py-16 md:py-24">
      <div role="status" aria-live="polite">
        {state === 'loading' && <h1 className="text-4xl font-semibold">E-postanı doğruluyorum…</h1>}
        {state === 'ok' && (
          <>
            <h1 className="text-4xl font-semibold">E-postan doğrulandı.</h1>
            <p className="mt-4 text-lg text-muted">Giriş yap, kaldığın yerden devam et.</p>
          </>
        )}
        {state === 'bad' && (
          <>
            <h1 className="text-4xl font-semibold">Bu bağlantı artık geçerli değil.</h1>
            <p className="mt-4 text-lg text-muted">
              Bağlantı 24 saat geçerli ve bir kez kullanılabilir. Daha önce tıkladıysan hesabın zaten açıktır, giriş yapmayı dene.
            </p>
          </>
        )}
      </div>
      {state !== 'loading' && (
        <ButtonLink href={login} className="mt-8">
          Giriş yap
        </ButtonLink>
      )}
    </div>
  );
}
