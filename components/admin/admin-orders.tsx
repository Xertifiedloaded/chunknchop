
'use client';

import { useMemo, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import {
  ArrowDownToLine,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  LoaderCircle,
  MapPin,
  Package,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  UserRoundX,
  Wallet,
  X,
} from 'lucide-react';
import { formatPrice } from '@/lib/catalog';

type AdminOrderItem = {
  name: string;
  quantity: number;
  unit?: string;
  priceCents?: number;
  slug?: string;
};

type AdminOrder = {
  orderNumber: string;
  email: string;
  customerName?: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  createdAt: string;
  riderName?: string;
  riderEmail?: string;
  items?: AdminOrderItem[];
  delivery?: { city?: string; region?: string };
};

type AdminOrdersResponse = { orders: AdminOrder[] };

const statuses = [
  'all',
  'pending',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const statusLabels: Record<string, string> = {
  all: 'All orders',
  pending: 'Pending',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  preparing: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  quality_check: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  packaging: 'bg-stone-100 text-stone-600 ring-stone-500/15',
  ready_for_dispatch: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  out_for_delivery: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/15',
  refunded: 'bg-violet-50 text-violet-700 ring-violet-600/15',
};

const paymentStyles: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  failed: 'bg-red-50 text-red-700 ring-red-600/15',
};

const IN_PROGRESS = [
  'pending',
  'preparing',
  'quality_check',
  'packaging',
  'ready_for_dispatch',
];

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
});

const timeFormatter = new Intl.DateTimeFormat('en-NG', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Africa/Lagos',
});

async function fetchAdminOrders(url: string): Promise<AdminOrdersResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Could not load orders.');
  }

  return result;
}

const formatStatus = (status: string) =>
  statusLabels[status] ?? status.replaceAll('_', ' ');

const getInitials = (email: string) =>
  email.split('@')[0].slice(0, 2).toUpperCase();

const escapeCsv = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

const titleCase = (value: string) =>
  value.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );

const shortRef = (orderNumber: string) =>
  `#${orderNumber.slice(-5).toUpperCase()}`;

