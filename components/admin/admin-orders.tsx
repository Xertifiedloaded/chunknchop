'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Store,
  PackageCheck,
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
  deliveryZoneId?: string;
  items?: AdminOrderItem[];
  delivery?: {
    addressLine1?: string;
    area?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
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
  'pickup',
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
  pickup: 'Pickup',
  cancelled: 'Cancelled',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  preparing: 'bg-orange-50 text-orange-700',
  quality_check: 'bg-rose-50 text-rose-700',
  packaging: 'bg-[#f6f0e8] text-[#51483e]',
  ready_for_dispatch: 'bg-sky-50 text-sky-700',
  assigned: 'bg-violet-50 text-violet-700',
  out_for_delivery: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  collected: 'bg-emerald-50 text-emerald-700',
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

async function fetchZones(url: string): Promise<{ zones: AdminZone[] }> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Could not load zones.');
  return { zones: Array.isArray(result?.zones) ? result.zones : [] };
}

async function fetchRiders(url: string): Promise<{ riders: AdminRider[] }> {
  const response = await fetch(url, { cache: 'no-store', credentials: 'include' });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Could not load riders.');
  return { riders: Array.isArray(result?.riders) ? result.riders : [] };
}

const formatStatus = (status: string) =>
  status === 'collected'
    ? 'Picked up'
    : (statusLabels[status as StatusFilter] ?? status.replaceAll('_', ' '));

const isPickup = (order: AdminOrder) => {
  const d = order.delivery;
  return !d || !(d.addressLine1 || d.area || d.city || d.region);
};

const isClosed = (order: AdminOrder) =>
  ['cancelled', 'delivered', 'collected', 'refunded'].includes(order.status);

const canOpenOrder = (order: AdminOrder) =>
  isPickup(order) || (!order.riderEmail && order.paymentStatus === 'paid' && !isClosed(order));

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
    <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f6f0e8]">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="40px" unoptimized className="object-cover" />
      ) : (
        <Package size={17} className="text-[#999187]" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${
        statusStyles[status] ?? 'bg-[#f6f0e8] text-[#51483e]'
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
        paymentStyles[status] ?? 'bg-[#f6f0e8] text-[#51483e]'
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
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#eae5dc] bg-white px-3.5 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon size={16} strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-[#89837b]">{label}</p>

        <p className="mt-0.5 truncate text-[15px] font-semibold tracking-tight text-[#28231e]">
          {value}
        </p>
      </div>
    </div>
  );
}

type AdminRider = {
  id: string;
  phone?: string;
  photoUrl?: string | null;
  vehicleType: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string;
  plateNumber?: string;
  verificationStatus: string;
  isActive: boolean;
  isAvailable: boolean;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  locationUpdatedAt?: string | null;
  user: { name: string; email: string };
  zones: { zoneId?: string; zone: { id?: string; name: string; city: string } }[];
};

type AdminZone = { id: string; name: string; city: string; state?: string | null };

function resolveOrderZones(order: AdminOrder, zones: AdminZone[]): AdminZone[] {
  if (order.deliveryZoneId) return zones.filter((z) => z.id === order.deliveryZoneId);
  const city = norm(order.delivery?.city);
  return city ? zones.filter((z) => norm(z.city) === city) : [];
}

