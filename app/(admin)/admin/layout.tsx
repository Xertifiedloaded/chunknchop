import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata, Viewport } from 'next';

import AdminNav, { AdminTopbar } from '@/components/admin/AdminNav';
import AdminAuthProvider from '@/components/admin/AdminAuthProvider';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
  const accessToken = cookieStore.get('accessToken')?.value;
  const payload = accessToken ? verifyToken(accessToken) : null;

  if (!payload) {
    redirect(cookieStore.has('refreshToken') ? '/api/auth/refresh?next=/admin' : '/auth/login');
  }

  let role: string | null = null;

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { role: true } });
    role = user?.role ?? null;
  } catch (error) {
    console.error('Admin layout lookup failed', error);
    redirect('/auth/login');
  }

  if (role !== 'ADMIN') {
    redirect(role ? '/' : '/auth/login');
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