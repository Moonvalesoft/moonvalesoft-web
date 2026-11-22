'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { api, ApiError } from '@/lib/api';
import { MSG } from '@/lib/messages';

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badToken, setBadToken] = useState(false);
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
    setReady(true);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (token && value.length < 10) return setError(MSG.weakPassword);
    setBusy(true);
    try {
      if (token) await api('/api/auth/reset-password', { body: { token, password: value } });
      else await api('/api/auth/forgot-password', { body: { email: value } });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_TOKEN') setBadToken(true);
      else if (err instanceof ApiError && err.code === 'WEAK_PASSWORD') setError(MSG.weakPassword);
      else if (err instanceof ApiError && err.code === 'INVALID_EMAIL') setError(MSG.invalidEmail);
      else setError(MSG.generic);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;
  return (
    <div className="container-mv max-w-lg py-16 md:py-24">
      <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
        {badToken ? (
          <>
            <h1 className="text-3xl font-semibold">Bu bağlantı geçersiz.</h1>
            <p className="mt-4 text-muted">Bu bağlantının süresi dolmuş ya da kullanılmış. Bağlantı 1 saat geçerli.</p>
            <ButtonLink href="/sifre-sifirla" className="mt-6">
              Yeni bağlantı iste
            </ButtonLink>
          </>
        ) : done ? (
          <div role="status">
            {token ? (
              <>
                <h1 className="text-3xl font-semibold">Şifren değişti.</h1>
                <p className="mt-4 text-muted">Güvenliğin için bütün cihazlarda oturumun kapandı; yeni şifrenle giriş yap.</p>
                <ButtonLink href="/giris" className="mt-6">
                  Giriş yap
                </ButtonLink>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-semibold">E-postana bak.</h1>
                <p className="mt-4 text-muted">Bu adres kayıtlıysa bir bağlantı gönderdim. Bağlantı 1 saat geçerli.</p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <h1 className="text-3xl font-semibold">{token ? 'Yeni şifreni belirle.' : 'Şifreni mi unuttun?'}</h1>
            {!token && <p className="text-muted">E-postanı yaz, sana yeni şifre bağlantısı göndereyim.</p>}
            <Field
              label={token ? 'Yeni şifre' : 'E-posta'}
              type={token ? 'password' : 'email'}
              autoComplete={token ? 'new-password' : 'email'}
              hint={token ? 'En az 10 karakter.' : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={error}
              required
            />
            {error === MSG.generic && <Notice tone="error">{error}</Notice>}
            <Button type="submit" disabled={busy} className="min-h-14">
              {token ? (busy ? 'Değiştiriliyor…' : 'Şifremi değiştir') : busy ? 'Gönderiliyor…' : 'Bağlantıyı gönder'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
