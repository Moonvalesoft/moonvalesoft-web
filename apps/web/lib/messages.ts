import { ApiError } from './api';

/** docs/ekranlar.md "Ortak hata metinleri". API'nin message alanı kullanıcıya gösterilmez. */
export const MSG = {
  generic: 'Bir şeyler ters gitti, benim tarafımda. Birazdan tekrar dene.',
  network: 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.',
  badOrigin: 'Bir şeyler ters gitti. Sayfayı yenileyip tekrar dene.',
  notFound: 'Bunu bulamadım. Panelinden kontrol edebilirsin.',
  emailNotVerified: 'Önce e-postanı doğrulaman gerekiyor. Gelen kutundaki bağlantıya tıkla.',
  invalidEmail: 'Bu e-posta adresi geçerli görünmüyor. Kontrol edip tekrar yaz.',
  weakPassword: 'Şifren en az 10 karakter olmalı.',
};

/** 401 ise girişe yönlendirir ve null döner; değilse kullanıcıya gösterilecek ortak metni döner. */
export function commonError(e: unknown): string | null {
  if (e instanceof ApiError) {
    if (e.status === 401) {
      const here = window.location.pathname + window.location.search;
      window.location.assign(`/giris?sonra=${encodeURIComponent(here)}`);
      return null;
    }
    if (e.code === 'BAD_ORIGIN') return MSG.badOrigin;
    if (e.status === 404) return MSG.notFound;
    if (e.code === 'EMAIL_NOT_VERIFIED') return MSG.emailNotVerified;
    if (e.code === 'NETWORK') return MSG.network;
  }
  if (e instanceof TypeError) return MSG.network;
  return MSG.generic;
}

/** Yalnız site içi yol kabul edilir: `/` ile başlar, `//` ile başlamaz. */
export function safeNext(v: string | null | undefined, fallback = '/panel'): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return fallback;
  return v;
}
