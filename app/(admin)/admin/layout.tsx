import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import AdminNav, { AdminTopbar } from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Admin Dashboard - ChunkNChop',
  description: 'Manage products, orders, and customers',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) redirect('/auth/login');

  let decoded: any;
  try {
    decoded = verifyToken(token);
  } catch {
    redirect('/auth/login');
  }

  if (!decoded || decoded.role !== 'ADMIN') redirect('/');

  return (
    <div className="bg-sand min-h-screen">
      <AdminNav />
      <AdminTopbar />
      <main className="min-h-screen pt-14 lg:pl-64">{children}</main>
    </div>
  );
}
