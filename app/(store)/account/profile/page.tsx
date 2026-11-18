import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import ProfileClient from '@/components/account/profile-client';

export default async function AccountProfilePage() {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent('/account/profile')}`);
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

  return <ProfileClient user={user} />;
}
