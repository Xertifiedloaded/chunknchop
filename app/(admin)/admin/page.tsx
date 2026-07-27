'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, TrendingUp, Inbox, type LucideIcon } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setError(null);
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('Could not load dashboard stats.');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load dashboard stats.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-sand)] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-charcoal)]">Dashboard</h1>
        <p className="text-[var(--color-ink)]">Welcome to ChunkNChop Admin Panel</p>
      </div>

      {error && <div className="mb-6 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-4 py-3 text-sm text-[var(--color-brand)]">{error}</div>}

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingCart} color="bg-[var(--color-slate-custom)]" />
            <StatCard title="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={TrendingUp} color="bg-[var(--color-brand)]" />
            <StatCard title="Total Customers" value={stats?.totalCustomers ?? 0} icon={Users} color="bg-[var(--color-charcoal)]" />
            <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={Package} color="bg-[var(--color-ink)]" />
          </>
        )}
      </div>

      {/* Recent Orders */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-sand)] bg-white shadow-sm">
        <div className="border-b border-[var(--color-sand)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">Recent orders</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-[var(--color-sand)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-sand)]" />
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-sand)]" />
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-sand)]" />
                <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-sand)]" />
              </div>
            ))}
          </div>
        ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox size={36} className="text-[var(--color-ink)]/40" />
            <p className="font-medium text-[var(--color-charcoal)]">No orders yet</p>
            <p className="text-sm text-[var(--color-ink)]">New orders will show up here as they come in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--color-sand)] bg-[var(--color-sand)]/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-[var(--color-charcoal)] uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-[var(--color-charcoal)] uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-[var(--color-charcoal)] uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-[var(--color-charcoal)] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-[var(--color-charcoal)] uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand)]">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-[var(--color-cream)]/30">
                    <td className="px-6 py-3 text-sm font-medium text-[var(--color-charcoal)]">{order.orderNumber}</td>
                    <td className="px-6 py-3 text-sm text-[var(--color-ink)]">{order.customerName}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-[var(--color-charcoal)]">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--color-ink)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: LucideIcon; color: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-sand)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-charcoal)]">{value}</p>
        </div>
        <div className={`${color} rounded-xl p-3`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-sand)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-20 animate-pulse rounded bg-[var(--color-sand)]" />
          <div className="h-6 w-16 animate-pulse rounded bg-[var(--color-sand)]" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-xl bg-[var(--color-sand)]" />
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]';
    case 'SHIPPED':
      return 'bg-[var(--color-slate-custom)]/10 text-[var(--color-slate-custom)]';
    case 'PROCESSING':
      return 'bg-[var(--color-charcoal)]/10 text-[var(--color-charcoal)]';
    case 'PENDING':
      return 'bg-[var(--color-ink)]/10 text-[var(--color-ink)]';
    default:
      return 'bg-[var(--color-ink)]/10 text-[var(--color-ink)]';
  }
}
