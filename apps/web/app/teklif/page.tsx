import { redirect } from 'next/navigation';
import { serverApi, type Me } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

/** Logo ERP teklifi destek talebi olarak gelir (konusu hazır). Girişsizse önce hesap, sonra buraya döner. */
export default async function Page() {
  const target = `/panel/destek?konu=${encodeURIComponent('Logo ERP entegrasyonu teklif talebi')}`;
  const me = await serverApi<Me>('/api/me');
  redirect(me ? target : `/kayit?sonra=${encodeURIComponent(target)}`);
}
