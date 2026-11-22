import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'Mesafeli Satış Sözleşmesi' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LegalPage kind="mesafeli_satis" title="Mesafeli Satış Sözleşmesi" />;
}
