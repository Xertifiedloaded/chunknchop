'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  UserRound,
  MapPin,
  Package,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Store,
  Truck,
  Settings,
  Pencil,
  ArrowUpRight,
  CheckCircle2,
  Mail,
} from 'lucide-react';

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

type AccountClientProps = {
  user: AccountUser;
};

export default function AccountClient({ user }: AccountClientProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressError, setAddressError] = useState('');

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setAddressError('');

    try {
      const response = await fetch('/api/account/addresses', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent('/account')}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load your saved delivery addresses.');
      }

      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : 'Unable to load your delivery addresses.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const displayName = user.name?.trim() || 'Customer';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const defaultAddress = addresses.find((address) => address.isDefault);

  const roleLabel =
    user.role === 'admin' ? 'Administrator' : user.role === 'rider' ? 'Delivery rider' : 'Customer';

  const cardClass =
    'group flex min-h-[132px] gap-3.5 rounded-xl border border-[#eeeae3] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9c3a8] hover:shadow-[0_8px_25px_rgba(50,35,20,0.05)] sm:p-5';

  const iconClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f1e9] text-[#986735]';

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
              Welcome back, {displayName}. Manage your account and orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAddresses()}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e9e4dc] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#51483e] transition hover:bg-[#f7f4ef] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh account
          </button>
        </header>

        {}
        <section className="overflow-hidden rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]">
          <div className="h-1 bg-gradient-to-r from-[#80532c] via-[#b68a5b] to-[#e2c7a5]" />

          <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-[#f8f3ec] bg-[#eee2d2] text-base font-bold text-[#916234]">
                {initials || <UserRound className="h-6 w-6" />}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-bold text-[#29241f]">{displayName}</h2>

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
                </div>
              </div>
            </div>

            <Link
              href="/account/profile"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-[#e9e4dc] px-4 py-2.5 text-[11px] font-semibold text-[#51483e] transition hover:border-[#c9aa86] hover:bg-[#faf7f2]"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
              <ArrowUpRight className="h-3 w-3 text-[#a28b71]" />
            </Link>
          </div>
        </section>

        {}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#302a24]">Account management</h2>
              <p className="mt-1 text-[11px] text-[#928b82]">
                Everything you need, all in one place.
              </p>
            </div>

            <span className="text-[10px] font-medium text-[#a59c91]">YOUR ACCOUNT</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {}
            <Link href="/account/orders" className={cardClass}>
              <div className={iconClass}>
                <Package className="h-[19px] w-[19px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-bold text-[#302a24]">My orders</h3>
                  <ChevronRight className="h-4 w-4 text-[#b8afa4] transition group-hover:translate-x-1 group-hover:text-[#986735]" />
                </div>
                <p className="mt-2 text-[10px] leading-[1.7] text-[#8b857d]">
                  View your order history, payment status and delivery progress.
                </p>
                <span className="mt-3 inline-block text-[10px] font-bold text-[#a17443]">
                  View orders
                </span>
              </div>
            </Link>

            {}
            <Link href="/account/addresses" className={cardClass}>
              <div className={iconClass}>
                <MapPin className="h-[19px] w-[19px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-bold text-[#302a24]">Delivery addresses</h3>
                  <ChevronRight className="h-4 w-4 text-[#b8afa4] transition group-hover:translate-x-1 group-hover:text-[#986735]" />
                </div>
                <p className="mt-2 text-[10px] leading-[1.7] text-[#8b857d]">
                  Save and manage your home, office and other delivery locations.
                </p>
                <span className="mt-3 inline-block text-[10px] font-bold text-[#a17443]">
                  Manage addresses
                </span>
              </div>
            </Link>

            {}
            <Link href="/account/profile" className={cardClass}>
              <div className={iconClass}>
                <UserRound className="h-[19px] w-[19px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-bold text-[#302a24]">Personal information</h3>
                  <ChevronRight className="h-4 w-4 text-[#b8afa4] transition group-hover:translate-x-1 group-hover:text-[#986735]" />
                </div>
                <p className="mt-2 text-[10px] leading-[1.7] text-[#8b857d]">
                  Review your personal details and account information.
                </p>
                <span className="mt-3 inline-block text-[10px] font-bold text-[#a17443]">
                  View profile
                </span>
              </div>
            </Link>

            {}
            {user.role === 'rider' && (
              <Link href="/rider" className={cardClass}>
                <div className={iconClass}>
                  <Truck className="h-[19px] w-[19px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-[#302a24]">Rider dashboard</h3>
                    <ChevronRight className="h-4 w-4 text-[#b8afa4] transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-[10px] leading-[1.7] text-[#8b857d]">
                    Manage your rider profile and assigned deliveries.
                  </p>
                  <span className="mt-3 inline-block text-[10px] font-bold text-[#a17443]">
                    Open dashboard
                  </span>
                </div>
              </Link>
            )}

            {}
            {user.role === 'admin' && (
              <Link href="/admin" className={cardClass}>
                <div className={iconClass}>
                  <Settings className="h-[19px] w-[19px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-[#302a24]">Admin dashboard</h3>
                    <ChevronRight className="h-4 w-4 text-[#b8afa4] transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-[10px] leading-[1.7] text-[#8b857d]">
                    Manage your store, orders, customers and operations.
                  </p>
                  <span className="mt-3 inline-block text-[10px] font-bold text-[#a17443]">
                    Open dashboard
                  </span>
                </div>
              </Link>
            )}
          </div>
        </section>

        {}
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
              <div className="flex flex-col gap-4 rounded-lg border border-[#eee9e1] bg-[#fdfcf9] p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3eadf] text-[#986735]">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[11px] font-bold text-[#3c332a]">
                        {defaultAddress.label}
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        DEFAULT
                      </span>
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

                <Link
                  href="/account/addresses"
                  className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-[#986735] transition hover:text-[#68431f]"
                >
                  Edit address
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
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

        {}
        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-[#eae5dc] pt-5 text-[10px] text-[#999187] sm:flex-row sm:items-center">
          <p className="flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" />
            <span className="font-semibold text-[#766b5e]">ChunkNChop</span>
            <span>— Good food, delivered.</span>
          </p>

          <Link href="/" className="font-semibold text-[#8a6745] transition hover:text-[#51371e]">
            Continue shopping <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
