import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import OrderConfirmation from '@/components/orders/order-confirmation';

type PageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    payment?: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Order Confirmed | ChunkNChop',
  description: 'Your order has been received. Track your ChunkNChop delivery.',
};

export default async function OrderPaymentPage({ params, searchParams }: PageProps) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);

  const session = await getSession(await headers());

  if (!session?.user) {
    redirect(
      `/sign-in?returnTo=${encodeURIComponent(
        `/account/orders/${orderNumber}?payment=${query.payment ?? ''}`,
      )}`,
    );
  }

  return <OrderConfirmation orderNumber={orderNumber} paymentStatus={query.payment ?? 'pending'} />;
}
