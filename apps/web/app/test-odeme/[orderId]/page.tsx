import { notFound } from 'next/navigation';
import { FakeCheckout } from './fake-checkout';

/**
 * Yalnız geliştirmede (`next dev`) ve NEXT_PUBLIC_DEV_FAKE_PAYMENTS=true iken var olur; aksi halde 404.
 * API ucu ayrıca kapalıdır (DEV_FAKE_PAYMENTS).
 */
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEV_FAKE_PAYMENTS !== 'true') notFound();
  const { orderId } = await params;
  return <FakeCheckout orderId={orderId} />;
}
