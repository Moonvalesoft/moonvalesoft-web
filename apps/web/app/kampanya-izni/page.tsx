import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'Ticari Elektronik İleti İzni' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <LegalPage kind="kampanya_izni" title="Ticari Elektronik İleti İzni" />;
}
