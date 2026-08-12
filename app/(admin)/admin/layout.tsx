import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminNav, { AdminTopbar } from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Admin Dashboard - ChunkNChop',
  description: 'Manage products, orders, and customers',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) redirect('/auth/login');

  // validate refresh token by checking DB and expiry
  try {
    const prisma = (await import('@/lib/db')).default;
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });
    if (!stored) redirect('/auth/login');
    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => null);
      redirect('/auth/login');
    }

    const user = stored.user;
    if (!user || user.role !== 'ADMIN') redirect('/');
  } catch (e) {
    console.error('Admin layout auth check failed', e);
    redirect('/auth/login');
  }

  return (
    <div className="bg-sand min-h-screen">
      <AdminNav />
      <AdminTopbar />
      <main className="min-h-screen pt-14 lg:pl-64">{children}</main>
    </div>
  );
}
