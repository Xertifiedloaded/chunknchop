import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Header from '@/components/layout/header';
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
    <div className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <Header />
      <main>
        <RiderDashboard name={session.user.name} />
      </main>
    </div>
  );
}
