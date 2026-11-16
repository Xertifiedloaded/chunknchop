import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SignOutButton from '@/components/sign-out-button';
import OrderDashboard from '@/components/order-dashboard';

export const metadata: Metadata = {
  title: 'Your orders | ChunknChop',
  description: 'Review your ChunknChop order history, spending, and delivery progress.',
};

export default async function OrdersPage() {
  const session = await getSession(await headers());
  if (!session?.user) redirect('/sign-in?returnTo=/account/orders');

  return (
    <main className="account-page">
      <header className="catalog-top">
        <Link href="/account" className="catalog-back">
          ACCOUNT
        </Link>
        <Link href="/" className="catalog-wordmark">
   ChunknChop
        </Link>
        <div className="order-header-user">
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <OrderDashboard />
      <footer className="catalog-footer">
        <span>ChunknChop</span>
        <span>GOOD MEAT. GOOD LIVING.</span>
        <Link href="/shop">SHOP THE COUNTER</Link>
      </footer>
    </main>
  );
}
