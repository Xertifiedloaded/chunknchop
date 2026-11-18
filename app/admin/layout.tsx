import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import AdminShell from '@/components/admin/admin-shell';

function formatRole(role?: string | null) {
  if (!role) return 'Admin';

  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect('/sign-in?returnTo=%2Fadmin');
  }

  if (!isAdminUser(session.user)) {
    redirect('/account');
  }

  return (
    <AdminShell
      userEmail={session.user.email ?? ''}
      userName={session.user.name ?? ''}
      userRole={formatRole(session.user.role)}
      unreadMessages
      notificationCount={4}
    >
      {children}
    </AdminShell>
  );
}
