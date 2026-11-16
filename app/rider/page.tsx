import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import SignOutButton from '@/components/sign-out-button';
import RiderDashboard from '@/components/rider-dashboard';

export const metadata: Metadata = {
  title: 'Rider route | ChunknChop',
  description: 'Manage assigned ChunknChop deliveries and share live location with customers.',
};

export default async function RiderPage() {
  const session = await getSession(await headers());
  if (!session?.user) redirect('/sign-in?returnTo=/rider');
  if (session.user.role !== 'rider' && !isAdminUser(session.user)) redirect('/account');

  return (
    <main className="rider-page">
      <header className="catalog-top">
        <Link href="/account" className="catalog-back">
          YOUR ACCOUNT
        </Link>
        <Link href="/" className="catalog-wordmark">
ChunknChop
        </Link>
        <div className="order-header-user">
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <RiderDashboard name={session.user.name} />
    </main>
  );
}
