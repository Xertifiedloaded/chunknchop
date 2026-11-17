
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
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <header className="relative flex min-h-[76px] items-center justify-between border-b border-[#e6e4de] bg-white px-5 sm:px-8 lg:px-[10.5%]">
        <Link
          href="/account"
          className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
        >
          ACCOUNT
        </Link>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-xl font-bold tracking-tight text-[#24231f] sm:text-2xl"
        >
          ChunknChop
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden max-w-[220px] truncate text-xs text-[#77736d] sm:block">
            {session.user.email}
          </span>

          <SignOutButton />
        </div>
      </header>

      <OrderDashboard />

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#e6e4de] px-5 py-8 text-center sm:flex-row sm:px-[10.5%] sm:text-left">
        <span className="font-heading text-lg font-bold text-[#24231f]">
          ChunknChop
        </span>

        <span className="text-[10px] font-semibold tracking-[0.14em] text-[#88847d]">
          GOOD MEAT. GOOD LIVING.
        </span>

        <Link
          href="/shop"
          className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
        >
          SHOP THE COUNTER
        </Link>
      </footer>
    </main>
  );
}
