'use client';

import Link from 'next/link';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  UserRound,
  MapPin,
  Package,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Store,
  Truck,
  Settings,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  Phone,
  Bike,
  Clock,
  LockKeyhole,
} from 'lucide-react';
import RiderRegisterModal from '../rider/rider-registration';

type AccountUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified?: boolean;
  role: 'admin' | 'rider' | 'customer' | string;
};

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  area: string;
  city: string;
  state: string;
  postalCode?: string | null;
  instructions?: string | null;
  isDefault: boolean;
};

type RiderProfile = {
  phone: string;
  photoUrl?: string | null;
  residentialAddress: string;
  vehicleType: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleColor: string;
  plateNumber: string;
  licenseNumber?: string | null;
  licenseImageUrl?: string | null;
  verificationStatus: 'pending' | 'approved' | 'rejected' | string;
  isActive: boolean;
  isAvailable: boolean;
  locationUpdatedAt?: string | null;
  zones?: { zone: { id: string; name: string; city: string; state?: string | null } }[];
};

const cardClass =
  'group flex min-h-[132px] gap-3.5 rounded-xl border border-[#eeeae3] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9c3a8] hover:shadow-[0_8px_25px_rgba(50,35,20,0.05)] sm:p-5';
const iconClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f1e9] text-[#986735]';
const detailCard = 'rounded-xl border border-[#eeeae3] bg-white p-4 sm:p-5';
const labelClass =
  'flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999187]';
const valueClass = 'mt-3 break-words text-[12px] font-semibold text-[#393129]';

function ShortcutCard({
  href,
  onClick,
  icon,
  title,
  text,
  cta,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  text: string;
  cta: string;
}) {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    href ? (
      <Link href={href} className={cardClass}>
        {children}
      </Link>
    ) : (
      <button type="button" onClick={onClick} className={`${cardClass} w-full text-left`}>
        {children}
      </button>
    );
  return (
    <Wrapper>
      <div className={iconClass}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-bold text-[#302a24]">{title}</h3>
          <ChevronRight className="h-4 w-4 text-[#b8afa4] transition group-hover:translate-x-1 group-hover:text-[#986735]" />
        </div>
        <p className="mt-2 text-[10px] leading-[1.7] text-[#8b857d]">{text}</p>
        <span className="mt-3 inline-block text-[10px] font-bold text-[#a17443]">{cta}</span>
      </div>
    </Wrapper>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className={detailCard}>
      <div className={labelClass}>
        {icon}
        {label}
      </div>
      <div className={valueClass}>{children}</div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-[15px] font-bold text-[#302a24]">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] text-[#928b82]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AccountClient({ user }: { user: AccountUser }) {
  const isRider = user.role === 'rider';
  const isAdmin = user.role === 'admin';
  const isCustomer = !isRider && !isAdmin;

   
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(isCustomer);
  const [addressError, setAddressError] = useState('');

   
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [riderLoading, setRiderLoading] = useState(isRider);
  const [riderError, setRiderError] = useState('');
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const handleUnauthorized = () => {
    window.location.href = `/sign-in?returnTo=${encodeURIComponent('/account')}`;
  };

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setAddressError('');
    try {
      const response = await fetch('/api/account/addresses', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) return handleUnauthorized();
      if (!response.ok)
        throw new Error(data.error || 'Unable to load your saved delivery addresses.');
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : 'Unable to load your delivery addresses.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRider = useCallback(async () => {
    setRiderLoading(true);
    setRiderError('');
    try {
      const response = await fetch('/api/rider/profile', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) return handleUnauthorized();
      if (!response.ok) throw new Error(data.error || 'Unable to load your rider profile.');
      setRider(data.profile ?? null);
    } catch (error) {
      setRiderError(error instanceof Error ? error.message : 'Unable to load your rider profile.');
    } finally {
      setRiderLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCustomer) void loadAddresses();
    if (isRider) void loadRider();
  }, [isCustomer, isRider, loadAddresses, loadRider]);

  async function toggleAvailability() {
    if (!rider) return;
    setTogglingAvailability(true);
    setRiderError('');
    try {
      const response = await fetch('/api/rider/availability', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !rider.isAvailable }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update availability.');
      setRider({ ...rider, isAvailable: Boolean(data.isAvailable) });
    } catch (error) {
      setRiderError(error instanceof Error ? error.message : 'Unable to update availability.');
    } finally {
      setTogglingAvailability(false);
    }
  }

  const refresh = () => {
    if (isCustomer) void loadAddresses();
    if (isRider) void loadRider();
  };
  const refreshing = loading || riderLoading;

  const displayName =
    user.name?.trim() || (isAdmin ? 'Administrator' : isRider ? 'Rider' : 'Customer');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const roleLabel = isAdmin ? 'Administrator' : isRider ? 'Delivery rider' : 'Customer';
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

  const statusStyles: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-7 text-[#29241f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {}
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
              ChunkNChop
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#28231e] sm:text-[28px]">
              My account
            </h1>
            <p className="mt-1.5 text-[12px] text-[#89837b]">
              Welcome back, {displayName}.{' '}
              {isAdmin
                ? 'Manage your store and operations.'
                : isRider
                  ? 'Manage your rider profile and deliveries.'
                  : 'Manage your account and orders.'}
            </p>
          </div>

          {!isAdmin && (
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e9e4dc] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#51483e] transition hover:bg-[#f7f4ef] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh account
            </button>
          )}
        </header>

        {}
        <section className="overflow-hidden rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]">
          <div className="h-1 bg-gradient-to-r from-[#80532c] via-[#b68a5b] to-[#e2c7a5]" />
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            {isRider && rider?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rider.photoUrl}
                alt={displayName}
                className="h-14 w-14 shrink-0 rounded-full border-[3px] border-[#f8f3ec] object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-[#f8f3ec] bg-[#eee2d2] text-base font-bold text-[#916234]">
                {initials || <UserRound className="h-6 w-6" />}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-[15px] font-bold text-[#29241f]">{displayName}</h2>
              <p className="mt-1 flex items-center gap-1.5 break-all text-[11px] text-[#8b857d]">
                <Mail className="h-3 w-3 shrink-0" />
                {user.email}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f6f0e8] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8c6238]">
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-semibold ${
                    user.emailVerified
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {user.emailVerified ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {user.emailVerified ? 'Verified email' : 'Email unverified'}
                </span>
                {isRider && rider && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-semibold capitalize ${
                      statusStyles[rider.verificationStatus] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Rider {rider.verificationStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#f0ece6] p-5 sm:grid-cols-3 sm:p-6">
            <Field icon={<UserRound className="h-3.5 w-3.5" />} label="Full name">
              {user.name || 'Not provided'}
            </Field>
            <Field icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Account type">
              {roleLabel}
            </Field>
            <Field icon={<LockKeyhole className="h-3.5 w-3.5" />} label="Email status">
              <span className={user.emailVerified ? 'text-emerald-700' : 'text-amber-700'}>
                {user.emailVerified ? 'Your email is verified' : 'Your email is not verified'}
              </span>
            </Field>
          </div>
        </section>

        {}
        {isRider && (
          <>
            <section className="mt-8">
              <SectionHeader
                title="Rider information"
                subtitle="Your registration, vehicle and delivery zone details."
                action={
                  rider && (
                    <button
                      type="button"
                      onClick={toggleAvailability}
                      disabled={
                        togglingAvailability ||
                        rider.verificationStatus !== 'approved' ||
                        !rider.isActive
                      }
                      title={
                        rider.verificationStatus !== 'approved' || !rider.isActive
                          ? 'Your account must be approved and active to go online'
                          : undefined
                      }
                      className={`inline-flex w-fit items-center gap-2 rounded-lg px-3.5 py-2.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        rider.isAvailable
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'border border-[#e9e4dc] bg-white text-[#51483e] hover:bg-[#f7f4ef]'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${rider.isAvailable ? 'bg-white' : 'bg-[#b8afa4]'}`}
                      />
                      {togglingAvailability
                        ? 'Updating…'
                        : rider.isAvailable
                          ? 'Online – tap to go offline'
                          : 'Offline – tap to go online'}
                    </button>
                  )
                }
              />

              {riderError && (
                <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/70 p-4 text-[11px] text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{riderError}</p>
                </div>
              )}

              {riderLoading ? (
                <div className="flex items-center gap-2.5 py-5 text-[11px] text-[#89837b]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading your rider profile...
                </div>
              ) : !rider ? (
                <div className="rounded-lg border border-dashed border-[#e4ddd2] bg-white px-5 py-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee4] text-[#a17a50]">
                    <Bike className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-[12px] font-bold text-[#393129]">
                    Complete your rider registration
                  </h3>
                  <p className="mt-1.5 text-[10px] text-[#918980]">
                    Submit your vehicle and zone details so an administrator can approve you.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRegisterOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#29231e] px-4 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#493b2d]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Register as a rider
                  </button>
                </div>
              ) : (
                <>
                  {rider.verificationStatus !== 'approved' && (
                    <div
                      className={`mb-3 rounded-lg p-4 text-[11px] ${
                        statusStyles[rider.verificationStatus] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {rider.verificationStatus === 'pending'
                        ? 'Your application is awaiting administrator review. You can go online once approved.'
                        : 'Your application was not approved. Update your details and resubmit.'}{' '}
                      <button
                        type="button"
                        onClick={() => setRegisterOpen(true)}
                        className="font-bold underline"
                      >
                        Edit registration
                      </button>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
                      {rider.phone}
                    </Field>
                    <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Residential address">
                      {rider.residentialAddress}
                    </Field>
                    <Field icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Verification">
                      <span className="capitalize">{rider.verificationStatus}</span>
                      {' · '}
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </Field>
                    <Field icon={<Bike className="h-3.5 w-3.5" />} label="Vehicle">
                      <span className="capitalize">{rider.vehicleType}</span>
                      {[rider.vehicleBrand, rider.vehicleModel].filter(Boolean).length > 0 &&
                        ` · ${[rider.vehicleBrand, rider.vehicleModel].filter(Boolean).join(' ')}`}
                      <br />
                      <span className="font-normal text-[#71685e]">{rider.vehicleColor}</span>
                    </Field>
                    <Field icon={<Truck className="h-3.5 w-3.5" />} label="Plate number">
                      {rider.plateNumber}
                    </Field>
                    <Field icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Licence number">
                      {rider.licenseNumber || 'Not provided'}
                    </Field>
                    <div className={`${detailCard} sm:col-span-2 lg:col-span-2`}>
                      <div className={labelClass}>
                        <MapPin className="h-3.5 w-3.5" />
                        Delivery zones
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rider.zones?.length ? (
                          rider.zones.map(({ zone }) => (
                            <span
                              key={zone.id}
                              className="rounded-full bg-[#f6f0e8] px-2.5 py-1 text-[10px] font-semibold text-[#8c6238]"
                            >
                              {zone.name}, {zone.city}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#928b82]">No zones selected</span>
                        )}
                      </div>
                    </div>
                    <Field icon={<Clock className="h-3.5 w-3.5" />} label="Last location update">
                      {rider.locationUpdatedAt
                        ? new Date(rider.locationUpdatedAt).toLocaleString()
                        : 'Never'}
                    </Field>
                  </div>
                </>
              )}
            </section>

            <section className="mt-8">
              <SectionHeader title="Deliveries" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ShortcutCard
                  href="/rider"
                  icon={<Truck className="h-[19px] w-[19px]" />}
                  title="Rider dashboard"
                  text="View assigned deliveries, update status and share live location."
                  cta="Open dashboard"
                />
                <ShortcutCard
                  onClick={() => setRegisterOpen(true)}
                  icon={<Bike className="h-[19px] w-[19px]" />}
                  title="Edit rider details"
                  text="Update your vehicle, documents and delivery zones. Changes need re-approval."
                  cta="Edit registration"
                />
              </div>
            </section>
          </>
        )}

        {}
        {isAdmin && (
          <section className="mt-8">
            <SectionHeader title="Administration" subtitle="Tools for running the store." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ShortcutCard
                href="/admin"
                icon={<Settings className="h-[19px] w-[19px]" />}
                title="Admin dashboard"
                text="Manage your store, orders, customers and operations."
                cta="Open dashboard"
              />
              <ShortcutCard
                href="/admin/orders"
                icon={<Package className="h-[19px] w-[19px]" />}
                title="Orders"
                text="Review, assign riders to and track all customer orders."
                cta="Manage orders"
              />
              <ShortcutCard
                href="/admin/riders"
                icon={<Truck className="h-[19px] w-[19px]" />}
                title="Riders"
                text="Approve rider applications and manage active riders and zones."
                cta="Manage riders"
              />
            </div>
          </section>
        )}

        {}
        {isCustomer && (
          <>
            <section className="mt-8">
              <SectionHeader
                title="Account management"
                subtitle="Everything you need, all in one place."
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ShortcutCard
                  href="/account/orders"
                  icon={<Package className="h-[19px] w-[19px]" />}
                  title="My orders"
                  text="View your order history, payment status and delivery progress."
                  cta="View orders"
                />
                <ShortcutCard
                  href="/account/addresses"
                  icon={<MapPin className="h-[19px] w-[19px]" />}
                  title="Delivery addresses"
                  text="Save and manage your home, office and other delivery locations."
                  cta="Manage addresses"
                />
              </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-xl border border-[#eae5dc] bg-white">
              <div className="flex flex-col justify-between gap-3 border-b border-[#f0ece6] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="text-[14px] font-bold text-[#302a24]">Default delivery address</h2>
                  <p className="mt-1 text-[10px] text-[#928b82]">
                    Your preferred location for order deliveries.
                  </p>
                </div>
                <Link
                  href="/account/addresses"
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#29231e] px-3.5 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#493b2d]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Manage addresses
                </Link>
              </div>

              <div className="p-5 sm:p-6">
                {loading ? (
                  <div className="flex items-center gap-2.5 py-5 text-[11px] text-[#89837b]">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading your saved address...
                  </div>
                ) : addressError ? (
                  <div className="flex flex-col justify-between gap-3 rounded-lg border border-red-100 bg-red-50/70 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-2.5 text-[11px] text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{addressError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadAddresses()}
                      className="w-fit text-[11px] font-bold text-red-700 underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : defaultAddress ? (
                  <div className="flex items-start gap-3 rounded-lg border border-[#eee9e1] bg-[#fdfcf9] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3eadf] text-[#986735]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[11px] font-bold text-[#3c332a]">
                          {defaultAddress.label}
                        </h3>
                        {defaultAddress.isDefault && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-[#51483e]">
                        {defaultAddress.fullName}
                      </p>
                      <p className="mt-1 text-[10px] text-[#89837b]">{defaultAddress.phone}</p>
                      <p className="mt-2 max-w-xl text-[11px] leading-[1.8] text-[#71685e]">
                        {defaultAddress.addressLine1}
                        {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}
                        <br />
                        {defaultAddress.area}, {defaultAddress.city}, {defaultAddress.state}
                        {defaultAddress.postalCode ? ` ${defaultAddress.postalCode}` : ''}
                      </p>
                      {defaultAddress.instructions && (
                        <p className="mt-2 text-[10px] leading-5 text-[#968d82]">
                          <span className="font-semibold">Instructions:</span>{' '}
                          {defaultAddress.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[#e4ddd2] px-5 py-8 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee4] text-[#a17a50]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-[12px] font-bold text-[#393129]">
                      No delivery address saved
                    </h3>
                    <p className="mt-1.5 text-[10px] text-[#918980]">
                      Add an address to make your next checkout faster.
                    </p>
                    <Link
                      href="/account/addresses"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#29231e] px-4 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#493b2d]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add delivery address
                    </Link>
                  </div>
                )}

                {!loading && !addressError && addresses.length > 1 && (
                  <p className="mt-3 text-[10px] text-[#928b82]">
                    You have {addresses.length} saved delivery addresses.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-[#eae5dc] pt-5 text-[10px] text-[#999187] sm:flex-row sm:items-center">
          <p className="flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#766b5e]">ChunkNChop</span>
            <span>— Good food, delivered.</span>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold text-[#8a6745] transition hover:text-[#51371e]"
          >
            Continue shopping <ArrowUpRight className="h-3 w-3" />
          </Link>
        </footer>
      </div>

      {isRider && (
        <RiderRegisterModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onSuccess={() => void loadRider()}
          initial={rider ? { ...rider, zoneIds: rider.zones?.map((z) => z.zone.id) ?? [] } : null}
        />
      )}
    </main>
  );
}