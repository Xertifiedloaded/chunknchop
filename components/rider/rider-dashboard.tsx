'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import RiderFinancePanel from '@/components/rider/rider-finance-panel';
import RiderChatInbox from './rider-chat-inbox';

import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Navigation,
  Package,
  PackageCheck,
  Truck,
  CalendarDays,
  UserRound,
  ChevronRight,
  LoaderCircle,
  Wifi,
  WifiOff,
  MessageCircle,
  X,
} from 'lucide-react';

type RiderOrder = {
  orderNumber: string;
  status?: string;
  paymentStatus?: string;
  customerName?: string;
  delivery?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    area?: string;
    city?: string;
    region?: string;
    deliveryDate?: string;
    deliveryWindow?: string;
    deliveryNotes?: string;
  };
  items?: Array<{ name?: string; quantity?: number }>;
  riderLocation?: {
    latitude?: number;
    longitude?: number;
  };
};

type Profile = {
  isAvailable: boolean;
  isActive: boolean;
  verificationStatus: string;
};

type LocationState =
  | 'idle'
  | 'watching'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported'
  | 'insecure';

const card = 'rounded-xl border border-[#ece7df] bg-white shadow-[0_3px_16px_rgba(40,30,20,0.035)]';

const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#29231e] px-3 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#493b2d] disabled:cursor-not-allowed disabled:opacity-50';

const outlineBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e9e4dc] bg-white px-3 py-2.5 text-[10px] font-semibold text-[#51483e] transition hover:border-[#c9aa86] hover:bg-[#faf7f2] disabled:opacity-50';

const statusConfig: Record<string, { label: string; style: string; icon: typeof Package }> = {
  assigned: {
    label: 'Assigned',
    style: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Package,
  },
  picked_up: {
    label: 'Picked up',
    style: 'bg-orange-50 text-orange-700 border-orange-100',
    icon: PackageCheck,
  },
  out_for_delivery: {
    label: 'On the way',
    style: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    style: 'bg-red-50 text-red-700 border-red-100',
    icon: AlertCircle,
  },
};

const activeStatuses = ['assigned', 'picked_up', 'out_for_delivery'];

function getAddress(delivery?: RiderOrder['delivery']) {
  return [
    delivery?.addressLine1,
    delivery?.addressLine2,
    delivery?.area,
    delivery?.city,
    delivery?.region,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatDate(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCustomerName(order: RiderOrder) {
  return order.delivery?.fullName || order.customerName || 'Customer';
}

export default function RiderDashboard({ name }: { name: string }) {
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [callingOrder, setCallingOrder] = useState<RiderOrder | null>(null);

  const [locationState, setLocationState] = useState<LocationState>('idle');

  const [locationMessage, setLocationMessage] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [ordersResponse, profileResponse] = await Promise.all([
      fetch('/api/rider/orders', { cache: 'no-store' }),
      fetch('/api/rider/profile', { cache: 'no-store' }),
    ]);

    const [ordersData, profileData] = await Promise.all([
      ordersResponse.json().catch(() => ({})),
      profileResponse.json().catch(() => ({})),
    ]);

    if (!ordersResponse.ok) {
      throw new Error(ordersData.error ?? 'Unable to load deliveries');
    }

    if (!profileResponse.ok) {
      throw new Error(profileData.error ?? 'Complete your rider profile first');
    }

    setOrders(ordersData.orders ?? []);
    setProfile(profileData.profile);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setError('');

    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialLoad = async () => {
      try {
        await load();
        if (mounted) setError('');
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Unable to load dashboard');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initialLoad();

    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 20000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [load]);

  async function toggleAvailability() {
    if (!profile) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/rider/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAvailable: !profile.isAvailable,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? 'Unable to update availability');
        return;
      }

      setProfile((current) => (current ? { ...current, isAvailable: data.isAvailable } : current));

      setMessage(
        data.isAvailable ? 'You are now available for deliveries.' : 'You are now offline.',
      );
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(orderNumber: string, status: string) {
    setMessage('');
    setError('');
    setUpdatingOrder(orderNumber);

    try {
      const response = await fetch(`/api/rider/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? 'Unable to update delivery');
        return;
      }

      setMessage(`Order ${orderNumber} updated successfully.`);
      await load();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUpdatingOrder('');
    }
  }

  const activeOrderNumbers = orders
    .filter((order) => activeStatuses.includes(order.status ?? ''))
    .map((order) => order.orderNumber);

  const activeOrderKey = activeOrderNumbers.join('|');

  useEffect(() => {
    if (!profile?.isAvailable) {
      setLocationState('idle');
      setLocationMessage('');
      setLocationAccuracy(null);
      return;
    }

    if (!activeOrderNumbers.length) {
      setLocationState('idle');
      setLocationMessage('Waiting for an active delivery.');
      setLocationAccuracy(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationState('unsupported');
      setLocationMessage('Your browser does not support location tracking.');
      return;
    }

    if (!window.isSecureContext) {
      setLocationState('insecure');
      setLocationMessage('Location tracking requires HTTPS or localhost.');
      return;
    }

    setLocationState('watching');
    setLocationMessage('Getting your current location...');

    let mounted = true;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (!mounted) return;

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocationState('success');
        setLocationMessage('Your live location is being shared.');
        setLocationAccuracy(position.coords.accuracy);

        const results = await Promise.allSettled(
          activeOrderNumbers.map((orderNumber) =>
            fetch(`/api/rider/orders/${encodeURIComponent(orderNumber)}/location`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(location),
            }),
          ),
        );

        if (!mounted) return;

        const failed = results.some(
          (result) =>
            result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok),
        );

        if (failed) {
          setLocationMessage('Location detected, but the server could not update every delivery.');
        }
      },
      (geoError) => {
        if (!mounted) return;

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setLocationState('denied');
            setLocationMessage(
              'Location permission was denied. Allow location access in your browser settings.',
            );
            break;

          case geoError.POSITION_UNAVAILABLE:
            setLocationState('unavailable');
            setLocationMessage(
              'Your device cannot determine your location. Check your device location services.',
            );
            break;

          case geoError.TIMEOUT:
            setLocationState('timeout');
            setLocationMessage(
              'Location request timed out. Check your GPS or internet connection.',
            );
            break;

          default:
            setLocationState('unavailable');
            setLocationMessage(geoError.message || 'Unable to retrieve your location.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 30000,
      },
    );

    return () => {
      mounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [profile?.isAvailable, activeOrderKey]);

  const canToggle = !!profile && profile.verificationStatus === 'approved' && profile.isActive;

  const activeOrders = orders.filter((order) => activeStatuses.includes(order.status ?? ''));

  const completedOrders = orders.filter((order) => order.status === 'delivered');

  const cancelledOrders = orders.filter((order) => order.status === 'cancelled');

  const locationColor =
    locationState === 'success'
      ? 'text-emerald-700'
      : locationState === 'watching'
        ? 'text-amber-700'
        : locationState === 'idle'
          ? 'text-[#928b82]'
          : 'text-red-600';

  const locationIcon =
    locationState === 'success'
      ? CheckCircle2
      : locationState === 'watching'
        ? LoaderCircle
        : locationState === 'idle'
          ? MapPin
          : AlertCircle;

  const LocationIcon = locationIcon;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 text-[#29241f] sm:px-6 sm:py-7">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#82796e] transition hover:text-[#986735]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to account
      </Link>

      <header className="mb-5">
        <div className="mb-2 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
          Rider workspace
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#28231e] sm:text-[26px]">
              Welcome, {name}
            </h1>
            <p className="mt-1 max-w-lg text-[10px] leading-[1.7] text-[#89837b]">
              Manage deliveries, communicate with customers and keep your delivery location updated.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setChatOpen(true)} className={outlineBtn} type="button">
              <MessageCircle className="h-3.5 w-3.5" />
              Messages
              {orders.filter((order) => order.status !== 'cancelled').length > 0 && (
                <span className="ml-0.5 rounded-full bg-[#f3ece2] px-1.5 py-0.5 text-[8px] font-bold text-[#93663b]">
                  {orders.filter((order) => order.status !== 'cancelled').length}
                </span>
              )}
            </button>

            <button
              onClick={() => void refresh()}
              className={outlineBtn}
              type="button"
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/70 p-3 text-[10px] leading-5 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-[10px] leading-5 text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <section className={`${card} mb-4 overflow-hidden`}>
        <div className="h-1 bg-linear-to-r from-[#80532c] via-[#b68a5b] to-[#e2c7a5]" />

        <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                profile?.isAvailable
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-[#f5f0e9] text-[#8b7965]'
              }`}
            >
              {profile?.isAvailable ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
            </div>

            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#999187]">
                Your availability
              </p>
              <p className="mt-1 text-[12px] font-bold text-[#29241f]">
                {profile?.isAvailable ? 'You are online' : 'You are currently offline'}
              </p>
              <p className="mt-1 text-[9px] text-[#928b82]">
                {profile?.isAvailable
                  ? 'You can receive delivery assignments.'
                  : 'Go online when you are ready for deliveries.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <button
              onClick={() => void toggleAvailability()}
              disabled={busy || !canToggle}
              className={
                profile?.isAvailable
                  ? `${outlineBtn} w-full sm:w-auto`
                  : `${primaryBtn} w-full sm:w-auto`
              }
              type="button"
            >
              {busy && <LoaderCircle className="h-3 w-3 animate-spin" />}
              {busy ? 'Updating...' : profile?.isAvailable ? 'Go offline' : 'Go available'}
            </button>

            <p className="text-[8px] text-[#928b82]">
              {profile
                ? `Verification: ${profile.verificationStatus} · Account: ${
                    profile.isActive ? 'Active' : 'Inactive'
                  }`
                : 'Loading rider profile...'}
            </p>

            {!canToggle && profile && (
              <p className="text-[8px] text-amber-700">
                Your account must be active and approved to go online.
              </p>
            )}
          </div>
        </div>
      </section>

      {}
      {profile?.isAvailable && activeOrders.length > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#eee8df] bg-white p-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f8f5f0] ${locationColor}`}
          >
            <LocationIcon
              className={`h-4 w-4 ${locationState === 'watching' ? 'animate-spin' : ''}`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-[#393129]">Live location tracking</p>
            <p className={`mt-1 text-[9px] leading-5 ${locationColor}`}>{locationMessage}</p>

            {locationState === 'success' && locationAccuracy !== null && (
              <p className="mt-0.5 text-[8px] text-[#928b82]">
                GPS accuracy: approximately {Math.round(locationAccuracy)} metres
              </p>
            )}
          </div>
        </div>
      )}

      <section className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          {
            label: 'All orders',
            value: orders.length,
            note: 'Assigned to you',
            icon: Package,
            color: 'text-[#a17443]',
          },
          {
            label: 'Active',
            value: activeOrders.length,
            note: 'In progress',
            icon: Truck,
            color: 'text-blue-600',
          },
          {
            label: 'Delivered',
            value: completedOrders.length,
            note: 'Successfully completed',
            icon: CheckCircle2,
            color: 'text-emerald-600',
          },
          {
            label: 'Cancelled',
            value: cancelledOrders.length,
            note: 'Cancelled orders',
            icon: AlertCircle,
            color: 'text-red-500',
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className={`${card} p-3.5`}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                  {stat.label}
                </span>
                <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <p className="mt-2.5 text-[22px] font-bold tracking-tight text-[#29241f]">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[8px] text-[#928b82]">{stat.note}</p>
            </div>
          );
        })}
      </section>

      <div className="mb-6">
        <RiderFinancePanel />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#302a24]">My deliveries</h2>
              <span className="rounded-full bg-[#f5eee4] px-2 py-0.5 text-[8px] font-bold text-[#93663b]">
                {orders.length}
              </span>
            </div>
            <p className="mt-1 text-[9px] text-[#928b82]">
              View assigned orders and update delivery progress.
            </p>
          </div>

          <span className="text-[8px] font-semibold uppercase tracking-wider text-[#a59c91]">
            Auto-refreshes every 20 seconds
          </span>
        </div>

        {loading ? (
          <div className={`${card} flex flex-col items-center justify-center px-5 py-10`}>
            <LoaderCircle className="h-5 w-5 animate-spin text-[#a17443]" />
            <p className="mt-3 text-[10px] font-medium text-[#81776b]">
              Loading your deliveries...
            </p>
          </div>
        ) : orders.length ? (
          <div className="grid gap-3">
            {orders.map((order) => {
              const status = order.status ?? 'pending';
              const config = statusConfig[status];
              const StatusIcon = config?.icon ?? Clock;
              const address = getAddress(order.delivery);
              const isUpdating = updatingOrder === order.orderNumber;

              const nextAction =
                status === 'assigned'
                  ? { value: 'picked_up', label: 'Mark as picked up' }
                  : status === 'picked_up'
                    ? { value: 'out_for_delivery', label: 'Start delivery' }
                    : status === 'out_for_delivery'
                      ? { value: 'delivered', label: 'Mark as delivered' }
                      : null;

              return (
                <article key={order.orderNumber} className={`${card} overflow-hidden`}>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#f0ece6] px-3.5 py-3 sm:px-4">
                    <div className="min-w-0">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-[#a49a8e]">
                        Order reference
                      </p>
                      <p
                        className="mt-1 text-[10px] font-bold text-[#393129]"
                        title={order.orderNumber}
                      >
                        {order.orderNumber.length > 16
                          ? `${order.orderNumber.slice(0, 16)}...`
                          : order.orderNumber}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-bold ${
                          config?.style ?? 'border-[#eee8df] bg-[#f6f0e8] text-[#8c6238]'
                        }`}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {config?.label ?? status.replaceAll('_', ' ')}
                      </span>

                      <span className="rounded-full border border-[#eee8df] bg-[#faf9f7] px-2 py-1 text-[8px] font-semibold text-[#756b60]">
                        Payment: {order.paymentStatus ?? 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-lg border border-[#eeeae3] bg-[#fdfcfb] p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[#a17443]">
                          <UserRound className="h-3 w-3" />
                          <p className="text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                            Customer
                          </p>
                        </div>

                        <p className="text-[11px] font-bold text-[#393129]">
                          {getCustomerName(order)}
                        </p>

                        {order.delivery?.phone ? (
                          <button
                            type="button"
                            onClick={() => setCallingOrder(order)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-medium text-[#766c61] transition hover:text-[#986735]"
                          >
                            <Phone className="h-3 w-3" />
                            {order.delivery.phone}
                          </button>
                        ) : (
                          <p className="mt-1.5 text-[9px] text-[#928b82]">Phone unavailable</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-[#eeeae3] bg-[#fdfcfb] p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[#a17443]">
                          <MapPin className="h-3 w-3" />
                          <p className="text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                            Delivery destination
                          </p>
                        </div>
                        <p className="text-[10px] leading-[1.8] text-[#393129]">
                          {address || 'Pickup / address unavailable'}
                        </p>
                      </div>
                    </div>

                    {(order.delivery?.deliveryDate ||
                      order.delivery?.deliveryNotes ||
                      order.delivery?.deliveryWindow) && (
                      <div className="mt-2.5 rounded-lg border border-[#eeeae3] p-3">
                        {order.delivery?.deliveryDate && (
                          <div className="flex items-start gap-2 text-[9px] text-[#71685e]">
                            <CalendarDays className="mt-0.5 h-3 w-3 shrink-0 text-[#a17443]" />
                            <div>
                              <span className="font-bold text-[#494036]">Scheduled delivery</span>
                              <p className="mt-0.5">
                                {formatDate(order.delivery.deliveryDate)}
                                {order.delivery.deliveryWindow
                                  ? ` · ${order.delivery.deliveryWindow}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.delivery?.deliveryNotes && (
                          <div className="mt-2 border-t border-[#f0ece6] pt-2 text-[9px] leading-5 text-[#71685e]">
                            <span className="font-bold text-[#494036]">
                              Customer instructions:{' '}
                            </span>
                            {order.delivery.deliveryNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {order.items && order.items.length > 0 && (
                      <div className="mt-2.5 rounded-lg border border-[#eeeae3] p-3">
                        <div className="mb-2 flex items-center gap-1.5">
                          <Package className="h-3 w-3 text-[#a17443]" />
                          <p className="text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                            Order items
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          {order.items.map((item, index) => (
                            <div
                              key={`${item.name ?? 'item'}-${index}`}
                              className="flex items-center justify-between gap-3 text-[9px]"
                            >
                              <span className="min-w-0 truncate text-[#554c42]">
                                {item.name ?? 'Product'}
                              </span>
                              <span className="shrink-0 font-bold text-[#393129]">
                                × {item.quantity ?? 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {nextAction && (
                        <button
                          onClick={() => void updateStatus(order.orderNumber, nextAction.value)}
                          disabled={isUpdating}
                          className={
                            status === 'out_for_delivery'
                              ? 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2.5 text-[9px] font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50'
                              : primaryBtn
                          }
                          type="button"
                        >
                          {isUpdating ? (
                            <LoaderCircle className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {isUpdating ? 'Updating...' : nextAction.label}
                        </button>
                      )}

                      <Link
                        href={`/account/orders/${encodeURIComponent(order.orderNumber)}/track`}
                        className={outlineBtn}
                      >
                        <Navigation className="h-3 w-3" />
                        Open tracking
                        <ChevronRight className="h-3 w-3" />
                      </Link>

                      {order.delivery?.phone && (
                        <button
                          type="button"
                          onClick={() => setCallingOrder(order)}
                          className={outlineBtn}
                        >
                          <Phone className="h-3 w-3" />
                          Call customer
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={`${card} border-dashed px-5 py-10 text-center`}>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee4] text-[#a17a50]">
              <Package className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[12px] font-bold text-[#393129]">No deliveries yet</p>
            <p className="mx-auto mt-1.5 max-w-xs text-[9px] leading-5 text-[#918980]">
              Your assigned deliveries will appear here. Make sure your rider account is approved
              and you are available.
            </p>
          </div>
        )}
      </section>

      <RiderChatInbox orders={orders} open={chatOpen} onClose={() => setChatOpen(false)} />

      {callingOrder && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[#211a13]/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCallingOrder(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-customer-title"
            className="w-full max-w-[340px] rounded-2xl border border-[#e9e2d8] bg-white p-5 shadow-[0_20px_70px_rgba(35,25,15,0.22)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee4] text-[#986735]">
                <Phone className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => setCallingOrder(null)}
                aria-label="Close call customer dialog"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#82796e] hover:bg-[#f5f1eb]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 id="call-customer-title" className="mt-4 text-[13px] font-bold text-[#302a24]">
              Call customer
            </h3>
            <p className="mt-1 text-[10px] leading-5 text-[#928b82]">
              You are about to call the customer for this delivery.
            </p>

            <div className="mt-4 rounded-xl border border-[#eeeae3] bg-[#fdfcfb] p-3">
              <p className="text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                Customer
              </p>
              <p className="mt-1 text-[11px] font-bold text-[#393129]">
                {getCustomerName(callingOrder)}
              </p>

              <p className="mt-3 text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                Phone number
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#51483e]">
                {callingOrder.delivery?.phone || 'Phone unavailable'}
              </p>

              <p className="mt-3 text-[8px] font-bold uppercase tracking-wider text-[#999187]">
                Order number
              </p>
              <p className="mt-1 break-all text-[9px] font-semibold text-[#51483e]">
                {callingOrder.orderNumber}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCallingOrder(null)}
                className={`${outlineBtn} flex-1`}
              >
                Cancel
              </button>
              {callingOrder.delivery?.phone && (
                <a
                  href={`tel:${callingOrder.delivery.phone}`}
                  onClick={() => setCallingOrder(null)}
                  className={`${primaryBtn} flex-1`}
                >
                  <Phone className="h-3 w-3" />
                  Call now
                </a>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
