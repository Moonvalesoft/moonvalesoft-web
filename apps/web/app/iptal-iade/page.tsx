import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'İptal ve İade Koşulları' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LegalPage kind="iptal_iade" title="İptal ve İade Koşulları" />;
}
