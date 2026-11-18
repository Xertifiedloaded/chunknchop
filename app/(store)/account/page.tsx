import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import AccountClient from '@/components/account/customer-account';

export default async function AccountPage() {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent('/account')}`);
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    role: isAdminUser(session.user)
      ? 'admin'
      : session.user.role === 'rider'
        ? 'rider'
        : 'customer',
  };

  return <AccountClient user={user} />;
}
