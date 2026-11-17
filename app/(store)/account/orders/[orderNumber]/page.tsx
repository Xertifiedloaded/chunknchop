import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import OrderTracking from '@/components/orders/order-tracking';

type PageProps = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ payment?: string }>;
};

export const metadata: Metadata = {
  title: 'Track your order | ChunknChop',
  description: 'Follow your order status and rider location in real time.',
};

export default async function OrderTrackingPage({ params, searchParams }: PageProps) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);

  const session = await getSession(await headers());

  if (!session?.user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(`/account/orders/${orderNumber}`)}`);
  }

  return <OrderTracking orderNumber={orderNumber} paymentNotice={query.payment} />;
}
