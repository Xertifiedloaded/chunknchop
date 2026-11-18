'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  Calendar,
  ChefHat,
  ChevronDown,
  CircleCheck,
  Clock,
  Download,
  Package,
  Repeat,
  Send,
  ShoppingBag,
  Ticket,
  TrendingUp,
  Truck,
} from 'lucide-react';

type DashboardApiResponse = {
  overview: {
    revenueCents: number;
    orderCount: number;
    paidOrderCount: number;
    pendingOrderCount: number;
    customerCount: number;
    productCount: number;
    publishedProductCount: number;
    couponCount: number;
  };
  ordersByStatus: { status: string; count: number }[];
  productSales: {
    productId?: string;
    name: string;
    category: string;
    units: number;
    revenueCents: number;
  }[];
  categorySales: {
    category: string;
    units: number;
    revenueCents: number;
  }[];
  weeklyRevenue: {
    days: {
      date: string;
      label: string;
      thisWeekCents: number;
      lastWeekCents: number;
      thisWeekOrders: number;
      lastWeekOrders: number;
    }[];
    thisWeekRevenueCents: number;
    lastWeekRevenueCents: number;
    thisWeekOrderCount: number;
    lastWeekOrderCount: number;
  };
  hourlyOrders: { hour: number; label: string; count: number }[];
  recentOrders: {
    orderNumber: string;
    customerName?: string | null;
    email?: string | null;
    status?: string | null;
    paymentStatus?: string | null;
    subtotalCents?: number | null;
    currency?: string | null;
    createdAt?: string | Date | null;
    items?: {
      name?: string | null;
      slug?: string | null;
      quantity?: number | null;
    }[];
  }[];
};

const BRAND = '#C8552B';

const card = 'rounded-xl border border-[#eceae7] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.035)]';

const quickActions = [
  { label: 'Add Product', icon: Package },
  { label: 'Create Coupon', icon: Ticket },
  { label: 'View Orders', icon: ShoppingBag },
  { label: 'Add Inventory', icon: Boxes },
  { label: 'Send Promotion', icon: Send },
];

const CATEGORY_COLORS = [
  '#6B2230',
  '#D2582F',
  '#E3A126',
  '#E08A3C',
  '#6CC06A',
  '#2F6FC4',
  '#8B5CF6',
  '#64748B',
];

