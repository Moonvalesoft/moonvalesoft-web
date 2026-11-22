'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { api, ApiError } from '@/lib/api';
import { MSG, safeNext } from '@/lib/messages';

type Tab = 'kayit' | 'giris';

function PasswordField(props: { label: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string | null; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field
        label={props.label}
        type={show ? 'text' : 'password'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        error={props.error}
        hint={props.hint}
        className="pr-14"
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
        className="absolute right-1 top-[30px] flex h-11 w-11 items-center justify-center rounded-sm text-muted hover:text-fg"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {show && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}

export function AuthForm({ initial, noticeVersion }: { initial: Tab; noticeVersion: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('sonra'));
  const [tab, setTab] = useState<Tab>(initial);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [pageError, setPageError] = useState<ReactNode>(null);
  const tabs = useRef<Record<Tab, HTMLButtonElement | null>>({ kayit: null, giris: null });

  function switchTo(t: Tab) {
    setTab(t);
    setErrors({});
    setPageError(null);
    const q = params.toString();
    window.history.replaceState(null, '', `/${t}${q ? `?${q}` : ''}`);
  }
  function onTabKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const t = tab === 'kayit' ? 'giris' : 'kayit';
      switchTo(t);
      tabs.current[t]?.focus();
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPageError(null);
    const errs: Record<string, string | null> = {};
    if (tab === 'kayit') {
      if (name.trim().length < 2) errs.name = 'Adını yaz.';
      if (password.length < 10) errs.password = MSG.weakPassword;
      if (!notice) errs.notice = "Devam etmek için Aydınlatma Metni'ni okuduğunu işaretle.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      if (tab === 'kayit') {
        if (!noticeVersion) throw new Error('legal');
        await api('/api/auth/register', {
          body: { name: name.trim(), email, password, noticeVersion, marketingEmail: marketing },
        });
        try {
          localStorage.setItem('mv_next', next);
        } catch {
          /* yoksa panel */
        }
        try {
          sessionStorage.setItem('mv_kayit_eposta', email);
        } catch {
          /* yoksa genel metin */
        }
        const plan = params.get('plan');
        router.push(`/kayit/eposta${plan ? `?plan=${encodeURIComponent(plan)}` : ''}`);
      } else {
        await api('/api/auth/login', { body: { email, password } });
        let target = next;
        try {
          const saved = localStorage.getItem('mv_next');
          if (!params.get('sonra') && saved) target = safeNext(saved);
          localStorage.removeItem('mv_next');
        } catch {
          /* yok */
        }
        window.location.assign(target);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_EMAIL') setErrors({ email: MSG.invalidEmail });
        else if (err.code === 'WEAK_PASSWORD') setErrors({ password: MSG.weakPassword });
        else if (err.code === 'NOTICE_REQUIRED') setPageError('Aydınlatma metni güncellendi. Sayfayı yenileyip tekrar dene.');
        else if (err.code === 'INVALID_CREDENTIALS')
          setPageError(
            <>
              E-posta ya da şifre yanlış. Tekrar dene ya da <Link href="/sifre-sifirla">şifreni sıfırla</Link>.
            </>,
          );
        else if (err.code === 'EMAIL_NOT_VERIFIED') setPageError(MSG.emailNotVerified);
        else if (err.code === 'TOO_MANY_ATTEMPTS')
          setPageError('Çok fazla deneme oldu. 15 dakika bekleyip tekrar dene ya da şifreni sıfırla.');
        else if (err.code === 'BAD_ORIGIN') setPageError(MSG.badOrigin);
        else setPageError(err.status >= 500 ? MSG.generic : MSG.network);
      } else setPageError(MSG.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
      <div role="tablist" aria-label="Hesap" className="mb-6 grid grid-cols-2 gap-2 rounded-md bg-bg p-1" onKeyDown={onTabKey}>
        {(['kayit', 'giris'] as const).map((t) => (
          <button
            key={t}
            ref={(el) => {
              tabs.current[t] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="auth-panel"
            tabIndex={tab === t ? 0 : -1}
            onClick={() => switchTo(t)}
            className={`min-h-11 rounded-sm px-3 font-semibold ${tab === t ? 'border border-accent bg-surface-raised text-fg' : 'border border-transparent text-muted'}`}
          >
            {t === 'kayit' ? 'Hesap oluştur' : 'Giriş yap'}
          </button>
        ))}
      </div>
      <form id="auth-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} onSubmit={submit} noValidate className="flex flex-col gap-5">
        {pageError && <Notice tone="error">{pageError}</Notice>}
        {tab === 'kayit' && (
          <Field label="Adın soyadın" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} required />
        )}
        <Field
          label="E-posta"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <PasswordField
          label="Şifre"
          value={password}
          onChange={setPassword}
          autoComplete={tab === 'kayit' ? 'new-password' : 'current-password'}
          error={errors.password}
          hint={tab === 'kayit' ? 'En az 10 karakter.' : undefined}
        />
        {tab === 'kayit' ? (
          <>
            <Checkbox checked={notice} onChange={setNotice} error={errors.notice} required>
              Kişisel verilerimin nasıl işlendiğini anlatan{' '}
              <Link href="/kvkk" target="_blank">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni okudum.
            </Checkbox>
            <Checkbox checked={marketing} onChange={setMarketing}>
              Yeni özellik ve kampanyalardan e-postayla haberdar olmak istiyorum.{' '}
              <Link href="/kampanya-izni" target="_blank">
                İzin metni
              </Link>
              . <span className="text-subtle">(İsteğe bağlı; istediğin zaman panelinden kapatırsın.)</span>
            </Checkbox>
          </>
        ) : (
          <Link href="/sifre-sifirla" className="flex min-h-11 items-center self-start text-sm">
            Şifremi unuttum
          </Link>
        )}
        <Button type="submit" disabled={busy} className="min-h-14 w-full">
          {tab === 'kayit' ? (busy ? 'Hesap açılıyor…' : 'Hesap oluştur') : busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
      </form>
    </div>
  );
}
