"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChefHat,
  ChevronDown,
  CircleCheck,
  Clock3,
  Download,
  Inbox,
  Package,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { fetchWithAuth } from "@/lib/fetchClient";
import type { Order } from "@/components/admin/types";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const nairaFormatter = (fractionDigits: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: fractionDigits,
  });

const NAIRA_WHOLE = nairaFormatter(0);
const NAIRA_DECIMAL = nairaFormatter(2);

const naira = (value: number) =>
  (value % 1 === 0 ? NAIRA_WHOLE : NAIRA_DECIMAL).format(value);

const relativeTime = (value: string | Date) => {
  const date = new Date(value);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return date.toLocaleDateString();
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const CARD =
  "rounded-xl border border-[#e8e8e6] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.035)]";

const AVATAR_COLORS = [
  "bg-[#f26422]",
  "bg-[#20b87a]",
  "bg-[#ef4444]",
  "bg-[#742b43]",
  "bg-[#f5a623]",
  "bg-[#ef7045]",
];

const STATUS_COPY: Record<string, string> = {
  PENDING: "placed an order",
  PROCESSING: "order is being processed",
  PAID: "completed payment",
  SHIPPED: "order shipped",
  DELIVERED: "order delivered",
  CANCELLED: "cancelled an order",
  REFUNDED: "requested a refund",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKLY_SERIES: ChartSeries[] = [
  {
    name: "This week",
    color: "#f26422",
    area: true,
    data: [182000, 241000, 198000, 312000, 276000, 389000, 342000],
  },
  {
    name: "Last week",
    color: "#b8b8b8",
    dashed: true,
    data: [165000, 205000, 214000, 258000, 249000, 301000, 296000],
  },
];

const HOUR_LABELS = ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"];
const HOURLY_SERIES: ChartSeries[] = [
  {
    name: "Delivered",
    color: "#f15b2a",
    area: true,
    data: [14, 22, 35, 28, 31, 42, 26],
  },
  { name: "Late", color: "#e99b00", data: [1, 2, 4, 3, 3, 5, 2] },
];

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const STATUS_CARDS = [
  { label: "Pending", value: "18", icon: Clock3, color: "text-[#f59a23]" },
  { label: "Preparing", value: "12", icon: ChefHat, color: "text-[#ee542f]" },
  { label: "Out for Delivery", value: "27", icon: Truck, color: "text-[#138bd0]" },
  { label: "Delivered", value: "137", icon: CircleCheck, color: "text-[#0ca66a]" },
];

const QUICK_ACTIONS = [
  { label: "Add Product", icon: Plus },
  { label: "Create Coupon", icon: Tag },
  { label: "View Orders", icon: ShoppingCart },
  { label: "Add Inventory", icon: Package },
  { label: "Send Promotion", icon: Send },
];

const CATEGORIES = [
  { name: "Beef", share: 32, color: "#7d3038" },
  { name: "Chicken", share: 26, color: "#f26422" },
  { name: "Seafood", share: 16, color: "#b5b2a8" },
  { name: "Goat", share: 11, color: "#8f8b82" },
  { name: "Sausages", share: 9, color: "#d7a067" },
  { name: "Other", share: 6, color: "#d8d8d8" },
];

const CATEGORY_GRADIENT = (() => {
  let start = 0;
  const stops = CATEGORIES.map(({ share, color }) => {
    const end = start + share * 3.6;
    const stop = `${color} ${start}deg ${end}deg`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
})();

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState<{ greeting: string; today: string } | null>(
    null,
  );

  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.trim().split(/\s+/)[0] || null;

  useEffect(() => {
    setClock({
      greeting: getGreeting(),
      today: new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithAuth("/api/admin/stats");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load dashboard stats.");
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Could not load dashboard stats.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const { totalOrders, totalRevenue, totalCustomers, totalProducts, recentOrders } =
    useMemo(
      () => ({
        totalOrders: stats?.totalOrders ?? 0,
        totalRevenue: stats?.totalRevenue ?? 0,
        totalCustomers: stats?.totalCustomers ?? 0,
        totalProducts: stats?.totalProducts ?? 0,
        recentOrders: stats?.recentOrders ?? [],
      }),
      [stats],
    );

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const display = (value: string) => (loading ? "—" : value);

  return (
    <main className={`${inter.className} min-h-screen bg-[#f7f7f6] px-3 py-4 text-[#202020] sm:px-5 lg:px-6`}>
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-[#1a1a1a] sm:text-xl">
              {clock?.greeting ?? "Welcome"}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-xs leading-5 text-[#8d8d8d]">
              {clock?.today ?? "\u00A0"} · Here&apos;s how ChunkNChop is
              performing across processing, fulfilment and sales today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-[#dedede] bg-white px-3 text-xs font-medium text-[#555] shadow-sm"
            >
              <CalendarDays size={14} />
              Today
              <ChevronDown size={12} />
            </button>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-[#dedede] bg-white px-3 text-xs font-medium text-[#555] shadow-sm"
            >
              <Download size={14} />
              Export
            </button>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg bg-[#f26422] px-3 text-xs font-medium text-white shadow-sm"
            >
              <Clock3 size={14} />
              Open Processing
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={display(naira(totalRevenue))}
            icon={<Wallet size={14} />}
            iconClass="bg-[#fff0e9] text-[#f26422]"
            change="+12.4%"
            description="vs last month"
          />
          <MetricCard
            title="Total Orders"
            value={display(totalOrders.toLocaleString())}
            icon={<ShoppingBag size={14} />}
            iconClass="bg-[#fff0e9] text-[#a63e21]"
            change="+8.6%"
            description="vs last month"
          />
          <MetricCard
            title="Average Order Value"
            value={display(naira(avgOrderValue))}
            icon={<ArrowUpRight size={14} />}
            iconClass="bg-[#eafaf3] text-[#0d9b62]"
            change="+5.1%"
            description="Basket size"
          />
          <MetricCard
            title="Total Customers"
            value={display(totalCustomers.toLocaleString())}
            icon={<RefreshCw size={14} />}
            iconClass="bg-[#f0efed] text-[#666]"
            change="+6.4%"
            description={`${totalProducts} active products`}
          />
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATUS_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`${CARD} px-4 py-3`}>
              <div className={`flex items-center gap-1.5 text-xs ${color}`}>
                <Icon size={14} className="shrink-0" />
                <span className="truncate text-[#555]">{label}</span>
              </div>
              <div className={`mt-1 text-lg font-semibold ${color}`}>{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className={CARD}>
            <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div>
                <h2 className="text-sm font-semibold">Weekly Revenue</h2>
                <p className="mt-0.5 text-xs text-[#777]">
                  Gross revenue this week compared with the same days last week
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[11px] text-[#888]">
                <LegendDot color="bg-[#f26422]" label="This week" />
                <LegendDot color="bg-[#b8b8b8]" label="Last week" />
              </div>
            </div>

            <div className="px-3 pb-3 pt-4 sm:px-4">
              <LineChart
                labels={DAYS}
                series={WEEKLY_SERIES}
                height={200}
                formatValue={naira}
                formatAxis={(v) => `₦${compact.format(v)}`}
              />
            </div>

            <div className="grid grid-cols-1 border-t border-[#eeeeee] sm:grid-cols-3">
              <RevenueStat
                label="Weekly sales"
                value={display(naira(totalRevenue))}
                change="+12.8%"
              />
              <RevenueStat
                label="Orders this week"
                value={display(totalOrders.toLocaleString())}
                change="+9.4%"
                bordered
              />
              <RevenueStat label="Refund rate" value="1.2%" change="-0.4%" bordered />
            </div>
          </div>

          <QuickActions />
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.8fr)]">
          <div className={`${CARD} p-4`}>
            <h3 className="text-sm font-semibold text-[#2f2b28]">Orders by hour</h3>
            <p className="mt-0.5 text-xs text-[#99938d]">
              Delivered vs late, last 7 days
            </p>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-[#888]">
              <LegendDot color="bg-[#f15b2a]" label="Delivered" />
              <LegendDot color="bg-[#e99b00]" label="Late" />
            </div>

            <div className="mt-2">
              <LineChart
                labels={HOUR_LABELS}
                series={HOURLY_SERIES}
                height={170}
                formatValue={(v) => `${v} orders`}
                formatAxis={(v) => String(v)}
              />
            </div>
          </div>

          <RecentOrdersPanel orders={recentOrders} loading={loading} />
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <RecentActivity orders={recentOrders} loading={loading} />
          <TopCategories />
        </section>
      </div>
    </main>
  );
}

interface ChartSeries {
  name: string;
  color: string;
  data: number[];
  dashed?: boolean;
  area?: boolean;
}

const CHART_PAD = { top: 12, right: 12, bottom: 26, left: 40 };
const GRID_LINES = 4;

function niceStep(value: number) {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";

  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }

  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  }
  t[n - 1] = m[n - 2];

  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }

  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const k = dx[i] / 3;
    d += ` C${x0 + k},${y0 + t[i] * k} ${x1 - k},${y1 - t[i + 1] * k} ${x1},${y1}`;
  }
  return d;
}

function LineChart({
  labels,
  series,
  height,
  formatValue,
  formatAxis,
}: {
  labels: string[];
  series: ChartSeries[];
  height: number;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { top, right, bottom, left } = CHART_PAD;
  const innerW = Math.max(width - left - right, 0);
  const innerH = height - top - bottom;
  const count = labels.length;

  const step = niceStep(
    Math.max(...series.flatMap((s) => s.data), 1) / GRID_LINES,
  );
  const yMax = step * GRID_LINES;

  const x = (i: number) => left + (count > 1 ? (i / (count - 1)) * innerW : 0);
  const y = (v: number) => top + (1 - v / yMax) * innerH;

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
        const line = smoothPath(pts);
        const area = `${line} L${x(count - 1)},${top + innerH} L${x(0)},${top + innerH} Z`;
        return { line, area };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, width, height],
  );

  const handlePointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const ratio = innerW > 0 ? (px - left) / innerW : 0;
    const idx = Math.round(Math.min(Math.max(ratio, 0), 1) * (count - 1));
    setActive(idx);
  };

  const tooltipLeft =
    active !== null ? Math.min(Math.max(x(active), 70), width - 70) : 0;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="touch-pan-y select-none"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
          role="img"
          aria-label={series.map((s) => s.name).join(" vs ")}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient
                key={s.name}
                id={`${uid}-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
            const value = step * i;
            return (
              <g key={i}>
                <line
                  x1={left}
                  x2={left + innerW}
                  y1={y(value)}
                  y2={y(value)}
                  stroke="#efefed"
                  strokeDasharray={i === 0 ? undefined : "3 4"}
                />
                <text
                  x={left - 8}
                  y={y(value)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="#9a9a9a"
                >
                  {formatAxis(value)}
                </text>
              </g>
            );
          })}

          {labels.map((label, i) => (
            <text
              key={label}
              x={x(i)}
              y={height - 8}
              textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}
              fontSize={11}
              fill="#9a9a9a"
            >
              {label}
            </text>
          ))}

          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={top}
              y2={top + innerH}
              stroke="#d6d6d3"
              strokeDasharray="3 3"
            />
          )}

          {series.map((s, i) => (
            <g key={s.name}>
              {s.area && <path d={paths[i].area} fill={`url(#${uid}-${i})`} />}
              <path
                d={paths[i].line}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={s.dashed ? "5 4" : undefined}
              />
              {active !== null && (
                <circle
                  cx={x(active)}
                  cy={y(s.data[active])}
                  r={4}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                />
              )}
            </g>
          ))}
        </svg>
      )}

      {active !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 min-w-[8rem] -translate-x-1/2 rounded-lg border border-[#e8e8e6] bg-white px-2.5 py-2 text-[11px] shadow-md"
          style={{ left: tooltipLeft, top: 0 }}
        >
          <p className="mb-1 font-medium text-[#444]">{labels[active]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[#777]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
              <span className="font-semibold tabular-nums text-[#222]">
                {formatValue(s.data[active])}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon,
  iconClass,
  change,
  description,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClass: string;
  change: string;
  description: string;
}) {
  const positive = !change.startsWith("-");

  return (
    <div className={`${CARD} min-h-20 px-3.5 py-3`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-[#666]">{title}</span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-1 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
        {value}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px]">
        <span
          className={`font-semibold ${positive ? "text-[#0a9a5c]" : "text-[#e33e3e]"}`}
        >
          {change}
        </span>
        <span className="text-[#a0a0a0]">{description}</span>
      </div>
    </div>
  );
}

function RevenueStat({
  label,
  value,
  change,
  bordered,
}: {
  label: string;
  value: string;
  change: string;
  bordered?: boolean;
}) {
  const positive = !change.startsWith("-");

  return (
    <div
      className={`px-4 py-3 ${
        bordered
          ? "border-t border-[#eeeeee] sm:border-t-0 sm:border-l"
          : ""
      }`}
    >
      <p className="text-xs text-[#888]">{label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold">{value}</span>
        <span
          className={`text-[11px] font-semibold ${positive ? "text-[#0a9a5c]" : "text-[#e33e3e]"}`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className={`${CARD} p-4`}>
      <h2 className="text-sm font-semibold">Quick Actions</h2>
      <p className="mt-0.5 text-xs text-[#777]">Common operations tasks</p>

      <div className="mt-3 space-y-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="group flex h-9 w-full items-center justify-between rounded-lg border border-[#eeeeee] bg-white px-3 text-left transition hover:border-[#f5b69a] hover:bg-[#fffaf7]"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#fff1ea] text-[#f26422]">
                <Icon size={12} />
              </span>
              <span className="text-xs font-medium text-[#555]">{label}</span>
            </span>
            <ArrowRight
              size={12}
              className="text-[#aaa] transition group-hover:translate-x-0.5"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonRows({ count, height }: { count: number; height: string }) {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${height} w-full animate-pulse rounded bg-[#f2f2f0]`}
        />
      ))}
    </div>
  );
}

function RecentOrdersPanel({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Recent Orders</h2>
          <p className="mt-0.5 text-xs text-[#777]">
            Latest customer activity across the storefront
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="shrink-0 text-xs font-medium text-[#f26422]"
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <SkeletonRows count={4} height="h-8" />
      ) : !orders.length ? (
        <div className="py-8 text-center">
          <Inbox className="mx-auto text-[#ccc]" size={20} />
          <p className="mt-2 text-xs font-medium text-[#555]">No orders yet</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-[#f2f2f0]">
          {orders.map((order, index) => (
            <li
              key={order.id}
              className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 py-2.5 sm:grid-cols-[24px_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f5f4] text-[11px] font-semibold text-[#888]">
                {index + 1}
              </span>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{order.customerName}</p>
                <p className="truncate text-[11px] text-[#aaa]">{order.id}</p>
              </div>

              <p className="hidden truncate text-[11px] text-[#888] sm:block">
                {order.status}
              </p>

              <div className="text-right">
                <p className="text-xs font-semibold">{naira(order.total)}</p>
                <p className="text-[11px] text-[#aaa]">
                  {relativeTime(order.createdAt as unknown as string)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentActivity({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <h2 className="text-sm font-semibold">Recent Customer Activity</h2>
      <p className="mt-0.5 text-xs text-[#777]">
        Live feed across storefront and support
      </p>

      {loading ? (
        <SkeletonRows count={4} height="h-8" />
      ) : !orders.length ? (
        <p className="mt-3 text-xs text-[#aaa]">No recent activity.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {orders.slice(0, 6).map((order, i) => (
            <li key={order.id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {order.customerName?.charAt(0).toUpperCase() ?? "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-[#444]">
                  <span className="font-medium">{order.customerName}</span>{" "}
                  {STATUS_COPY[order.status] ?? "updated an order"}
                </p>
                <p className="truncate text-[11px] text-[#aaa]">
                  {order.id} · {naira(order.total)} ·{" "}
                  {relativeTime(order.createdAt as unknown as string)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopCategories() {
  return (
    <div className={`${CARD} p-4`}>
      <h2 className="text-sm font-semibold">Top Categories</h2>
      <p className="mt-0.5 text-xs text-[#777]">Revenue share, last 30 days</p>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <div
          className="relative h-24 w-24 shrink-0 rounded-full"
          style={{ background: CATEGORY_GRADIENT }}
        >
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white">
            <div className="text-center leading-tight">
              <p className="text-sm font-semibold">100%</p>
              <p className="text-[11px] text-[#777]">Revenue</p>
            </div>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-2">
          {CATEGORIES.map(({ name, share, color }) => (
            <li key={name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs text-[#555]">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{ backgroundColor: color }}
                />
                {name}
              </span>
              <span className="text-xs font-semibold">{share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}