import Link from 'next/link';
import { Suspense } from 'react';
import { Steps } from '@/components/steps';
import { formatTL } from '@/lib/api';
import { serverApi, type LegalDoc, type Plan } from '@/lib/server-api';
import { AuthForm } from './auth-form';

export async function AuthPage({ initial, planId }: { initial: 'kayit' | 'giris'; planId?: string }) {
  const [legal, plans] = await Promise.all([serverApi<LegalDoc[]>('/api/legal'), planId ? serverApi<Plan[]>('/api/plans') : null]);
  const notice = legal?.find((d) => d.kind === 'aydinlatma')?.version ?? null;
  const plan = plans?.find((p) => p.id === planId);
  return (
    <div className="container-mv grid gap-10 py-12 md:grid-cols-[1fr_440px] md:py-20">
      {plan ? (
        <div>
          <Steps current={2} />
          <h1 className="text-4xl font-semibold">Önce seni tanıyayım.</h1>
          <div className="mt-8 rounded-lg border border-line bg-surface p-6">
            <p className="font-semibold">{plan.name}</p>
            <p className="mt-1 text-muted">
              {plan.priceKurus !== null ? formatTL(plan.priceKurus) : '[FİYAT]'}
              {plan.perSeat ? ' · kişi başına' : ''} · aylık
            </p>
            <Link href="/#fiyatlar" className="mt-3 inline-flex min-h-11 items-center text-sm">
              Paketi değiştir
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-4xl font-semibold">Hoş geldin.</h1>
          <p className="mt-4 max-w-md text-muted">Hesabınla paketlerini, faturalarını ve destek taleplerini tek yerden görürsün.</p>
        </div>
      )}
      <Suspense>
        <AuthForm initial={initial} noticeVersion={notice} />
      </Suspense>
    </div>
  );
}
