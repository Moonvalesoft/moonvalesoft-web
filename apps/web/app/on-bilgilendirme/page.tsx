import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'Ön Bilgilendirme Formu' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LegalPage kind="on_bilgilendirme" title="Ön Bilgilendirme Formu" />;
}