type RankedRider = AdminRider & {
  distanceKm: number | null;
  zoneMatch: boolean;

  blockedReason: string | null;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const norm = (value?: string | null) => (value ?? '').trim().toLowerCase();

function rankRiders(riders: AdminRider[], order: AdminOrder, zoneIds: string[]): RankedRider[] {
  const d = order.delivery;
  const area = norm(d?.area);
  const city = norm(d?.city);

  return riders
    .filter((r) => r.verificationStatus === 'approved' && r.isActive)
    .map((r) => {
      const distanceKm =
        typeof d?.latitude === 'number' &&
        typeof d?.longitude === 'number' &&
        typeof r.currentLatitude === 'number' &&
        typeof r.currentLongitude === 'number'
          ? haversineKm(d.latitude, d.longitude, r.currentLatitude, r.currentLongitude)
          : null;
      const zoneMatch = r.zones.some(({ zone }) => {
        const zoneName = norm(zone.name);
        const zoneCity = norm(zone.city);
        return (
          (area && zoneName && (zoneName.includes(area) || area.includes(zoneName))) ||
          (!area && city && zoneCity === city)
        );
      });

      const servesZone = zoneIds.length
        ? r.zones.some((z) => zoneIds.includes((z.zoneId ?? z.zone.id) as string))
        : null;
      const blockedReason = !r.isAvailable
        ? 'Offline or on a delivery'
        : servesZone === false
          ? "Doesn't serve this delivery zone"
          : null;
      return { ...r, distanceKm, zoneMatch: servesZone ?? zoneMatch, blockedReason };
    })
    .sort((a, b) => {
      if ((a.blockedReason === null) !== (b.blockedReason === null))
        return a.blockedReason === null ? -1 : 1;
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      if (a.zoneMatch !== b.zoneMatch) return a.zoneMatch ? -1 : 1;
      return a.user.name.localeCompare(b.user.name);
    });
}

const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

function AssignRiderDialog({
  order,
  zones,
  riders,
  loading,
  loadError,
  busy,
  error,
  onAssign,
  onClose,
}: {
  order: AdminOrder;
  zones: AdminZone[];
  riders: AdminRider[];
  loading: boolean;
  loadError: string;
  busy: boolean;
  error: string;
  onAssign: (email: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const orderZones = useMemo(() => resolveOrderZones(order, zones), [order, zones]);
  const zoneIds = useMemo(
    () => (order.deliveryZoneId ? [order.deliveryZoneId] : orderZones.map((z) => z.id)),
    [order.deliveryZoneId, orderZones],
  );
  const ranked = useMemo(() => rankRiders(riders, order, zoneIds), [riders, order, zoneIds]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter((r) => {
      if (onlineOnly && r.blockedReason) return false;
      if (!q) return true;
      return [
        r.user.name,
        r.user.email,
        r.phone,
        r.plateNumber,
        r.vehicleType,
        r.vehicleBrand,
        r.vehicleModel,
        ...r.zones.map(({ zone }) => `${zone.name} ${zone.city}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [ranked, query, onlineOnly]);

  const nearestEmail = ranked.find((r) => !r.blockedReason && r.distanceKm !== null)?.user.email;
  const selectedRider = ranked.find((r) => r.user.email === selected) ?? null;
  const deliveryLabel = [order.delivery?.area, order.delivery?.city, order.delivery?.region]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-rider-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#f0ece6] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="assign-rider-title" className="text-[16px] font-bold text-[#28231e]">
              Assign rider
            </h2>
            <p className="mt-1 text-[11px] text-[#89837b]">
              Order {shortRef(order.orderNumber)}
              {deliveryLabel && (
                <>
                  <span className="mx-1.5">·</span>
                  <MapPin size={11} className="mr-1 inline -translate-y-px" />
                  {deliveryLabel}
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#999187]">Delivery zone:</span>
              {orderZones.length ? (
                orderZones.map((z) => (
                  <span
                    key={z.id}
                    className="rounded-full bg-[#f6f0e8] px-2.5 py-1 text-[10px] font-semibold text-[#8c6238]"
                  >
                    {z.name}, {z.city}
                  </span>
                ))
              ) : (
                <span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                  No zone matches {order.delivery?.city || 'this address'}. Add a delivery zone for
                  it first.
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#89837b] hover:bg-[#f7f4ef]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2 border-b border-[#f0ece6] px-5 py-3 sm:flex-row sm:items-center sm:px-6">
          <div className="relative min-w-0 flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#b8afa4]"
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone, location or plate…"
              className="h-9 w-full rounded-lg border border-[#eae5dc] bg-[#faf7f2] pl-9 pr-3 text-[11px] outline-none transition placeholder:text-[#b8afa4] focus:border-[#c9aa86] focus:bg-white focus:ring-2 focus:ring-[#c9aa86]/20"
            />
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[11px] font-medium text-[#51483e]">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
            />
            Assignable only
          </label>
        </div>

        <div className="min-h-[200px] flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-[11px] text-[#89837b]">
              <LoaderCircle size={16} className="animate-spin text-[#986735]" />
              Loading riders...
            </div>
          ) : loadError ? (
            <p className="p-6 text-center text-[11px] text-red-700">{loadError}</p>
          ) : results.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <UserRoundX size={24} className="mb-2 text-[#cfc6b9]" />
              <p className="text-[12px] font-semibold text-[#302a24]">No riders found</p>
              <p className="mt-1 text-[10px] text-[#999187]">
                {ranked.length
                  ? 'Try a different search.'
                  : 'No approved, active riders are available.'}
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Riders" className="grid gap-1.5">
              {results.map((r) => {
                const active = r.user.email === selected;
                const vehicle = [r.vehicleBrand, r.vehicleModel].filter(Boolean).join(' ');
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      aria-disabled={Boolean(r.blockedReason)}
                      disabled={Boolean(r.blockedReason)}
                      onClick={() => setSelected(r.user.email)}
                      onDoubleClick={() => !busy && !r.blockedReason && onAssign(r.user.email)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                        r.blockedReason
                          ? 'cursor-not-allowed border-[#eeeae3] bg-[#faf9f6] opacity-60'
                          : active
                            ? 'border-[#c9aa86] bg-[#fbf7f0]'
                            : 'border-[#eeeae3] bg-white hover:border-[#d9c3a8] hover:bg-[#faf7f2]'
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6f0e8] text-[#8c6238]">
                        <Truck size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[12px] font-semibold text-[#302a24]">
                            {r.user.name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                              r.isAvailable
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-[#f1eee9] text-[#8b857d]'
                            }`}
                          >
                            {r.isAvailable ? 'Online' : 'Offline'}
                          </span>
                          {r.user.email === nearestEmail && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
                              Nearest
                            </span>
                          )}
                          {r.zoneMatch && (
                            <span className="rounded bg-[#f6f0e8] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8c6238]">
                              Serves this area
                            </span>
                          )}
                        </span>
                        {r.blockedReason && (
                          <span className="mt-1 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                            {r.blockedReason}
                          </span>
                        )}
                        <span className="mt-0.5 block truncate text-[10px] text-[#999187]">
                          {r.user.email}
                          {r.phone && ` · ${r.phone}`}
                        </span>
                        <span className="mt-1 block truncate text-[10px] capitalize text-[#71685e]">
                          {r.vehicleType}
                          {vehicle && ` · ${vehicle}`}
                          {r.plateNumber && ` · ${r.plateNumber}`}
                        </span>
                        {r.zones.length > 0 && (
                          <span className="mt-0.5 block truncate text-[10px] text-[#999187]">
                            {r.zones.map(({ zone }) => zone.name).join(', ')}
                          </span>
                        )}
                      </span>
                      {r.distanceKm !== null && (
                        <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold tabular-nums text-[#393129]">
                          {formatDistance(r.distanceKm)}
                          <span className="block text-right text-[9px] font-normal text-[#999187]">
                            away
                          </span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#f0ece6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p role="alert" className="min-h-4 text-[11px] text-red-600">
            {error}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-9 rounded-lg border border-[#eae5dc] px-4 text-[11px] font-semibold text-[#51483e] hover:bg-[#faf7f2] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                busy ||
                !selectedRider ||
                Boolean(selectedRider.blockedReason) ||
                order.paymentStatus !== 'paid'
              }
              onClick={() => selectedRider && onAssign(selectedRider.user.email)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#29231e] px-4 text-[11px] font-semibold text-white transition hover:bg-[#493b2d] disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
              {busy
                ? 'Assigning…'
                : selectedRider
                  ? `Assign ${selectedRider.user.name.split(' ')[0]}`
                  : 'Assign rider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiderCell({ order }: { order: AdminOrder }) {
  if (isPickup(order)) {
    const collected = order.status === 'collected';
    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-medium ${
          collected ? 'text-emerald-700' : 'text-[#89837b]'
        }`}
      >
        <Store size={12} />
        {collected ? 'Customer picked up' : 'Customer pickup'}
      </span>
    );
  }

  if (order.riderEmail) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f6f0e8] text-[#51483e]">
          <Truck size={13} />
        </span>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-[#302a24]">
            {order.riderName || order.riderEmail}
          </p>

          <p className="truncate text-[10px] text-[#999187]">{order.riderEmail}</p>
        </div>
      </div>
    );
  }

  return canOpenOrder(order) ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold text-[#986735]">
      <Truck size={12} className="shrink-0" />
      Unassigned · click to assign
    </span>
  ) : (
    <span className="text-[10px] text-[#b8afa4]">—</span>
  );
}

function PickupDialog({
  order,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  order: AdminOrder;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const collected = order.status === 'collected';
  const blocked = order.status === 'cancelled' || order.status === 'refunded';
  const unpaid = order.paymentStatus !== 'paid';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pickup-title"
        className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#f0ece6] px-5 py-4 sm:px-6">
          <div>
            <h2 id="pickup-title" className="text-[16px] font-bold text-[#28231e]">
              Pickup order
            </h2>
            <p className="mt-1 text-[11px] text-[#89837b]">Order {shortRef(order.orderNumber)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#89837b] hover:bg-[#f7f4ef]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3 rounded-xl border border-[#eeeae3] p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6f0e8] text-[#8c6238]">
              <Store size={15} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[#302a24]">
                {order.customerName || order.email}
              </p>
              {order.customerName && (
                <p className="truncate text-[10px] text-[#999187]">{order.email}</p>
              )}
              <p className="mt-1 text-[10px] text-[#71685e]">
                No delivery address, so the customer collects this order in store.
              </p>
            </div>
          </div>

          {collected ? (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-[11px] font-medium text-emerald-800">
              <PackageCheck size={15} />
              The customer has picked up this order.
            </p>
          ) : unpaid ? (
            <p className="rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-[11px] text-amber-800">
              Payment is {order.paymentStatus.replaceAll('_', ' ')}. Confirm payment before the
              customer collects.
            </p>
          ) : blocked ? (
            <p className="rounded-lg border border-red-100 bg-red-50/70 p-3 text-[11px] text-red-700">
              This order is {order.status}, so it can&apos;t be marked as picked up.
            </p>
          ) : (
            <p className="text-[11px] text-[#71685e]">
              Mark this order as picked up once the customer has collected it.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#f0ece6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p role="alert" className="min-h-4 text-[11px] text-red-600">
            {error}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-9 rounded-lg border border-[#eae5dc] px-4 text-[11px] font-semibold text-[#51483e] hover:bg-[#faf7f2] disabled:opacity-50"
            >
              {collected ? 'Close' : 'Cancel'}
            </button>
            {!collected && (
              <button
                type="button"
                disabled={busy || unpaid || blocked}
                onClick={onConfirm}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#29231e] px-4 text-[11px] font-semibold text-white transition hover:bg-[#493b2d] disabled:opacity-50"
              >
                {busy ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <PackageCheck size={13} />
                )}
                {busy ? 'Saving…' : 'Mark as picked up'}
              </button>
            )}
          </div>
        </div>
      </div>
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

  const [assignError, setAssignError] = useState('');
  const {
    data: ridersData,
    error: ridersError,
    isLoading: ridersLoading,
  } = useSWR<{ riders: AdminRider[] }>('/api/admin/riders', fetchRiders, {
    refreshInterval: 30_000,
  });
  const { data: zonesData } = useSWR<{ zones: AdminZone[] }>('/api/delivery/zones', fetchZones);
  const zones = useMemo(() => zonesData?.zones ?? [], [zonesData]);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [assignmentOrder, setAssignmentOrder] = useState<string | null>(null);

  const pageSize = 10;

  const orders = useMemo(() => data?.orders ?? [], [data]);

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

      pickup: orders.filter(isPickup).length,

      cancelled: orders.filter((order) => order.status === 'cancelled').length,
    };
  }, [orders]);

  const stats = useMemo(
    () => ({
      total: orders.length,

      inProgress: orders.filter((order) => IN_PROGRESS.includes(order.status)).length,

      needsRider: orders.filter(
        (order) =>
          !order.riderEmail &&
          !isPickup(order) &&
          order.paymentStatus === 'paid' &&
          IN_PROGRESS.includes(order.status),
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

      const matchesAssignment = !showUnassignedOnly || (!order.riderEmail && !isPickup(order));

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

        case 'pickup':
          matchesStatus = isPickup(order);
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

  function openAssignment(orderNumber: string) {
    setAssignError('');
    setAssignmentOrder(orderNumber);
  }

  function jumpToFirstUnassigned() {
    const target = orders.find(
      (order) =>
        !order.riderEmail &&
        !isPickup(order) &&
        order.paymentStatus === 'paid' &&
        IN_PROGRESS.includes(order.status),
    );

    if (!target) {
      setMessage('There are no unassigned paid orders available.');
      return;
    }

    setActiveStatus('all');
    setSearch('');
    setShowUnassignedOnly(true);
    setPage(1);
    openAssignment(target.orderNumber);
    setMessage('');
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

  async function assignRider(orderNumber: string, email: string) {
    setBusyOrder(orderNumber);
    setAssignError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setAssignmentOrder(null);
      await mutate();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Could not assign this rider.');
    } finally {
      setBusyOrder(null);
    }
  }

  async function markPickedUp(orderNumber: string) {
    setBusyOrder(orderNumber);
    setAssignError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/pickup`, {
        method: 'POST',
        credentials: 'include',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Could not update this order.');

      setMessage(`${shortRef(orderNumber)} marked as picked up by the customer.`);
      setAssignmentOrder(null);
      await mutate();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Could not update this order.');
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <section
      className="min-w-0 space-y-5 text-[#29241f] sm:space-y-6"
      aria-labelledby="admin-orders-title"
    >
      {}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
            Administration
          </div>

          <h1
            id="admin-orders-title"
            className="text-2xl font-bold tracking-tight text-[#28231e] sm:text-[28px]"
          >
            Orders
          </h1>

          <p className="mt-1.5 text-[12px] text-[#89837b]">
            Manage customer orders, payments and deliveries.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={exportOrders}
            disabled={filteredOrders.length === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#eae5dc] bg-white px-3 text-xs font-medium text-[#51483e] shadow-sm transition hover:bg-[#faf7f2] disabled:opacity-40"
          >
            <ArrowDownToLine size={14} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={jumpToFirstUnassigned}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#29231e] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#493b2d]"
          >
            <Truck size={14} />
            Assign riders
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard
          label="Total orders"
          value={stats.total}
          icon={ShoppingBag}
          tone="bg-[#f6f0e8] text-[#393129]"
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

      {}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-3 rounded-lg border border-[#eadfce] bg-[#fbf7f0] px-3.5 py-3 text-[11px] text-[#6f5436]"
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Dismiss message"
            className="shrink-0 text-[#986735] hover:text-[#68431f]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#999187]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search order, customer, product, city or rider..."
            className="h-10 w-full rounded-lg border border-[#eae5dc] bg-white pl-9 pr-3 text-xs text-[#28231e] shadow-sm outline-none transition placeholder:text-[#b8afa4] focus:border-[#c9aa86] focus:ring-2 focus:ring-[#c9aa86]/20"
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
              ? 'border-[#c9aa86] bg-[#f6f0e8] text-[#8c6238]'
              : 'border-[#eae5dc] bg-white text-[#51483e] hover:bg-[#faf7f2]'
          }`}
        >
          <Filter size={14} />
          Unassigned only
        </button>
      </div>

      {}
      <div className="flex gap-1.5 overflow-x-auto border-b border-[#eae5dc] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {statuses.map((status) => {
          const active = activeStatus === status;

          return (
            <button
              type="button"
              key={status}
              onClick={() => changeStatus(status)}
              className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 px-3 text-[11px] font-medium transition ${
                active ? 'text-[#8c6238]' : 'text-[#89837b] hover:text-[#302a24]'
              }`}
            >
              {statusLabels[status]}

              <span
                className={`rounded px-1.5 py-0.5 text-[9px] tabular-nums ${
                  active ? 'bg-[#f6f0e8] text-[#8c6238]' : 'bg-[#f6f0e8] text-[#89837b]'
                }`}
              >
                {statusCounts[status]}
              </span>

              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#a17443]" />
              )}
            </button>
          );
        })}
      </div>

      {}
      <div className="overflow-hidden rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]">
        <div className="h-1 bg-gradient-to-r from-[#80532c] via-[#b68a5b] to-[#e2c7a5]" />
        <div className="flex items-center justify-between gap-3 border-b border-[#f0ece6] px-4 py-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#302a24]">Order history</h2>

            <p className="mt-0.5 text-[10px] text-[#999187]">
              {filteredOrders.length} matching orders
            </p>
          </div>

          <span className="hidden items-center gap-1.5 text-[10px] text-[#999187] sm:flex">
            <CalendarClock size={12} />
            Times shown in WAT
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-xs text-[#89837b]">
            <LoaderCircle size={17} className="animate-spin text-[#986735]" />
            Loading orders...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-700">{error.message}</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
            <Package size={26} className="mb-3 text-[#cfc6b9]" />

            <p className="text-xs font-semibold text-[#302a24]">No orders found</p>

            <p className="mt-1 text-[11px] text-[#89837b]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#f0ece6] bg-[#faf7f2]">
                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Order
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Delivery
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Date
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Total
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Payment
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Status
                  </th>

                  <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#999187]">
                    Rider
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ece6]">
                {paginatedOrders.map((order) => {
                  const { title, detail, extra, imageUrl } = getItemSummary(order);

                  const location = [order.delivery?.city, order.delivery?.region]
                    .filter(Boolean)
                    .join(', ');

                  const placedAt = new Date(order.createdAt);

                  return (
                    <tr
                      key={order.orderNumber}
                      onClick={() => canOpenOrder(order) && openAssignment(order.orderNumber)}
                      onKeyDown={(event) => {
                        if (canOpenOrder(order) && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          openAssignment(order.orderNumber);
                        }
                      }}
                      tabIndex={canOpenOrder(order) ? 0 : undefined}
                      aria-label={
                        canOpenOrder(order)
                          ? `${isPickup(order) ? 'View pickup' : 'Assign rider to'} order ${shortRef(order.orderNumber)}`
                          : undefined
                      }
                      className={`group transition-colors hover:bg-[#faf7f2] ${
                        canOpenOrder(order)
                          ? 'cursor-pointer focus-visible:bg-[#faf7f2] focus-visible:outline-none'
                          : ''
                      }`}
                    >
                      {}
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[210px] items-center gap-2.5">
                          <ProductImage imageUrl={imageUrl} name={title} />

                          <div className="min-w-0">
                            <p
                              className="max-w-[190px] truncate text-[11px] font-semibold text-[#302a24]"
                              title={title}
                            >
                              {title}

                              {extra > 0 && (
                                <span className="ml-1.5 text-[9px] font-medium text-[#999187]">
                                  +{extra} more
                                </span>
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-[#999187]">
                              {shortRef(order.orderNumber)}
                              <span className="mx-1.5">·</span>
                              {detail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[150px] items-center gap-2">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f6f0e8] text-[9px] font-semibold text-[#51483e]">
                            {getInitials(order.email)}
                          </span>

                          <div className="min-w-0">
                            <p
                              className="max-w-[150px] truncate text-[11px] font-medium text-[#302a24]"
                              title={order.customerName || order.email}
                            >
                              {order.customerName || order.email}
                            </p>

                            {order.customerName && (
                              <p className="max-w-[150px] truncate text-[10px] text-[#999187]">
                                {order.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[115px] items-center gap-1.5 text-[10px] text-[#89837b]">
                          {isPickup(order) ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f6f0e8] px-2 py-1 text-[10px] font-semibold text-[#8c6238]">
                              <Store size={12} />
                              Pickup
                            </span>
                          ) : (
                            <>
                              <MapPin size={12} className="shrink-0 text-[#999187]" />

                              <span className="min-w-0">
                                <span className="block max-w-[130px] truncate">
                                  {location || 'Not provided'}
                                </span>
                                <span className="mt-0.5 block max-w-[130px] truncate text-[9px] font-semibold text-[#8c6238]">
                                  {resolveOrderZones(order, zones)
                                    .map((z) => z.name)
                                    .join(', ') || 'No zone'}
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <div className="min-w-[110px]">
                          <p className="text-[10px] font-medium text-[#393129]">
                            {dateFormatter.format(placedAt)}
                          </p>

                          <p className="mt-0.5 text-[10px] text-[#999187]">
                            {timeFormatter.format(placedAt)}
                          </p>
                        </div>
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <p className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-[#28231e]">
                          {formatPrice(order.subtotalCents)}
                        </p>
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>

                      {}
                      <td className="px-4 py-3.5">
                        <RiderCell order={order} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#f0ece6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-[#89837b]">
              Showing{' '}
              <span className="font-semibold text-[#302a24]">
                {rangeStart}–{rangeEnd}
              </span>{' '}
              of <span className="font-semibold text-[#302a24]">{filteredOrders.length}</span>{' '}
              orders
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#eae5dc] px-2.5 text-[10px] font-medium text-[#51483e] transition hover:bg-[#faf7f2] disabled:opacity-40"
              >
                <ChevronLeft size={13} />
                Previous
              </button>

              <span className="whitespace-nowrap px-1 text-[10px] text-[#89837b]">
                Page <span className="font-semibold text-[#302a24]">{currentPage}</span> of{' '}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#eae5dc] px-2.5 text-[10px] font-medium text-[#51483e] transition hover:bg-[#faf7f2] disabled:opacity-40"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
      {assignmentOrder &&
        (() => {
          const target = orders.find((o) => o.orderNumber === assignmentOrder);
          if (target && isPickup(target))
            return (
              <PickupDialog
                key={target.orderNumber}
                order={target}
                busy={busyOrder === target.orderNumber}
                error={assignError}
                onConfirm={() => void markPickedUp(target.orderNumber)}
                onClose={() => setAssignmentOrder(null)}
              />
            );
          return target ? (
            <AssignRiderDialog
              key={target.orderNumber}
              order={target}
              zones={zones}
              riders={ridersData?.riders ?? []}
              loading={ridersLoading}
              loadError={ridersError?.message ?? ''}
              busy={busyOrder === target.orderNumber}
              error={assignError}
              onAssign={(email) => void assignRider(target.orderNumber, email)}
              onClose={() => setAssignmentOrder(null)}
            />
          ) : null;
        })()}
    </section>
  );
}
