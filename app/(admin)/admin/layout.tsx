import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminNav, { AdminTopbar } from '@/components/admin/AdminNav';
import AdminAuthProvider from '@/components/admin/AdminAuthProvider';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = {
  title: 'Admin Dashboard - ChunkNChop',
  description: 'Manage products, orders, and customers',
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) redirect('/auth/login');

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
    <div className="min-h-screen bg-white">
      <AdminAuthProvider>
        <AdminNav />
        <AdminTopbar />
        <main className="min-h-screen pt-14 font-sans lg:pl-64">{children}</main>
      </AdminAuthProvider>
    </div>
  );
}
