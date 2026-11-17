import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import SignOutButton from '@/components/auth/sign-out-button';
import OrderDashboard from '@/components/orders/order-dashboard';

export const metadata: Metadata = {
  title: 'Your orders | ChunknChop',
  description: 'Review your ChunknChop order history, spending, and delivery progress.',
};

export default async function OrdersPage() {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect('/sign-in?returnTo=/account/orders');
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <div className="mx-auto w-full max-w-[1440px]">
        <OrderDashboard />
      </div>
    </main>
  );
}
