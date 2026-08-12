'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, CalendarDays, ChevronDown, Download, Package, Plus, RefreshCw, Send, ShoppingBag, ShoppingCart, Tag, Truck, Wallet, Clock3, CircleCheck, ChefHat, Inbox } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { fetchWithAuth } from '@/lib/fetchClient';
import type { Order } from '@/components/admin/types';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
}

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const relativeTime = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(dateStr).toLocaleDateString();
};

const AVATAR_COLORS = ['bg-[#f26422]', 'bg-[#20b87a]', 'bg-[#ef4444]', 'bg-[#742b43]', 'bg-[#f5a623]', 'bg-[#ef7045]'];

const statusCopy: Record<string, string> = {
  PENDING: 'placed an order',
  PROCESSING: 'order is being processed',
  PAID: 'completed payment',
  SHIPPED: 'order shipped',
  DELIVERED: 'order delivered',
  CANCELLED: 'cancelled an order',
  REFUNDED: 'requested a refund',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
    setTodayLabel(
      new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );
  }, []);

  useEffect(() => {
    fetchWithAuth('/api/admin/stats')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not load dashboard stats.');
        return data;
      })
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = stats?.totalOrders ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalCustomers = stats?.totalCustomers ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const recentOrders = stats?.recentOrders ?? [];

  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.trim().split(/\s+/)[0] || null;

  return (
    <main className="min-h-screen bg-[#f7f7f6] px-3 py-4 text-[#202020] sm:px-5 lg:px-7">
      <div className="mx-auto max-w-375">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#242424] sm:text-[20px]">
              {' '}
              {greeting ?? 'Welcome'}
              {firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 text-[9px] leading-4 text-[#8d8d8d] sm:text-[10px]">{todayLabel ?? '\u00A0'} · Here&apos;s how ChunkNChop is performing across processing, fulfilment and sales today.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-lg border border-[#dedede] bg-white px-3 text-[10px] font-medium text-[#555] shadow-sm">
              <CalendarDays size={12} />
              Today
              <ChevronDown size={11} />
            </button>

            <button className="flex h-9 items-center gap-2 rounded-lg border border-[#dedede] bg-white px-3 text-[10px] font-medium text-[#555] shadow-sm">
              <Download size={12} />
              Export
            </button>

            <button className="flex h-9 items-center gap-2 rounded-lg bg-[#f26422] px-3 text-[10px] font-medium text-white shadow-sm">
              <Clock3 size={12} />
              Open Processing
            </button>
          </div>
        </header>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-[11px] text-red-700">{error}</div>}

        {/* Top Metrics */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard title="Total Revenue" value={loading ? '—' : naira(totalRevenue)} icon={<Wallet size={13} />} iconClass="bg-[#fff0e9] text-[#f26422]" change="+12.4%" description="vs last month" positive />

          <MetricCard title="Total Orders" value={loading ? '—' : totalOrders.toLocaleString()} icon={<ShoppingBag size={13} />} iconClass="bg-[#fff0e9] text-[#a63e21]" change="+8.6%" description="vs last month" positive />

          <MetricCard title="Average Order Value" value={loading ? '—' : naira(avgOrderValue)} icon={<ArrowUpRight size={13} />} iconClass="bg-[#eafaf3] text-[#0d9b62]" change="+5.1%" description="Basket size" positive />

          <MetricCard title="Total Customers" value={loading ? '—' : totalCustomers.toLocaleString()} icon={<RefreshCw size={13} />} iconClass="bg-[#f0efed] text-[#666]" change="+6.4%" description={`${totalProducts} active products`} positive />
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatusCard label="Pending" value="18" icon={<Clock3 size={12} />} color="text-[#f59a23]" />
          <StatusCard label="Preparing" value="12" icon={<ChefHat size={12} />} color="text-[#ee542f]" />
          <StatusCard label="Out for Delivery" value="27" icon={<Truck size={12} />} color="text-[#138bd0]" />
          <StatusCard label="Delivered" value="137" icon={<CircleCheck size={12} />} color="text-[#0ca66a]" />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="rounded-xl border border-[#e8e8e6] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.035)]">
            <div className="flex items-start justify-between px-4 pt-4 sm:px-5">
              <div>
                <h2 className="text-[11px] font-semibold">Weekly Revenue</h2>
                <p className="mt-0.5 text-[8px] text-[#999]">Gross revenue this week compared with the same days last week</p>
              </div>

              <div className="flex items-center gap-3 text-[7px]  text-[#888]">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f26422]" />
                  This week
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b8b8b8]" />
                  Last week
                </span>
              </div>
            </div>

            <div className="relative h-36.25 px-5 pt-5 sm:h-38.75">
              <div className="absolute inset-x-5 top-6 border-t border-dashed border-[#eeeeee]" />
              <div className="absolute inset-x-5 top-12 border-t border-dashed border-[#eeeeee]" />
              <div className="absolute inset-x-5 top-17.5 border-t border-dashed border-[#eeeeee]" />
              <div className="absolute inset-x-5 top-23 border-t border-dashed border-[#eeeeee]" />

              <div className="absolute right-5 bottom-4 left-5 flex items-end justify-between">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="flex w-full flex-col items-center gap-1">
                    <div className="w-0.5 rounded-full bg-[#f26422]" style={{ height: `${[30, 46, 39, 62, 53, 74, 67][i]}px` }} />
                    <span className="text-[7px]  text-[#aaa]">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-[#eeeeee]">
              <RevenueStat label="Weekly sales" value={loading ? '—' : naira(totalRevenue)} change="+12.8%" />
              <RevenueStat label="Orders this week" value={loading ? '—' : totalOrders.toLocaleString()} change="+9.4%" border />
              <RevenueStat label="Refund rate" value="1.2%" change="-0.4%" border />
            </div>
          </div>

          <QuickActions />
        </section>

        {/* Orders by hour (placeholder) + Recent orders from live data */}
        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.8fr)]">
          <div className="rounded-xl border border-[#e8e8e6] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.035)]">
            <div className="px-4 pt-4">
              <h2 className="text-[11px] font-semibold">Orders by Hour</h2>
              <p className="mt-0.5 text-[8px] text-[#999]">Live order intake across today</p>
            </div>

            <div className="relative h-36.25 px-4 pt-5">
              <div className="absolute top-7 right-4 left-4 border-t border-dashed border-[#eeeeee]" />
              <div className="absolute top-15 right-4 left-4 border-t border-dashed border-[#eeeeee]" />
              <div className="absolute top-23.25 right-4 left-4 border-t border-dashed border-[#eeeeee]" />
              <div className="absolute top-31.5 right-4 left-4 border-t border-dashed border-[#eeeeee]" />

              <div className="absolute right-4 bottom-5 left-4 flex h-31.25 items-end justify-between gap-1">
                {[8, 15, 12, 25, 22, 31, 28, 40, 34, 45, 38, 49].map((height, i) => (
                  <div key={i} className="flex flex-1 items-end justify-center">
                    <div className="w-full max-w-2.25 rounded-t-[3px] bg-[#f26422]" style={{ height: `${height}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <RecentOrdersPanel orders={recentOrders} loading={loading} />
        </section>

        {/* Bottom */}
        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(250px,1fr)]">
          <RecentActivity orders={recentOrders} loading={loading} />
          <TopCategories />
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value, icon, iconClass, change, description, positive }: { title: string; value: string; icon: React.ReactNode; iconClass: string; change: string; description: string; positive: boolean }) {
  return (
    <div className="min-h-18.75 rounded-xl border border-[#e8e8e6] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.035)] sm:px-4">
      <div className="flex items-start justify-between">
        <span className="text-[8px] text-[#777]">{title}</span>
        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${iconClass}`}>{icon}</span>
      </div>

      <div className="mt-1 truncate text-[15px] font-bold tracking-[-0.03em] sm:text-[16px]">{value}</div>

      <div className="mt-0.5 flex items-center gap-1 text-[7px] ">
        <span className={`font-semibold ${positive ? 'text-[#0a9a5c]' : 'text-[#e33e3e]'}`}>{change}</span>
        {description && <span className="text-[#a0a0a0]">{description}</span>}
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-[#e8e8e6] bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className={`flex items-center gap-1 text-[8px] ${color}`}>
        {icon}
        <span className="text-[#777]">{label}</span>
      </div>
      <div className={`mt-0.5 text-[13px] font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function RevenueStat({ label, value, change, border }: { label: string; value: string; change: string; border?: boolean }) {
  return (
    <div className={`px-3 py-2.5 sm:px-4 ${border ? 'border-l border-[#eeeeee]' : ''}`}>
      <p className="text-[7px]  text-[#888]">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[9px] font-semibold">{value}</span>
        <span className="text-[6px] font-semibold text-[#0a9a5c]">{change}</span>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Add Product', icon: <Plus size={11} /> },
    { label: 'Create Coupon', icon: <Tag size={11} /> },
    { label: 'View Orders', icon: <ShoppingCart size={11} /> },
    { label: 'Add Inventory', icon: <Package size={11} /> },
    { label: 'Send Promotion', icon: <Send size={11} /> },
  ];

  return (
    <div className="rounded-xl border border-[#e8e8e6] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.035)]">
      <h2 className="text-[11px] font-semibold">Quick Actions</h2>
      <p className="mt-0.5 text-[8px] text-[#999]">Common operations tasks</p>

      <div className="mt-3 space-y-1.5">
        {actions.map((action) => (
          <button key={action.label} className="group flex h-8 w-full items-center justify-between rounded-lg border border-[#eeeeee] bg-white px-2.5 text-left transition hover:border-[#f5b69a] hover:bg-[#fffaf7]">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#fff1ea] text-[#f26422]">{action.icon}</span>
              <span className="text-[8px] font-medium text-[#555]">{action.label}</span>
            </span>
            <ArrowRight size={11} className="text-[#aaa] transition group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RecentOrdersPanel({ orders, loading }: { orders: Order[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-[#e8e8e6] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[11px] font-semibold">Recent Orders</h2>
          <p className="mt-0.5 text-[8px] text-[#999]">Latest customer activity across the storefront</p>
        </div>
        <a href="/admin/orders" className="text-[8px] font-medium text-[#f26422]">
          View all →
        </a>
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-full animate-pulse rounded bg-[#f2f2f0]" />
          ))}
        </div>
      ) : !orders.length ? (
        <div className="py-8 text-center">
          <Inbox className="mx-auto text-[#ccc]" size={20} />
          <p className="mt-2 text-[9px] font-medium text-[#555]">No orders yet</p>
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          {orders.map((order, index) => (
            <div key={order.id} className="grid grid-cols-[22px_minmax(120px,1fr)_minmax(80px,1fr)_65px] items-center gap-2 py-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f5f5f4] text-[7px]  font-semibold text-[#888]">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-[8px] font-medium">{order.customerName}</p>
                <p className="text-[7px]  text-[#aaa]">{order.id}</p>
              </div>
              <div>
                <p className="text-[7px]  text-[#aaa]">{order.status}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-semibold">{naira(order.total)}</p>
                <p className="text-[6px] text-[#aaa]">{relativeTime(order.createdAt as unknown as string)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ orders, loading }: { orders: Order[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-[#e8e8e6] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.035)]">
      <h2 className="text-[11px] font-semibold">Recent Customer Activity</h2>
      <p className="mt-0.5 text-[8px] text-[#999]">Live feed across storefront and support</p>

      {loading ? (
        <div className="mt-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-[#f2f2f0]" />
          ))}
        </div>
      ) : !orders.length ? (
        <p className="mt-3 text-[8px] text-[#aaa]">No recent activity.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {orders.slice(0, 6).map((order, i) => (
            <div key={order.id} className="flex items-center gap-2">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[6px] font-semibold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{order.customerName?.charAt(0).toUpperCase() ?? '?'}</span>
              <div className="min-w-0">
                <p className="truncate text-[8px] text-[#444]">
                  <span className="font-medium">{order.customerName}</span> {statusCopy[order.status] ?? 'updated an order'}
                </p>
                <p className="text-[6px] text-[#aaa]">
                  {order.id} · {naira(order.total)} · {relativeTime(order.createdAt as unknown as string)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopCategories() {
  const categories = [
    { name: 'Beef', percentage: '32%' },
    { name: 'Chicken', percentage: '26%' },
    { name: 'Seafood', percentage: '16%' },
    { name: 'Goat', percentage: '11%' },
    { name: 'Sausages', percentage: '9%' },
    { name: 'Other', percentage: '6%' },
  ];

  return (
    <div className="rounded-xl border border-[#e8e8e6] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.035)]">
      <h2 className="text-[11px] font-semibold">Top Categories</h2>
      <p className="mt-0.5 text-[8px] text-[#999]">Revenue share, last 30 days</p>

      <div className="mt-4 flex items-center gap-5">
        <div
          className="relative h-25 w-25 shrink-0 rounded-full"
          style={{
            background: 'conic-gradient(#7d3038 0deg 115deg, #f26422 115deg 209deg, #b5b2a8 209deg 267deg, #8f8b82 267deg 307deg, #d7a067 307deg 339deg, #d8d8d8 339deg 360deg)',
          }}
        >
          <div className="absolute inset-5.75 flex items-center justify-center rounded-full bg-white">
            <div className="text-center">
              <p className="text-[13px] font-bold">100%</p>
              <p className="text-[6px] text-[#999]">Revenue</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {categories.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[7px]  text-[#555]">
                <span className={`h-1.5 w-1.5 rounded-[1px] ${['bg-[#7d3038]', 'bg-[#f26422]', 'bg-[#b5b2a8]', 'bg-[#8f8b82]', 'bg-[#d7a067]', 'bg-[#d8d8d8]'][index]}`} />
                {category.name}
              </span>
              <span className="text-[7px]  font-semibold">{category.percentage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