function Delta({ value, up }: { value: string; up: boolean }) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[9px] font-semibold leading-none ${
        up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
      }`}
    >
      <Icon size={10} strokeWidth={2.5} />
      {value}
    </span>
  );
}

function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-[12px] font-semibold tracking-tight text-[#302b27]">{title}</h2>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[#99918a]">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

function WeeklyChart({ days }: { days: DashboardApiResponse['weeklyRevenue']['days'] }) {
  if (!days.length) return null;

  const W = 600;
  const H = 155;
  const padX = 12;
  const padTop = 10;
  const padBottom = 22;
  const values = days.flatMap((day) => [day.thisWeekCents, day.lastWeekCents]);
  const max = Math.max(1, ...values) * 1.12;
  const x = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, days.length - 1);
  const y = (value: number) => padTop + (1 - value / max) * (H - padTop - padBottom);
  const line = (key: 'thisWeekCents' | 'lastWeekCents') =>
    days.map((day, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(day[key])}`).join(' ');
  const area = `${line('thisWeekCents')} L${x(days.length - 1)},${H - padBottom} L${x(0)},${H - padBottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Paid revenue this week compared with last week"
    >
      <defs>
        <linearGradient id="wk-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.14" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((gridLine) => {
        const gy = padTop + (gridLine * (H - padTop - padBottom)) / 3;
        return (
          <line
            key={gridLine}
            x1={padX}
            x2={W - padX}
            y1={gy}
            y2={gy}
            stroke="#F0EEEC"
            strokeWidth="1"
          />
        );
      })}
      <path d={area} fill="url(#wk-fill)" />
      <path
        d={line('lastWeekCents')}
        fill="none"
        stroke="#D4D4D8"
        strokeWidth="2"
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={line('thisWeekCents')}
        fill="none"
        stroke={BRAND}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {days.map((day, index) => (
        <text
          key={day.date}
          x={x(index)}
          y={H - 5}
          textAnchor="middle"
          fontSize="10"
          fill="#9CA3AF"
        >
          {day.label}
        </text>
      ))}
    </svg>
  );
}

function CategoryDonut({
  categories,
}: {
  categories: { name: string; pct: number; color: string }[];
}) {
  const r = 48;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg
      viewBox="0 0 140 140"
      className="size-28 shrink-0 -rotate-90 sm:size-32"
      role="img"
      aria-label="Revenue share by category"
    >
      <circle cx="70" cy="70" r={r} fill="none" stroke="#F3F4F6" strokeWidth="15" />

      {categories.map((cat) => {
        const len = (cat.pct / 100) * c;

        const element = (
          <circle
            key={cat.name}
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={cat.color}
            strokeWidth="15"
            strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
            strokeDashoffset={-offset}
          />
        );

        offset += len;
        return element;
      })}
    </svg>
  );
}

function formatNairaFromKobo(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format((Number.isFinite(amount) ? amount : 0) / 100);
}

function formatOrderDate(value?: string | Date | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getStatusPresentation(status: string) {
  const normalized = status.toLowerCase().replace(/[_-]/g, ' ');

  if (normalized.includes('deliver')) {
    return { label: 'Delivered', icon: CircleCheck, color: 'text-[#2E8B57]' };
  }
  if (
    normalized.includes('dispatch') ||
    normalized.includes('ship') ||
    normalized.includes('transit')
  ) {
    return { label: 'Out for Delivery', icon: Truck, color: 'text-[#2F6FC4]' };
  }
  if (normalized.includes('prepar') || normalized.includes('process')) {
    return { label: 'Preparing', icon: ChefHat, color: 'text-[#C8552B]' };
  }
  if (normalized.includes('cancel')) {
    return { label: 'Cancelled', icon: CircleCheck, color: 'text-red-600' };
  }
  if (normalized.includes('complete')) {
    return { label: 'Completed', icon: CircleCheck, color: 'text-[#2E8B57]' };
  }
  return { label: status || 'Pending', icon: Clock, color: 'text-[#B45F10]' };
}

export default function DashboardOverview({ name = 'Admin' }: { name?: string }) {
  const [dashboard, setDashboard] = useState<DashboardApiResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Africa/Lagos',
      }).format(new Date()),
    );
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setDashboardLoading(true);
        setDashboardError(null);

        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load dashboard data');
        }

        setDashboard(data as DashboardApiResponse);
      } catch (error) {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : 'Unable to load dashboard data';

        setDashboardError(message);
        toast.error(message);
      } finally {
        if (!controller.signal.aborted) setDashboardLoading(false);
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, []);

  const overview = dashboard?.overview;
  const averageOrderValue =
    overview && overview.paidOrderCount > 0
      ? Math.round(overview.revenueCents / overview.paidOrderCount)
      : 0;

  const kpis = [
    {
      label: 'Total Revenue',
      value: overview ? formatNairaFromKobo(overview.revenueCents) : '—',
      delta: '',
      up: true,
      note: 'From paid orders',
      icon: Banknote,
      tile: 'bg-orange-50 text-[#C8552B]',
      accent: true,
    },
    {
      label: 'Total Orders',
      value: overview ? overview.orderCount.toLocaleString('en-NG') : '—',
      delta: '',
      up: true,
      note: 'All recorded orders',
      icon: ShoppingBag,
      tile: 'bg-rose-50 text-[#7A2434]',
    },
    {
      label: 'Average Order Value',
      value: overview ? formatNairaFromKobo(averageOrderValue) : '—',
      delta: '',
      up: true,
      note: 'Revenue ÷ paid orders',
      icon: TrendingUp,
      tile: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Paid Orders',
      value: overview ? overview.paidOrderCount.toLocaleString('en-NG') : '—',
      delta: '',
      up: true,
      note: `${overview?.pendingOrderCount ?? 0} orders not paid`,
      icon: Repeat,
      tile: 'bg-gray-100 text-gray-600',
    },
  ];

  const summaryStats = [
    { label: 'Customers', value: overview?.customerCount },
    { label: 'Products', value: overview?.productCount },
    { label: 'Published products', value: overview?.publishedProductCount },
    { label: 'Coupons', value: overview?.couponCount },
  ];

  const statusColors: Record<string, string> = {
    pending: 'text-[#B45F10]',
    preparing: 'text-[#C8552B]',
    processing: 'text-[#C8552B]',
    delivered: 'text-[#2E8B57]',
    completed: 'text-[#2E8B57]',
    cancelled: 'text-red-600',
    shipped: 'text-[#2F6FC4]',
    dispatched: 'text-[#2F6FC4]',
  };

  const statuses = (dashboard?.ordersByStatus ?? []).map((item) => {
    const presentation = getStatusPresentation(item.status);
    return {
      label: presentation.label,
      value: item.count,
      icon: presentation.icon,
      color: statusColors[item.status.toLowerCase()] ?? presentation.color,
    };
  });

  const recentActivity = (dashboard?.recentOrders ?? []).map((order) => {
    const customer = order.customerName || order.email || 'Customer';
    const initials =
      customer
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'CU';

    const productNames = (order.items ?? [])
      .map((item) => item.name?.trim() || item.slug?.trim())
      .filter((productName): productName is string => Boolean(productName));
    const uniqueProductNames = [...new Set(productNames)];
    const productSummary = uniqueProductNames.length
      ? `${uniqueProductNames.slice(0, 2).join(', ')}${uniqueProductNames.length > 2 ? ` +${uniqueProductNames.length - 2} more` : ''}`
      : 'products not listed';

    return {
      initials,
      title: customer,
      action: `ordered ${productSummary}`,
      meta: `Order ${order.orderNumber} · ${order.status || 'Status unavailable'} · ${order.paymentStatus || 'Payment status unavailable'} · ${order.subtotalCents != null ? formatNairaFromKobo(order.subtotalCents) : 'Amount unavailable'} · ${formatOrderDate(order.createdAt)}`,
      bg: 'bg-[#C8552B]',
    };
  });

  const productSales = dashboard?.productSales ?? [];
  const weeklyDays = dashboard?.weeklyRevenue?.days ?? [];
  const categoryRevenueTotal = (dashboard?.categorySales ?? []).reduce(
    (total, item) => total + item.revenueCents,
    0,
  );
  const categories = (dashboard?.categorySales ?? []).map((item, index) => ({
    name:
      item.category && !/^(unknown|uncategorized|n\/?a|null|undefined)$/i.test(item.category.trim())
        ? item.category.trim()
        : 'Uncategorized',
    units: item.units,
    revenueCents: item.revenueCents,
    pct: categoryRevenueTotal > 0 ? (item.revenueCents / categoryRevenueTotal) * 100 : 0,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
  const maxProductUnits = Math.max(1, ...productSales.map((item) => item.units));
  const hourly = dashboard?.hourlyOrders ?? [];
  const hourMax = Math.max(1, ...hourly.map((item) => item.count));

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-3 py-4 font-sans text-[#302b27] sm:px-4 sm:py-5 lg:px-5 lg:py-5 xl:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        {}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-[#302b27] sm:text-xl">
              {greeting}, {name}
            </h1>

            <p className="mt-1 max-w-[480px] text-[10px] leading-[1.7] text-[#918980] sm:text-[11px]">
              {new Intl.DateTimeFormat('en-NG', { dateStyle: 'full' }).format(new Date())} ·
              Here&apos;s how ChunkNChop is performing across processing, fulfilment and sales
              today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#eae6e1] bg-white px-2.5 text-[10px] font-medium text-[#514a44] shadow-sm transition hover:bg-gray-50 sm:h-9 sm:px-3"
            >
              <Calendar size={13} className="text-[#918980]" />
              Today
              <ChevronDown size={12} className="text-[#aaa39b]" />
            </button>

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#eae6e1] bg-white px-2.5 text-[10px] font-medium text-[#514a44] shadow-sm transition hover:bg-gray-50 sm:h-9 sm:px-3"
            >
              <Download size={13} />
              Export
            </button>

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#C8552B] px-3 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#B54A24] sm:h-9 sm:px-3.5"
            >
              <ChefHat size={13} />
              Open Processing
            </button>
          </div>
        </header>

        {}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;

            return (
              <div key={k.label} className={`${card} relative overflow-hidden p-3.5 sm:p-4`}>
                {k.accent && <span className="absolute inset-x-0 top-0 h-[2px] bg-[#C8552B]" />}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-medium text-[#898078]">{k.label}</p>

                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${k.tile}`}
                  >
                    <Icon size={15} />
                  </span>
                </div>

                <p className="mt-3 text-xl font-bold leading-none tracking-tight text-[#302b27] sm:text-[22px]">
                  {k.value}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {k.delta && <Delta value={k.delta} up={k.up} />}

                  {k.note && <span className="text-[9px] text-[#99918a]">{k.note}</span>}
                </div>
              </div>
            );
          })}
        </section>

        {}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {dashboardLoading && !dashboard ? (
            <div
              className={`${card} col-span-2 px-3.5 py-5 text-center text-[10px] text-[#898078] sm:col-span-4`}
            >
              Loading order statuses...
            </div>
          ) : statuses.length === 0 ? (
            <div
              className={`${card} col-span-2 px-3.5 py-5 text-center text-[10px] text-[#898078] sm:col-span-4`}
            >
              {dashboardError || 'No order status data available.'}
            </div>
          ) : (
            statuses.map((s) => {
              const Icon = s.icon;

              return (
                <div key={s.label} className={`${card} px-3.5 py-3 sm:px-4`}>
                  <p className={`flex items-center gap-1.5 text-[10px] font-medium ${s.color}`}>
                    <Icon size={12} />
                    {s.label}
                  </p>

                  <p className={`mt-1.5 text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
                </div>
              );
            })
          )}
        </section>

        {}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {}
          <div className={`${card} flex min-w-0 flex-col overflow-hidden lg:col-span-2`}>
            <div className="p-4 pb-0">
              <CardHeader
                title="Weekly Revenue"
                subtitle="Paid order revenue · this week compared with last week"
                right={
                  <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-[#898078]">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-[#C8552B]" />
                      This week
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-gray-300" />
                      Last week
                    </span>
                  </div>
                }
              />
            </div>

            <div className="flex h-40 min-w-0 flex-1 items-center justify-center px-3 pb-2 pt-4 text-center sm:h-44 sm:px-4">
              {dashboardLoading ? (
                <p className="text-[10px] text-[#99918a]">Loading weekly revenue…</p>
              ) : weeklyDays.length ? (
                <WeeklyChart days={weeklyDays} />
              ) : (
                <p className="text-[10px] text-[#99918a]">
                  No paid orders were recorded for this week or last week.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#f0eeeb] px-4 py-3 sm:grid-cols-4">
              <div>
                <p className="text-[9px] text-[#918980]">This week revenue</p>
                <p className="mt-1 text-xs font-bold text-[#302b27]">
                  {dashboardLoading
                    ? '…'
                    : formatNairaFromKobo(dashboard?.weeklyRevenue?.thisWeekRevenueCents ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#918980]">Last week revenue</p>
                <p className="mt-1 text-xs font-bold text-[#302b27]">
                  {dashboardLoading
                    ? '…'
                    : formatNairaFromKobo(dashboard?.weeklyRevenue?.lastWeekRevenueCents ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#918980]">Orders this week</p>
                <p className="mt-1 text-xs font-bold text-[#302b27]">
                  {dashboardLoading
                    ? '…'
                    : (dashboard?.weeklyRevenue?.thisWeekOrderCount ?? 0).toLocaleString('en-NG')}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#918980]">Orders last week</p>
                <p className="mt-1 text-xs font-bold text-[#302b27]">
                  {dashboardLoading
                    ? '…'
                    : (dashboard?.weeklyRevenue?.lastWeekOrderCount ?? 0).toLocaleString('en-NG')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-y divide-[#f0eeeb] border-t border-[#f0eeeb] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="px-4 py-3">
                  <p className="text-[9px] font-medium text-[#918980]">{stat.label}</p>
                  <p className="mt-1 text-sm font-bold text-[#302b27]">
                    {dashboardLoading ? '…' : (stat.value ?? 0).toLocaleString('en-NG')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className={`${card} min-w-0 p-4`}>
            <CardHeader title="Quick Actions" subtitle="Common operations tasks" />

            <ul className="mt-3 space-y-1.5">
              {quickActions.map((a) => {
                const Icon = a.icon;

                return (
                  <li key={a.label}>
                    <button
                      type="button"
                      className="group flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-white px-2.5 py-2 text-left transition hover:border-[#e8c5b7] hover:bg-[#fffaf7]"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-[#C8552B]">
                        <Icon size={14} />
                      </span>

                      <span className="flex-1 text-[10px] font-semibold text-[#514a44]">
                        {a.label}
                      </span>

                      <ArrowRight
                        size={13}
                        className="text-[#b8afa7] transition group-hover:translate-x-0.5 group-hover:text-[#C8552B]"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {}
          <div className={`${card} flex min-w-0 flex-col p-4`}>
            <CardHeader
              title="Orders by Hour"
              subtitle="Orders received throughout today · Africa/Lagos time"
            />

            <div className="mt-4 min-h-40 overflow-x-auto">
              {dashboardLoading ? (
                <p className="flex h-40 items-center justify-center text-[10px] text-[#99918a]">
                  Loading hourly orders…
                </p>
              ) : hourly.length === 0 ? (
                <p className="flex h-40 items-center justify-center text-[10px] text-[#99918a]">
                  No orders recorded today.
                </p>
              ) : (
                <div className="flex h-40 min-w-[520px] items-end gap-1.5 px-1 sm:gap-2">
                  {hourly.map((item) => (
                    <div
                      key={item.hour}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <span className="text-[8px] tabular-nums text-[#99918a]">
                        {item.count || ''}
                      </span>
                      <div className="flex h-28 w-full items-end">
                        <div
                          className={`w-full rounded-t-[3px] transition-all ${item.count > 0 ? 'bg-[#C8552B]' : 'bg-[#C8552B]/10'}`}
                          style={{
                            height: `${item.count > 0 ? Math.max(5, (item.count / hourMax) * 100) : 2}%`,
                          }}
                          title={`${item.count} orders at ${item.label}`}
                        />
                      </div>
                      <span className="text-[8px] text-[#99918a]">
                        {item.hour % 3 === 0 ? item.label : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {}
          <div className={`${card} min-w-0 p-4 lg:col-span-2`}>
            <CardHeader
              title="Top Selling Products"
              subtitle="Top products by paid sales · last 30 days"
            />

            {dashboardLoading ? (
              <p className="py-8 text-center text-[10px] text-[#99918a]">Loading product sales…</p>
            ) : productSales.length === 0 ? (
              <p className="py-8 text-center text-[10px] text-[#99918a]">
                No paid product sales were found in the last 30 days.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[#f0eeeb]">
                {productSales.map((p, i) => {
                  const pct = (p.units / maxProductUnits) * 100;

                  return (
                    <li key={p.name} className="flex items-center gap-2.5 py-2.5 sm:gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f5f4f2] text-[9px] font-semibold text-[#716960]">
                        {i + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-[#39332e] sm:text-[11px]">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[9px] text-[#99918a]">{p.category}</p>
                      </div>

                      <div className="hidden w-20 shrink-0 sm:block">
                        <div className="h-1 overflow-hidden rounded-full bg-[#ebe8e5]">
                          <div
                            className="h-full rounded-full bg-[#C8552B]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <p className="mt-1 text-[9px] text-[#99918a]">
                          {p.units.toLocaleString('en-NG')} units
                        </p>
                      </div>

                      <div className="w-[68px] shrink-0 text-right sm:w-20">
                        <p className="text-[10px] font-bold text-[#302b27]">
                          {formatNairaFromKobo(p.revenueCents)}
                        </p>

                        <p className="mt-0.5 text-[9px] text-[#99918a]">
                          {p.units.toLocaleString('en-NG')} sold
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {}
          <div className={`${card} min-w-0 p-4 lg:col-span-2`}>
            <CardHeader
              title="Recent Customer Activity"
              subtitle="Latest orders returned by the dashboard API"
            />

            {recentActivity.length === 0 ? (
              <p className="mt-4 text-[10px] text-[#99918a]">
                {dashboardLoading ? 'Loading recent orders...' : 'No recent orders found.'}
              </p>
            ) : (
              <ol className="relative mt-4">
                <span className="absolute bottom-3 left-[13px] top-3 w-px bg-white" aria-hidden />

                {(recentActivity.length ? recentActivity : []).map((a, i) => (
                  <li
                    key={a.initials + i}
                    className="relative flex shadow-xs bg-white border-b border-gray-200 p-4 items-start gap-2.5 pb-3.5 last:pb-0"
                  >
                    <span
                      className={`relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-[3px] ring-white ${a.bg}`}
                    >
                      {a.initials}
                    </span>

                    <div className="min-w-0 pt-0.5">
                      <p className="text-[10px] leading-relaxed text-[#514a44] sm:text-[11px]">
                        <span className="font-semibold text-[#302b27]">{a.title}</span> {a.action}
                      </p>

                      <p className="mt-0.5 break-words text-[9px] text-[#99918a]">{a.meta}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {}
          <div className={`${card} min-w-0 p-4`}>
            <CardHeader
              title="Top Categories"
              subtitle="Paid product revenue share · last 30 days"
            />

            {dashboardLoading ? (
              <p className="py-8 text-center text-[10px] text-[#99918a]">Loading category sales…</p>
            ) : categories.length === 0 ? (
              <p className="py-8 text-center text-[10px] text-[#99918a]">
                No paid category sales were found in the last 30 days.
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:justify-between sm:gap-3">
                <CategoryDonut categories={categories} />

                <ul className="min-w-[125px] flex-1 space-y-2.5">
                  {categories.map((c) => (
                    <li key={c.name} className="flex items-center gap-2 text-[10px]">
                      <span
                        className="size-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: c.color }}
                      />

                      <span className="flex-1 text-[#716960]">{c.name}</span>

                      <span className="font-semibold tabular-nums text-[#39332e]">
                        {c.pct.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
