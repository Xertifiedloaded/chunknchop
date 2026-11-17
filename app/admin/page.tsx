
import type { ReactNode } from 'react';
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

const BRAND = '#C8552B';

const card =
  'rounded-xl border border-[#eceae7] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.035)]';

const kpis = [
  {
    label: "Today's Revenue",
    value: '₦3,842,500',
    delta: '14.2%',
    up: true,
    note: 'vs ₦3.36M yesterday',
    icon: Banknote,
    tile: 'bg-orange-50 text-[#C8552B]',
    accent: true,
  },
  {
    label: "Today's Orders",
    value: '194',
    delta: '8.6%',
    up: true,
    note: '32 in the last hour',
    icon: ShoppingBag,
    tile: 'bg-rose-50 text-[#7A2434]',
  },
  {
    label: 'Average Order Value',
    value: '₦19,806',
    delta: '5.1%',
    up: true,
    note: 'Basket size up on beef',
    icon: TrendingUp,
    tile: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Monthly Revenue',
    value: '₦74.2M',
    delta: '2.4%',
    up: false,
    note: '',
    icon: Repeat,
    tile: 'bg-gray-100 text-gray-600',
  },
];

const statuses = [
  { label: 'Pending', value: 18, icon: Clock, color: 'text-[#B45F10]' },
  { label: 'Preparing', value: 12, icon: ChefHat, color: 'text-[#C8552B]' },
  { label: 'Out for Delivery', value: 27, icon: Truck, color: 'text-[#2F6FC4]' },
  { label: 'Delivered', value: 137, icon: CircleCheck, color: 'text-[#2E8B57]' },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const thisWeek = [2.1, 2.6, 2.4, 3.1, 3.4, 2.8, 3.84];
const lastWeek = [1.9, 2.2, 2.5, 2.7, 2.9, 2.6, 3.36];

const weeklyStats = [
  { label: 'Weekly sales', value: '₦18,240,000', delta: '+12.8%', up: true },
  { label: 'Orders this week', value: '935', delta: '+9.4%', up: true },
  { label: 'Refund rate', value: '1.2%', delta: '-0.4%', up: true },
];

const quickActions = [
  { label: 'Add Product', icon: Package },
  { label: 'Create Coupon', icon: Ticket },
  { label: 'View Orders', icon: ShoppingBag },
  { label: 'Add Inventory', icon: Boxes },
  { label: 'Send Promotion', icon: Send },
];

const hourly = [
  { h: '6a', v: 4 },
  { h: '7a', v: 9 },
  { h: '8a', v: 15 },
  { h: '9a', v: 22 },
  { h: '10a', v: 28 },
  { h: '11a', v: 24 },
  { h: '12p', v: 31 },
  { h: '1p', v: 32 },
];

const topProducts = [
  { name: 'Free-Range Chicken Breast', cat: 'Chicken', units: 2416, revenue: '₦30.9M', delta: '12.4', up: true },
  { name: 'Signature Beef Sausages', cat: 'Sausages', units: 1876, revenue: '₦18.4M', delta: '8.1', up: true },
  { name: 'Grass-Fed Ribeye Steak', cat: 'Beef', units: 1284, revenue: '₦37.1M', delta: '18.6', up: true },
  { name: 'Goat Meat Stew Cuts', cat: 'Goat', units: 1041, revenue: '₦19.7M', delta: '3.2', up: false },
  { name: 'Atlantic King Prawns', cat: 'Seafood', units: 684, revenue: '₦15.0M', delta: '5.7', up: true },
];

const activity = [
  { initials: 'AO', bg: 'bg-[#C8552B]', title: 'Adaeze Okonkwo', action: 'placed an order', meta: 'CNC-20481 · ₦86,400 · 2 min ago' },
  { initials: 'TB', bg: 'bg-[#6CC06A]', title: 'Tunde Bakare', action: 'completed payment', meta: 'Paystack · ₦142,000 · 9 min ago' },
  { initials: 'ZY', bg: 'bg-[#D4474B]', title: 'Zainab Yusuf', action: 'requested a refund', meta: 'CNC-20455 · cold-chain delay · 24 min ago' },
  { initials: 'CN', bg: 'bg-[#5A1F2B]', title: 'Chidi Nwosu', action: 'subscribed to Weekly Protein Box', meta: '₦58,000 / week · 41 min ago' },
  { initials: 'FB', bg: 'bg-[#E3A126]', title: 'Fatima Bello', action: 'left a 5-star review', meta: 'Grass-fed Ribeye · 1 hr ago' },
  { initials: 'EO', bg: 'bg-[#D2582F]', title: 'Emeka Obi', action: 'redeemed CHOP20', meta: 'Saved ₦12,300 · 2 hr ago' },
];

const categories = [
  { name: 'Beef', pct: 32, color: '#6B2230' },
  { name: 'Chicken', pct: 26, color: '#D2582F' },
  { name: 'Seafood', pct: 16, color: '#E3A126' },
  { name: 'Goat', pct: 11, color: '#E08A3C' },
  { name: 'Sausages', pct: 9, color: '#6CC06A' },
  { name: 'Other', pct: 6, color: '#D4D4D8' },
];

function Delta({ value, up }: { value: string; up: boolean }) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[9px] font-semibold leading-none ${
        up
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-red-50 text-red-600'
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
        <h2 className="text-[12px] font-semibold tracking-tight text-[#302b27]">
          {title}
        </h2>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[#99918a]">
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

function WeeklyChart() {
  const W = 600;
  const H = 155;
  const padX = 12;
  const padTop = 10;
  const padBottom = 22;
  const max = 4;

  const x = (i: number) =>
    padX + (i * (W - padX * 2)) / (weekDays.length - 1);

  const y = (v: number) =>
    padTop + (1 - v / max) * (H - padTop - padBottom);

  const line = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');

  const area = `${line(thisWeek)} L${x(thisWeek.length - 1)},${H - padBottom} L${x(0)},${H - padBottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Weekly revenue, this week versus last week"
    >
      <defs>
        <linearGradient id="wk-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.14" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((g) => {
        const gy = padTop + (g * (H - padTop - padBottom)) / 3;

        return (
          <line
            key={g}
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
        d={line(lastWeek)}
        fill="none"
        stroke="#D4D4D8"
        strokeWidth="2"
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />

      <path
        d={line(thisWeek)}
        fill="none"
        stroke={BRAND}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {weekDays.map((d, i) => (
        <text
          key={d}
          x={x(i)}
          y={H - 5}
          textAnchor="middle"
          fontSize="10"
          fill="#9CA3AF"
        >
          {d}
        </text>
      ))}
    </svg>
  );
}

function CategoryDonut() {
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
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="#F3F4F6"
        strokeWidth="15"
      />

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
            strokeDasharray={`${len - 2} ${c - len + 2}`}
            strokeDashoffset={-offset}
          />
        );

        offset += len;
        return element;
      })}
    </svg>
  );
}

export default function DashboardOverview({
  name = 'Chidera',
}: {
  name?: string;
}) {
  const hourMax = Math.max(...hourly.map((h) => h.v));

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-3 py-4 font-sans text-[#302b27] sm:px-4 sm:py-5 lg:px-5 lg:py-5 xl:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">

        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-[#302b27] sm:text-xl">
              Good morning, {name}
            </h1>

            <p className="mt-1 max-w-[480px] text-[10px] leading-[1.7] text-[#918980] sm:text-[11px]">
              Friday, 7 August 2026 · Here&apos;s how ChunkNChop is performing
              across processing, fulfilment and sales today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#eae6e1] bg-white px-2.5 text-[10px] font-medium text-[#514a44] shadow-sm transition hover:bg-gray-50 sm:h-9 sm:px-3"
            >
              <Calendar size={13} className="text-[#918980]" />
              Today · Aug 7
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

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;

            return (
              <div
                key={k.label}
                className={`${card} relative overflow-hidden p-3.5 sm:p-4`}
              >
                {k.accent && (
                  <span className="absolute inset-x-0 top-0 h-[2px] bg-[#C8552B]" />
                )}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-medium text-[#898078]">
                    {k.label}
                  </p>

                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${k.tile}`}>
                    <Icon size={15} />
                  </span>
                </div>

                <p className="mt-3 text-xl font-bold leading-none tracking-tight text-[#302b27] sm:text-[22px]">
                  {k.value}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Delta value={k.delta} up={k.up} />

                  {k.note && (
                    <span className="text-[9px] text-[#99918a]">
                      {k.note}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Order statuses */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statuses.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.label}
                className={`${card} px-3.5 py-3 sm:px-4`}
              >
                <p className={`flex items-center gap-1.5 text-[10px] font-medium ${s.color}`}>
                  <Icon size={12} />
                  {s.label}
                </p>

                <p className={`mt-1.5 text-lg font-bold leading-none ${s.color}`}>
                  {s.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* Weekly revenue and quick actions */}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">

          {/* Weekly revenue */}
          <div className={`${card} flex min-w-0 flex-col overflow-hidden lg:col-span-2`}>
            <div className="p-4 pb-0">
              <CardHeader
                title="Weekly Revenue"
                subtitle="Gross revenue compared with the same days last week"
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

            <div className="h-40 min-w-0 flex-1 px-3 pb-2 pt-4 sm:h-44 sm:px-4">
              <WeeklyChart />
            </div>

            <div className="grid grid-cols-1 divide-y divide-[#f0eeeb] border-t border-[#f0eeeb] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {weeklyStats.map((s) => (
                <div key={s.label} className="px-4 py-3">
                  <p className="text-[9px] font-medium text-[#918980]">
                    {s.label}
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#302b27]">
                      {s.value}
                    </span>

                    <span className={`text-[9px] font-semibold ${s.up ? 'text-emerald-600' : 'text-red-600'}`}>
                      {s.delta}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className={`${card} min-w-0 p-4`}>
            <CardHeader
              title="Quick Actions"
              subtitle="Common operations tasks"
            />

            <ul className="mt-3 space-y-1.5">
              {quickActions.map((a) => {
                const Icon = a.icon;

                return (
                  <li key={a.label}>
                    <button
                      type="button"
                      className="group flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-[#eeeae6] px-2.5 py-2 text-left transition hover:border-[#e8c5b7] hover:bg-[#fffaf7]"
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

        {/* Hourly orders and products */}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">

          {/* Orders by hour */}
          <div className={`${card} flex min-w-0 flex-col p-4`}>
            <CardHeader
              title="Orders by Hour"
              subtitle="Live order intake across today"
            />

            <div className="mt-4 flex min-h-40 flex-1 items-end gap-1.5 sm:gap-2">
              {hourly.map((b, i) => (
                <div
                  key={b.h}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex h-32 w-full items-end">
                    <div
                      className={`w-full rounded-t-[3px] transition-all ${
                        i === hourly.length - 1
                          ? 'bg-[#C8552B]'
                          : 'bg-[#C8552B]/25'
                      }`}
                      style={{ height: `${(b.v / hourMax) * 100}%` }}
                      title={`${b.v} orders`}
                    />
                  </div>

                  <span className="text-[9px] text-[#99918a]">
                    {b.h}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top products */}
          <div className={`${card} min-w-0 p-4 lg:col-span-2`}>
            <CardHeader
              title="Top Selling Products"
              subtitle="Ranked by units sold over the last 30 days"
              right={
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#C8552B] hover:underline"
                >
                  View all <ArrowRight size={12} />
                </a>
              }
            />

            <ul className="mt-3 divide-y divide-[#f0eeeb]">
              {topProducts.map((p, i) => {
                const pct = (p.units / topProducts[0].units) * 100;
                const Trend = p.up ? ArrowUpRight : ArrowDownRight;

                return (
                  <li
                    key={p.name}
                    className="flex items-center gap-2.5 py-2.5 sm:gap-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f5f4f2] text-[9px] font-semibold text-[#716960]">
                      {i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-[#39332e] sm:text-[11px]">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#99918a]">
                        {p.cat}
                      </p>
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
                        {p.revenue}
                      </p>

                      <p className={`mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-semibold ${p.up ? 'text-emerald-600' : 'text-red-600'}`}>
                        <Trend size={10} />
                        {p.delta}%
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Customer activity and categories */}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">

          {/* Activity */}
          <div className={`${card} min-w-0 p-4 lg:col-span-2`}>
            <CardHeader
              title="Recent Customer Activity"
              subtitle="Live feed across storefront and support"
            />

            <ol className="relative mt-4">
              <span
                className="absolute bottom-3 left-[13px] top-3 w-px bg-[#eeeae6]"
                aria-hidden
              />

              {activity.map((a, i) => (
                <li
                  key={a.initials + i}
                  className="relative flex items-start gap-2.5 pb-3.5 last:pb-0"
                >
                  <span
                    className={`relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-[3px] ring-white ${a.bg}`}
                  >
                    {a.initials}
                  </span>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-[10px] leading-relaxed text-[#514a44] sm:text-[11px]">
                      <span className="font-semibold text-[#302b27]">
                        {a.title}
                      </span>{' '}
                      {a.action}
                    </p>

                    <p className="mt-0.5 break-words text-[9px] text-[#99918a]">
                      {a.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Categories */}
          <div className={`${card} min-w-0 p-4`}>
            <CardHeader
              title="Top Categories"
              subtitle="Revenue share, last 30 days"
            />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:justify-between sm:gap-3">
              <CategoryDonut />

              <ul className="min-w-[125px] flex-1 space-y-2.5">
                {categories.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: c.color }}
                    />

                    <span className="flex-1 text-[#716960]">
                      {c.name}
                    </span>

                    <span className="font-semibold tabular-nums text-[#39332e]">
                      {c.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
