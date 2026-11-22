import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Steps } from '@/components/steps';
import { ButtonLink } from '@/components/ui/button';
import { serverApi, type LegalDoc, type Me, type Plan } from '@/lib/server-api';
import { PurchaseForm } from './purchase-form';

export const metadata: Metadata = { title: 'Satın al' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const me = await serverApi<Me>('/api/me');
  if (!me) redirect(`/kayit?plan=${encodeURIComponent(planId)}&sonra=${encodeURIComponent(`/satin-al/${planId}`)}`);
  const [plans, legal] = await Promise.all([serverApi<Plan[]>('/api/plans'), serverApi<LegalDoc[]>('/api/legal')]);
  const plan = plans?.find((p) => p.id === planId);

  if (!plan) {
    return (
      <div className="container-mv max-w-2xl py-20">
        <h1 className="text-4xl font-semibold">Bu paketi bulamadım.</h1>
        <ButtonLink href="/#fiyatlar" className="mt-8">
          Paketlere bak
        </ButtonLink>
      </div>
    );
  }
  if (!plan.purchasable) {
    const quote = plan.id === 'logo-erp';
    return (
      <div className="container-mv max-w-2xl py-20">
        <h1 className="text-4xl font-semibold">{quote ? 'Bu iş projeye göre fiyatlanıyor.' : 'Bu paket henüz satışta değil.'}</h1>
        <p className="mt-4 text-lg text-muted">
          {quote ? 'Ne istediğini anlat, kapsamı ve fiyatı birlikte netleştirelim.' : 'Hazır olunca haber vermemi istersen bana yaz.'}
        </p>
        <ButtonLink href={quote ? '/teklif' : '/panel/destek'} className="mt-8">
          {quote ? 'Teklif iste' : 'Benimle konuş'}
        </ButtonLink>
      </div>
    );
  }
  const version = (k: LegalDoc['kind']) => legal?.find((d) => d.kind === k)?.version ?? null;
  return (
    <div className="container-mv py-12 md:py-16">
      <Steps current={3} />
      <h1 className="mb-8 text-4xl font-semibold">Bilgilerini gir, ödemeye geç.</h1>
      {!me.emailVerified ? (
        <p role="alert" className="text-danger">
          Önce e-postanı doğrulaman gerekiyor. Gelen kutundaki bağlantıya tıkla.
        </p>
      ) : (
        <PurchaseForm
          plan={plan}
          buyer={{ name: me.name, email: me.email }}
          preInfoVersion={version('on_bilgilendirme')}
          distanceSalesVersion={version('mesafeli_satis')}
        />
      )}
    </div>
  );
}
