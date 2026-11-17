
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import SignOutButton from '@/components/auth/sign-out-button';
import RiderDashboard from '@/components/rider/rider-dashboard';

export const metadata: Metadata = {
  title: 'Rider route | ChunknChop',
  description: 'Manage assigned ChunknChop deliveries and share live location with customers.',
};

export default async function RiderPage() {
  const session = await getSession(await headers());

  if (!session?.user) redirect('/sign-in?returnTo=/rider');

  if (session.user.role !== 'rider' && !isAdminUser(session.user)) {
    redirect('/account');
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <header className="relative flex min-h-[76px] items-center justify-between border-b border-[#e6e4de] px-5 sm:px-8 lg:px-[10.5%]">
        <Link
          href="/account"
          className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
        >
          YOUR ACCOUNT
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

      <RiderDashboard name={session.user.name} />
    </main>
  );
}
