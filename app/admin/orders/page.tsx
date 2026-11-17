
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminOrders from '@/components/admin/admin-orders';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orders | ChunknChop Admin',
  description: 'Manage customer orders, payments and deliveries.',
};

export default async function AdminOrdersPage() {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect('/sign-in?returnTo=%2Fadmin%2Forders');
  }

  if (!isAdminUser(session.user)) {
    redirect('/account');
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-[#292621] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <AdminOrders />
      </div>
    </main>
  );
}
