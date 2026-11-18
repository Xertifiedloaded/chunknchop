'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bike,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';

type Status = 'approved' | 'rejected' | 'pending';

type Rider = {
  id: string;
  phone: string;
  photoUrl?: string | null;
  vehicleType: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleColor: string;
  plateNumber: string;
  licenseNumber?: string | null;
  licenseImageUrl?: string | null;
  verificationStatus: Status | string;
  isActive: boolean;
  isAvailable: boolean;
  user: { name: string; email: string; role: string };
  zones: { zone: { name: string; city: string } }[];
};

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const statusStyle: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
};

const labelClass = 'text-[10px] font-bold uppercase tracking-wider text-[#999187]';
const outlineBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#e9e4dc] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#51483e] transition hover:border-[#c9aa86] hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:opacity-50';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#29231e] px-3.5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#493b2d] disabled:cursor-not-allowed disabled:opacity-50';
const dangerBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50';

function Spinner() {
  return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');

  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/riders', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? 'Unable to load riders');
      setRiders(d.riders ?? []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load riders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(
    r: Rider,
    action: string,
    verificationStatus: Status,
    isActive: boolean,
    success: string,
  ) {
    setPending(`${r.id}:${action}`);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/riders/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus, isActive }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? 'Unable to update rider');
      setMessage(`${r.user.name}: ${success}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update rider');
    } finally {
      setPending(null);
    }
  }

  const counts = useMemo(
    () => ({
      all: riders.length,
      pending: riders.filter((r) => r.verificationStatus === 'pending').length,
      approved: riders.filter((r) => r.verificationStatus === 'approved').length,
      rejected: riders.filter((r) => r.verificationStatus === 'rejected').length,
    }),
    [riders],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return riders.filter(
      (r) =>
        (filter === 'all' || r.verificationStatus === filter) &&
        (!q ||
          [r.user.name, r.user.email, r.phone, r.plateNumber].join(' ').toLowerCase().includes(q)),
    );
  }, [riders, filter, query]);

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-7 text-[#29241f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold text-[#82796e] transition hover:text-[#986735]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
              Administration
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#28231e] sm:text-[28px]">
              Rider management
            </h1>
            <p className="mt-1.5 text-[12px] text-[#89837b]">
              Review rider applications, approve accounts and control activation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={outlineBtn}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/70 p-4 text-[11px] text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-[11px] text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </p>
        )}

        {}
        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3.5 py-2 text-[11px] font-semibold transition ${
                  filter === f.key
                    ? 'bg-[#29231e] text-white'
                    : 'border border-[#e9e4dc] bg-white text-[#51483e] hover:bg-[#faf7f2]'
                }`}
              >
                {f.label} <span className="opacity-70">({counts[f.key]})</span>
              </button>
            ))}
          </div>
          <label className="relative block sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b8afa4]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone or plate"
              className="w-full rounded-lg border border-[#e9e4dc] bg-white py-2.5 pl-9 pr-3 text-[11px]"
            />
          </label>
        </section>

        {}
        {loading && !riders.length ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[#eae5dc] bg-white"
              />
            ))}
          </div>
        ) : visible.length ? (
          <div className="grid gap-3">
            {visible.map((r) => {
              const busy = pending?.startsWith(`${r.id}:`) ?? false;
              const isPending = r.verificationStatus === 'pending';
              const isApproved = r.verificationStatus === 'approved';
              const isRejected = r.verificationStatus === 'rejected';
              const vehicle = [r.vehicleBrand, r.vehicleModel].filter(Boolean).join(' ');
              return (
                <article
                  key={r.id}
                  className="overflow-hidden rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 items-start gap-3.5">
                        {r.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.photoUrl}
                            alt={r.user.name}
                            className="h-12 w-12 shrink-0 rounded-full border-[3px] border-[#f8f3ec] object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#f8f3ec] bg-[#eee2d2] text-[#916234]">
                            <UserRound className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="truncate text-[15px] font-bold text-[#29241f]">
                            {r.user.name}
                          </h2>
                          <p className="mt-1 flex items-center gap-1.5 break-all text-[11px] text-[#8b857d]">
                            <Mail className="h-3 w-3 shrink-0" />
                            {r.user.email}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8b857d]">
                            <Phone className="h-3 w-3 shrink-0" />
                            {r.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
                            statusStyle[r.verificationStatus] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {r.verificationStatus}
                        </span>
                        <span
                          className={`rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
                            r.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-[#f1eee9] text-[#8b857d]'
                          }`}
                        >
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {isApproved && (
                          <span
                            className={`rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
                              r.isAvailable
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-[#f1eee9] text-[#8b857d]'
                            }`}
                          >
                            {r.isAvailable ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-[#eeeae3] p-3.5">
                        <p className={`${labelClass} flex items-center gap-1.5`}>
                          <Bike className="h-3.5 w-3.5" />
                          Vehicle
                        </p>
                        <p className="mt-2 text-[12px] font-semibold capitalize text-[#393129]">
                          {r.vehicleType}
                          {vehicle && ` · ${vehicle}`}
                        </p>
                        <p className="mt-1 text-[11px] text-[#71685e]">
                          {r.vehicleColor} · {r.plateNumber}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#eeeae3] p-3.5">
                        <p className={labelClass}>Licence</p>
                        <p className="mt-2 text-[12px] font-semibold text-[#393129]">
                          {r.licenseNumber || 'Not provided'}
                        </p>
                        {r.licenseImageUrl ? (
                          <a
                            href={r.licenseImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-[11px] font-semibold text-[#986735] hover:underline"
                          >
                            View licence image
                          </a>
                        ) : (
                          <p className="mt-1 text-[11px] text-[#928b82]">No image uploaded</p>
                        )}
                      </div>
                      <div className="rounded-lg border border-[#eeeae3] p-3.5">
                        <p className={`${labelClass} flex items-center gap-1.5`}>
                          <MapPin className="h-3.5 w-3.5" />
                          Delivery zones
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {r.zones.length ? (
                            r.zones.map((z, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-[#f6f0e8] px-2.5 py-1 text-[10px] font-semibold text-[#8c6238]"
                              >
                                {z.zone.name}, {z.zone.city}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#928b82]">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-[#f0ece6] bg-[#fdfcf9] px-5 py-3.5 sm:px-6">
                    {}
                    {(isPending || isRejected) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void update(r, 'approve', 'approved', true, 'approved and activated.')
                        }
                        className={primaryBtn}
                      >
                        {pending === `${r.id}:approve` && <Spinner />}
                        {pending === `${r.id}:approve`
                          ? 'Approving…'
                          : isRejected
                            ? 'Approve instead'
                            : 'Approve & activate'}
                      </button>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Reject ${r.user.name}'s application?`))
                            void update(r, 'reject', 'rejected', false, 'application rejected.');
                        }}
                        className={dangerBtn}
                      >
                        {pending === `${r.id}:reject` && <Spinner />}
                        {pending === `${r.id}:reject` ? 'Rejecting…' : 'Reject'}
                      </button>
                    )}

                    {}
                    {isApproved && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !r.isActive ||
                            window.confirm(
                              `Deactivate ${r.user.name}? They will go offline and stop receiving deliveries.`,
                            )
                          )
                            void update(
                              r,
                              'toggle',
                              'approved',
                              !r.isActive,
                              r.isActive ? 'deactivated.' : 'activated.',
                            );
                        }}
                        className={r.isActive ? dangerBtn : primaryBtn}
                      >
                        {pending === `${r.id}:toggle` && <Spinner />}
                        {pending === `${r.id}:toggle`
                          ? r.isActive
                            ? 'Deactivating…'
                            : 'Activating…'
                          : r.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    )}

                    {isRejected && (
                      <span className="text-[10px] text-[#928b82]">
                        Rider can edit their details and resubmit for review.
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#e4ddd2] bg-white px-5 py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee4] text-[#a17a50]">
              <Bike className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[12px] font-bold text-[#393129]">No riders found</p>
            <p className="mt-1.5 text-[10px] text-[#918980]">
              {riders.length
                ? 'Try a different filter or search.'
                : 'Rider applications will appear here once submitted.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}