function getItemSummary(order: AdminOrder) {
  const items = order.items ?? [];
  const first = items[0];

  if (!first) {
    return { title: 'Order', detail: 'No items listed', extra: 0 };
  }

  const detail = [`Qty ${first.quantity}`, first.unit]
    .filter(Boolean)
    .join(' · ');

  return {
    title: titleCase(first.name),
    detail,
    extra: items.length - 1,
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${
        statusStyles[status] ??
        'bg-stone-100 text-stone-600 ring-stone-500/15'
      }`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {formatStatus(status)}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${
        paymentStyles[status] ??
        'bg-amber-50 text-amber-700 ring-amber-600/15'
      }`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof ShoppingBag;
  tone: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-3.5">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}
      >
        <Icon size={17} strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-stone-500 sm:text-[11px]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-base font-semibold tracking-tight text-stone-900 sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}

function AssignForm({
  order,
  value,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: {
  order: AdminOrder;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const inputId = `rider-${order.orderNumber}`;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-stone-200 bg-white p-3"
    >
      <div>
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[11px] font-medium text-stone-600"
        >
          Rider email
        </label>

        <input
          id={inputId}
          type="email"
          autoComplete="email"
          autoFocus
          maxLength={254}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Registered rider email"
          className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#e86b3e] focus:bg-white focus:ring-2 focus:ring-[#e86b3e]/10"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || order.paymentStatus !== 'paid'}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#e86b3e] px-3 text-xs font-semibold text-white transition hover:bg-[#cf572f] disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Truck size={14} />
          )}
          Confirm
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function OrderCard({
  order,
  formOpen,
  onToggleAssign,
  form,
}: {
  order: AdminOrder;
  formOpen: boolean;
  onToggleAssign: () => void;
  form: React.ReactNode;
}) {
  const { title, detail, extra } = getItemSummary(order);
  const location = [
    order.delivery?.city,
    order.delivery?.region,
  ]
    .filter(Boolean)
    .join(', ');

  const placedAt = new Date(order.createdAt);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)] transition-all duration-200 hover:border-stone-300 hover:shadow-[0_4px_14px_rgba(0,0,0,0.055)]">
      <div className="flex items-start justify-between gap-2.5 p-3.5 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#d75b30]">
            <Package size={19} strokeWidth={1.7} />
          </span>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3
                className="truncate text-[13px] font-semibold text-stone-900"
                title={title}
              >
                {title}
              </h3>

              {extra > 0 && (
                <span className="shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-500">
                  +{extra}
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-[10px] text-stone-500">
              {detail}
              <span className="mx-1.5 text-stone-300">•</span>
              <span className="font-medium tabular-nums">
                {shortRef(order.orderNumber)}
              </span>
            </p>
          </div>
        </div>

        <p className="shrink-0 whitespace-nowrap text-sm font-semibold tracking-tight text-stone-900">
          {formatPrice(order.subtotalCents)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
      </div>

      <div className="mx-3.5 space-y-3 border-t border-stone-100 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-100 text-[10px] font-semibold text-[#c75b32]">
            {getInitials(order.email)}
          </span>

          <div className="min-w-0">
            <p
              className="truncate text-xs font-medium text-stone-800"
              title={order.customerName || order.email}
            >
              {order.customerName || order.email}
            </p>

            {order.customerName && (
              <p className="truncate text-[10px] text-stone-400">
                {order.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2.5 text-[11px] text-stone-500">
          <MapPin size={14} className="shrink-0 text-stone-400" />
          <span className="truncate" title={location || 'No delivery location'}>
            {location || 'No delivery location'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-stone-500">
          <CalendarClock size={14} className="shrink-0 text-stone-400" />
          <span className="truncate">
            {dateFormatter.format(placedAt)} · {timeFormatter.format(placedAt)}
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-stone-100 bg-stone-50/60 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Rider
          </span>

          {order.riderEmail ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-stone-800 text-white">
                <Truck size={11} />
              </span>

              <p
                className="truncate text-[11px] font-medium text-stone-700"
                title={order.riderEmail}
              >
                {order.riderName || order.riderEmail}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleAssign}
              disabled={order.paymentStatus !== 'paid'}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 text-[10px] font-semibold text-[#c75b32] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
            >
              <Truck size={12} />
              Assign rider
            </button>
          )}
        </div>

        {formOpen && !order.riderEmail && form}
      </div>
    </article>
  );
}

export default function AdminOrders() {
  const { data, error, isLoading, mutate } =
    useSWR<AdminOrdersResponse>(
      '/api/admin/orders',
      fetchAdminOrders,
      { refreshInterval: 15_000 },
    );

  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [assignmentOrder, setAssignmentOrder] = useState<string | null>(null);

  const pageSize = 9;

  const orders = useMemo(() => data?.orders ?? [], [data]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
    };

    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    });

    return counts;
  }, [orders]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      inProgress: orders.filter((o) =>
        IN_PROGRESS.includes(o.status),
      ).length,
      needsRider: orders.filter(
        (o) =>
          !o.riderEmail &&
          o.paymentStatus === 'paid' &&
          IN_PROGRESS.includes(o.status),
      ).length,
      revenue: orders
        .filter(
          (o) =>
            o.paymentStatus === 'paid' &&
            o.status !== 'refunded' &&
            o.status !== 'cancelled',
        )
        .reduce((sum, o) => sum + o.subtotalCents, 0),
    }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        activeStatus === 'all' || order.status === activeStatus;

      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        (order.customerName ?? '').toLowerCase().includes(query) ||
        (order.items ?? []).some((item) =>
          item.name.toLowerCase().includes(query),
        ) ||
        (order.delivery?.city ?? '').toLowerCase().includes(query) ||
        (order.riderName ?? '').toLowerCase().includes(query) ||
        (order.riderEmail ?? '').toLowerCase().includes(query);

      const matchesAssignment =
        !showUnassignedOnly || !order.riderEmail;

      return matchesStatus && matchesSearch && matchesAssignment;
    });
  }, [orders, activeStatus, search, showUnassignedOnly]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const rangeStart =
    filteredOrders.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const rangeEnd = Math.min(
    currentPage * pageSize,
    filteredOrders.length,
  );

  function changeStatus(status: string) {
    setActiveStatus(status);
    setPage(1);
  }

  function toggleAssignment(orderNumber: string) {
    setAssignmentOrder((current) =>
      current === orderNumber ? null : orderNumber,
    );
  }

  function jumpToFirstUnassigned() {
    const target = orders.find(
      (o) => !o.riderEmail && o.paymentStatus === 'paid',
    );

    if (!target) {
      setMessage('There are no unassigned paid orders available.');
      return;
    }

    setActiveStatus('all');
    setSearch('');
    setShowUnassignedOnly(true);
    setPage(1);
    setAssignmentOrder(target.orderNumber);
  }

  function exportOrders() {
    const headers = [
      'Order Number',
      'Items',
      'Customer',
      'Customer Email',
      'Date',
      'Status',
      'Payment Status',
      'Delivery City',
      'Delivery Region',
      'Rider',
      'Rider Email',
      'Subtotal (Kobo)',
    ];

    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      (order.items ?? [])
        .map((i) => `${i.name} x${i.quantity}`)
        .join('; '),
      order.customerName ?? '',
      order.email,
      order.createdAt,
      order.status,
      order.paymentStatus,
      order.delivery?.city ?? '',
      order.delivery?.region ?? '',
      order.riderName ?? '',
      order.riderEmail ?? '',
      order.subtotalCents,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'chunknchop-orders.csv';
    link.click();

    URL.revokeObjectURL(url);
  }

  async function assignRider(
    event: FormEvent<HTMLFormElement>,
    orderNumber: string,
  ) {
    event.preventDefault();

    const email = emails[orderNumber]?.trim();

    if (!email) return;

    setBusyOrder(orderNumber);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderNumber)}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || 'Could not assign this rider.',
        );
      }

      setMessage(
        `Rider ${result.rider.name || result.rider.email} assigned to ${shortRef(orderNumber)}.`,
      );

      setEmails((current) => ({
        ...current,
        [orderNumber]: '',
      }));

      setAssignmentOrder(null);
      await mutate();
    } catch (assignError) {
      setMessage(
        assignError instanceof Error
          ? assignError.message
          : 'Could not assign this rider.',
      );
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <section
      className="min-w-0 space-y-5 text-stone-800 sm:space-y-6"
      aria-labelledby="admin-orders-title"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1
            id="admin-orders-title"
            className="text-xl font-semibold tracking-tight text-stone-900 sm:text-[22px]"
          >
            Orders
          </h1>

          <p className="mt-1 text-xs text-stone-500 sm:text-[13px]">
            Manage customer orders, payments and deliveries.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={exportOrders}
            disabled={filteredOrders.length === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownToLine size={14} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={jumpToFirstUnassigned}
            className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#e86b3e] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#cf572f]"
          >
            <Truck size={14} />
            Assign riders
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="Total orders"
          value={stats.total}
          icon={ShoppingBag}
          tone="bg-stone-100 text-stone-700"
        />

        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={Clock}
          tone="bg-amber-50 text-amber-700"
        />

        <StatCard
          label="Needs rider"
          value={stats.needsRider}
          icon={UserRoundX}
          tone="bg-rose-50 text-rose-700"
        />

        <StatCard
          label="Paid revenue"
          value={formatPrice(stats.revenue)}
          icon={Wallet}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* Feedback */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-900"
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Dismiss message"
            className="shrink-0 text-orange-700 hover:text-orange-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search order, customer, city or rider..."
              className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-xs text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#e86b3e] focus:ring-2 focus:ring-[#e86b3e]/10"
            />
          </div>

          <button
            type="button"
            aria-pressed={showUnassignedOnly}
            onClick={() => {
              setShowUnassignedOnly((current) => !current);
              setPage(1);
            }}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium shadow-sm transition ${
              showUnassignedOnly
                ? 'border-[#e86b3e] bg-orange-50 text-[#d75b30]'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Filter size={14} />
            Unassigned only
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statuses.map((status) => {
            const active = activeStatus === status;

            return (
              <button
                type="button"
                key={status}
                onClick={() => changeStatus(status)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition sm:px-3.5 ${
                  active
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                {formatStatus(status)}

                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] tabular-nums ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {statusCounts[status] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-500">
          <LoaderCircle
            size={17}
            className="animate-spin text-[#e86b3e]"
          />
          Loading orders...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
          {error.message}
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-5 text-center">
          <PackageCheck size={28} className="mb-3 text-stone-300" />

          <p className="text-xs font-semibold text-stone-800">
            No orders found
          </p>

          <p className="mt-1 text-[11px] text-stone-500">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.orderNumber}
              order={order}
              formOpen={assignmentOrder === order.orderNumber}
              onToggleAssign={() =>
                toggleAssignment(order.orderNumber)
              }
              form={
                <AssignForm
                  order={order}
                  value={emails[order.orderNumber] ?? ''}
                  busy={busyOrder === order.orderNumber}
                  onChange={(value) =>
                    setEmails((current) => ({
                      ...current,
                      [order.orderNumber]: value,
                    }))
                  }
                  onSubmit={(event) =>
                    void assignRider(event, order.orderNumber)
                  }
                  onCancel={() => setAssignmentOrder(null)}
                />
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-stone-500">
          Showing{' '}
          <span className="font-semibold text-stone-800">
            {rangeStart}–{rangeEnd}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-stone-800">
            {filteredOrders.length}
          </span>{' '}
          orders
        </p>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-[11px] font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
          >
            <ChevronLeft size={13} />
            Previous
          </button>

          <span className="whitespace-nowrap px-1 text-[11px] text-stone-500">
            Page{' '}
            <span className="font-semibold text-stone-800">
              {currentPage}
            </span>{' '}
            of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-[11px] font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
