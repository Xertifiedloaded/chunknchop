import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import RiderProfileClient from '@/components/rider/RiderProfileClient';

export default async function RiderProfilePage() {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent('/rider/profile')}`);
  }

  if (isAdminUser(session.user) || session.user.role !== 'rider') {
    redirect('/account');
  }

  return <RiderProfileClient />;
}
