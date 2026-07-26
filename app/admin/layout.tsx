import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Admin Dashboard - ChunkNChop',
  description: 'Manage products, orders, and customers',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  console.log('TOKEN PRESENT:', !!token);
  console.log('TOKEN VALUE:', token);
  if (!token) {
    redirect('/auth/login');
  }

  const decoded = verifyToken(token); // sync, no await

  if (!decoded || decoded.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="bg-background flex h-screen">
      <AdminNav />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
