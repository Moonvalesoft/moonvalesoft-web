import 'server-only';
import { cookies } from 'next/headers';

const API = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/** Sunucu bileşenlerinden API'ye: ziyaretçinin oturum çerezini iletir. Hata olursa null. */
export async function serverApi<T>(path: string): Promise<T | null> {
  try {
    const jar = await cookies();
    const session = jar.get('mv_session');
    const res = await fetch(`${API}${path}`, {
      headers: session ? { cookie: `mv_session=${session.value}` } : undefined,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface Plan {
  id: string;
  product: 'randevu' | 'crm' | 'emlak' | 'logo-erp';
  name: string;
  interval: 'month' | 'one_time';
  priceKurus: number | null;
  perSeat: boolean;
  purchasable: boolean;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface LegalDoc {
  kind: 'aydinlatma' | 'on_bilgilendirme' | 'mesafeli_satis' | 'kampanya_izni' | 'iptal_iade';
  version: string;
  title: string;
  path: string;
}
