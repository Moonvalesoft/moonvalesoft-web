import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'KVKK Aydınlatma Metni' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LegalPage kind="aydinlatma" title="KVKK Aydınlatma Metni" />;
}
