'use client';

import { useMemo, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
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
  Search,
  ShoppingBag,
  Truck,
  UserRoundX,
  Wallet,
  X,
  Check,
} from 'lucide-react';
import { formatPrice } from '@/lib/catalog';

type AdminOrderItem = {
  name: string;
  quantity: number;
  unit?: string;
  priceCents?: number;
  slug?: string;
  imageUrl?: string | null;
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
  delivery?: {
    city?: string;
    region?: string;
  };
};

type AdminOrdersResponse = {
  orders: AdminOrder[];
};

const statuses = [
  'all',
  'paid',
  'pending',
  'assigned',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

type StatusFilter = (typeof statuses)[number];

const statusLabels: Record<StatusFilter, string> = {
  all: 'All',
  paid: 'Paid',
  pending: 'Pending',
  assigned: 'Assigned',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  preparing: 'bg-orange-50 text-orange-700',
  quality_check: 'bg-rose-50 text-rose-700',
  packaging: 'bg-stone-100 text-stone-600',
  ready_for_dispatch: 'bg-sky-50 text-sky-700',
  assigned: 'bg-violet-50 text-violet-700',
  out_for_delivery: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
  refunded: 'bg-violet-50 text-violet-700',
};

const paymentStyles: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
  unpaid: 'bg-amber-50 text-amber-700',
  refunded: 'bg-violet-50 text-violet-700',
};

const IN_PROGRESS = ['pending', 'preparing', 'quality_check', 'packaging', 'ready_for_dispatch'];

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
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'include',
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Could not load orders.');
  }

  return {
    orders: Array.isArray(result?.orders) ? result.orders : [],
  };
}

const formatStatus = (status: string) =>
  statusLabels[status as StatusFilter] ?? status.replaceAll('_', ' ');

const getInitials = (email: string) => (email.split('@')[0] || 'CU').slice(0, 2).toUpperCase();

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const titleCase = (value: string) =>
  value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const shortRef = (orderNumber: string) => `#${orderNumber.slice(-5).toUpperCase()}`;

function getItemSummary(order: AdminOrder) {
  const items = order.items ?? [];
  const first = items[0];

  if (!first) {
    return {
      title: 'Order',
      detail: 'No items listed',
      extra: 0,
      imageUrl: null as string | null,
    };
  }

  return {
    title: titleCase(first.name),
    detail: `${first.quantity} ${first.unit || 'item'}${first.quantity === 1 ? '' : 's'}`,
    extra: items.length - 1,
    imageUrl: first.imageUrl ?? null,
  };
}

function ProductImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  return (
    <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="40px" unoptimized className="object-cover" />
      ) : (
        <Package size={17} className="text-stone-400" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${
        statusStyles[status] ?? 'bg-stone-100 text-stone-600'
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
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${
        paymentStyles[status] ?? 'bg-stone-100 text-stone-600'
      }`}
    >
      {status.replaceAll('_', ' ')}
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
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200/80 bg-white px-3.5 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon size={16} strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-stone-500">{label}</p>

        <p className="mt-0.5 truncate text-[15px] font-semibold tracking-tight text-stone-900">
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
      className="flex min-w-[220px] flex-col gap-2 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg"
    >
      <label htmlFor={inputId} className="text-[10px] font-semibold text-stone-600">
        Registered rider email
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
        placeholder="rider@example.com"
        className="h-8 w-full rounded-md border border-stone-200 bg-stone-50 px-2.5 text-[11px] outline-none transition focus:border-[#e86b3e] focus:bg-white focus:ring-2 focus:ring-[#e86b3e]/10"
      />

      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={busy || order.paymentStatus !== 'paid'}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-[#e86b3e] px-2 text-[10px] font-semibold text-white transition hover:bg-[#cf572f] disabled:opacity-50"
        >
          {busy ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
          Assign rider
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="h-8 rounded-md border border-stone-200 px-2.5 text-[10px] font-medium text-stone-600 hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RiderCell({
  order,
  formOpen,
  busy,
  value,
  onChange,
  onToggle,
  onSubmit,
  onCancel,
}: {
  order: AdminOrder;
  formOpen: boolean;
  busy: boolean;
  value: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  if (order.riderEmail) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600">
          <Truck size={13} />
        </span>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-stone-800">
            {order.riderName || order.riderEmail}
          </p>

          <p className="truncate text-[10px] text-stone-400">{order.riderEmail}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-w-[110px] items-center">
      {formOpen ? (
        <div className="absolute right-0 top-0 z-20 w-64">
          <AssignForm
            order={order}
            value={value}
            busy={busy}
            onChange={onChange}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={order.paymentStatus !== 'paid'}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 text-[10px] font-semibold text-[#c75b32] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
        >
          <Truck size={12} />
          Assign rider
        </button>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const { data, error, isLoading, mutate } = useSWR<AdminOrdersResponse>(
    '/api/admin/orders',
    fetchAdminOrders,
    {
      refreshInterval: 15_000,
      revalidateOnFocus: true,
    },
  );

  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [assignmentOrder, setAssignmentOrder] = useState<string | null>(null);

  const pageSize = 10;

  const orders = useMemo(() => data?.orders ?? [], [data]);

  // Tab counts
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,

      paid: orders.filter((order) => order.paymentStatus === 'paid').length,

      pending: orders.filter(
        (order) =>
          ['pending', 'unpaid'].includes(order.paymentStatus) || order.status === 'pending',
      ).length,

      assigned: orders.filter((order) => Boolean(order.riderEmail) || order.status === 'assigned')
        .length,

      out_for_delivery: orders.filter((order) => order.status === 'out_for_delivery').length,

      delivered: orders.filter((order) => order.status === 'delivered').length,

      cancelled: orders.filter((order) => order.status === 'cancelled').length,
    };
  }, [orders]);

  // Dashboard statistics
  const stats = useMemo(
    () => ({
      total: orders.length,

      inProgress: orders.filter((order) => IN_PROGRESS.includes(order.status)).length,

      needsRider: orders.filter(
        (order) =>
          !order.riderEmail && order.paymentStatus === 'paid' && IN_PROGRESS.includes(order.status),
      ).length,

      revenue: orders
        .filter(
          (order) =>
            order.paymentStatus === 'paid' &&
            order.status !== 'refunded' &&
            order.status !== 'cancelled',
        )
        .reduce((sum, order) => sum + order.subtotalCents, 0),
    }),
    [orders],
  );

  // Filtering and sorting: paid orders always appear first.
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        (order.customerName ?? '').toLowerCase().includes(query) ||
        (order.items ?? []).some((item) => item.name.toLowerCase().includes(query)) ||
        (order.delivery?.city ?? '').toLowerCase().includes(query) ||
        (order.delivery?.region ?? '').toLowerCase().includes(query) ||
        (order.riderName ?? '').toLowerCase().includes(query) ||
        (order.riderEmail ?? '').toLowerCase().includes(query);

      const matchesAssignment = !showUnassignedOnly || !order.riderEmail;

      let matchesStatus = true;

      switch (activeStatus) {
        case 'paid':
          matchesStatus = order.paymentStatus === 'paid';
          break;

        case 'pending':
          matchesStatus =
            ['pending', 'unpaid'].includes(order.paymentStatus) || order.status === 'pending';
          break;

        case 'assigned':
          matchesStatus = Boolean(order.riderEmail) || order.status === 'assigned';
          break;

        case 'out_for_delivery':
          matchesStatus = order.status === 'out_for_delivery';
          break;

        case 'delivered':
          matchesStatus = order.status === 'delivered';
          break;

        case 'cancelled':
          matchesStatus = order.status === 'cancelled';
          break;

        default:
          matchesStatus = true;
      }

      return matchesSearch && matchesAssignment && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const paidDifference =
        Number(b.paymentStatus === 'paid') - Number(a.paymentStatus === 'paid');

      if (paidDifference !== 0) {
        return paidDifference;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, activeStatus, search, showUnassignedOnly]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const rangeStart = filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const rangeEnd = Math.min(currentPage * pageSize, filteredOrders.length);

  function changeStatus(status: StatusFilter) {
    setActiveStatus(status);
    setPage(1);
    setAssignmentOrder(null);
  }

  function toggleAssignment(orderNumber: string) {
    setAssignmentOrder((current) => (current === orderNumber ? null : orderNumber));
  }

  function jumpToFirstUnassigned() {
    const target = orders.find(
      (order) =>
        !order.riderEmail && order.paymentStatus === 'paid' && IN_PROGRESS.includes(order.status),
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
    setMessage('');
  }

  // CSV export
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
      (order.items ?? []).map((item) => `${item.name} x${item.quantity}`).join('; '),
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

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

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

  // Rider assignment
  async function assignRider(event: FormEvent<HTMLFormElement>, orderNumber: string) {
    event.preventDefault();

    const email = emails[orderNumber]?.trim();

    if (!email) return;

    setBusyOrder(orderNumber);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Could not assign this rider.');
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
        assignError instanceof Error ? assignError.message : 'Could not assign this rider.',
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
            className="text-xl font-semibold tracking-tight text-stone-900"
          >
            Orders
          </h1>

          <p className="mt-1 text-xs text-stone-500">
            Manage customer orders, payments and deliveries.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={exportOrders}
            disabled={filteredOrders.length === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50 disabled:opacity-40"
          >
            <ArrowDownToLine size={14} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={jumpToFirstUnassigned}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#e86b3e] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#cf572f]"
          >
            <Truck size={14} />
            Assign riders
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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

      {/* Search and assignment filter */}
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
            placeholder="Search order, customer, product, city or rider..."
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
      <div className="flex gap-1.5 overflow-x-auto border-b border-stone-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {statuses.map((status) => {
          const active = activeStatus === status;

          return (
            <button
              type="button"
              key={status}
              onClick={() => changeStatus(status)}
              className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 px-3 text-[11px] font-medium transition ${
                active ? 'text-[#d75b30]' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {statusLabels[status]}

              <span
                className={`rounded px-1.5 py-0.5 text-[9px] tabular-nums ${
                  active ? 'bg-orange-50 text-[#d75b30]' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {statusCounts[status]}
              </span>

              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#e86b3e]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold text-stone-900">Order history</h2>

            <p className="mt-0.5 text-[10px] text-stone-400">
              {filteredOrders.length} matching orders
            </p>
          </div>

          <span className="hidden items-center gap-1.5 text-[10px] text-stone-400 sm:flex">
            <CalendarClock size={12} />
            Times shown in WAT
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-xs text-stone-500">
            <LoaderCircle size={17} className="animate-spin text-[#e86b3e]" />
            Loading orders...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-700">{error.message}</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
            <Package size={26} className="mb-3 text-stone-300" />

            <p className="text-xs font-semibold text-stone-800">No orders found</p>

            <p className="mt-1 text-[11px] text-stone-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/80">
                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Order
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Delivery
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Date
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Total
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Payment
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Status
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Rider
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {paginatedOrders.map((order) => {
                  const { title, detail, extra, imageUrl } = getItemSummary(order);

                  const location = [order.delivery?.city, order.delivery?.region]
                    .filter(Boolean)
                    .join(', ');

                  const placedAt = new Date(order.createdAt);

                  return (
                    <tr
                      key={order.orderNumber}
                      className="group transition-colors hover:bg-stone-50/70"
                    >
                      {/* Product and order reference */}
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[210px] items-center gap-2.5">
                          <ProductImage imageUrl={imageUrl} name={title} />

                          <div className="min-w-0">
                            <p
                              className="max-w-[190px] truncate text-[11px] font-semibold text-stone-800"
                              title={title}
                            >
                              {title}

                              {extra > 0 && (
                                <span className="ml-1.5 text-[9px] font-medium text-stone-400">
                                  +{extra} more
                                </span>
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-stone-400">
                              {shortRef(order.orderNumber)}
                              <span className="mx-1.5">·</span>
                              {detail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[150px] items-center gap-2">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[9px] font-semibold text-stone-600">
                            {getInitials(order.email)}
                          </span>

                          <div className="min-w-0">
                            <p
                              className="max-w-[150px] truncate text-[11px] font-medium text-stone-800"
                              title={order.customerName || order.email}
                            >
                              {order.customerName || order.email}
                            </p>

                            {order.customerName && (
                              <p className="max-w-[150px] truncate text-[10px] text-stone-400">
                                {order.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Delivery */}
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[115px] items-center gap-1.5 text-[10px] text-stone-500">
                          <MapPin size={12} className="shrink-0 text-stone-400" />

                          <span className="max-w-[130px] truncate">
                            {location || 'Not provided'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-[110px]">
                          <p className="text-[10px] font-medium text-stone-700">
                            {dateFormatter.format(placedAt)}
                          </p>

                          <p className="mt-0.5 text-[10px] text-stone-400">
                            {timeFormatter.format(placedAt)}
                          </p>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5">
                        <p className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-stone-900">
                          {formatPrice(order.subtotalCents)}
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>

                      {/* Order status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Rider assignment */}
                      <td className="px-4 py-3.5">
                        <RiderCell
                          order={order}
                          formOpen={assignmentOrder === order.orderNumber}
                          busy={busyOrder === order.orderNumber}
                          value={emails[order.orderNumber] ?? ''}
                          onChange={(value) =>
                            setEmails((current) => ({
                              ...current,
                              [order.orderNumber]: value,
                            }))
                          }
                          onToggle={() => toggleAssignment(order.orderNumber)}
                          onSubmit={(event) => void assignRider(event, order.orderNumber)}
                          onCancel={() => setAssignmentOrder(null)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-stone-500">
              Showing{' '}
              <span className="font-semibold text-stone-800">
                {rangeStart}–{rangeEnd}
              </span>{' '}
              of <span className="font-semibold text-stone-800">{filteredOrders.length}</span>{' '}
              orders
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-2.5 text-[10px] font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronLeft size={13} />
                Previous
              </button>

              <span className="whitespace-nowrap px-1 text-[10px] text-stone-500">
                Page <span className="font-semibold text-stone-800">{currentPage}</span> of{' '}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-2.5 text-[10px] font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
