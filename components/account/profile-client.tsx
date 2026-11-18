'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  UserRound,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Pencil,
  Package,
  MapPin,
  LockKeyhole,
  CheckCircle2,
} from 'lucide-react';

type AccountUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified?: boolean;
  role: string;
};

export default function ProfileClient({ user }: { user: AccountUser }) {
  const displayName = user.name?.trim() || 'Customer';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const roleLabel =
    user.role === 'admin' ? 'Administrator' : user.role === 'rider' ? 'Delivery rider' : 'Customer';

  const detailCard = 'rounded-xl border border-[#eeeae3] bg-white p-4 sm:p-5';

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-7 text-[#29241f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        {}
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold text-[#82796e] transition hover:text-[#986735]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to account
        </Link>

        {}
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
            ChunkNChop account
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#28231e] sm:text-[28px]">
            Personal information
          </h1>

          <p className="mt-1.5 text-[12px] text-[#89837b]">
            View your personal details and account verification status.
          </p>
        </header>

        {}
        <section className="overflow-hidden rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]">
          <div className="h-1 bg-gradient-to-r from-[#80532c] via-[#b68a5b] to-[#e2c7a5]" />

          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-[#f8f3ec] bg-[#eee2d2] text-lg font-bold text-[#916234]">
              {initials || <UserRound className="h-7 w-7" />}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-[17px] font-bold text-[#29241f]">{displayName}</h2>

              <p className="mt-1 flex items-center gap-1.5 break-all text-[11px] text-[#89837b]">
                <Mail className="h-3 w-3 shrink-0" />
                {user.email}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f6f0e8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8c6238]">
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-semibold ${
                    user.emailVerified
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {user.emailVerified ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <ShieldAlert className="h-3 w-3" />
                  )}
                  {user.emailVerified ? 'Verified email' : 'Email unverified'}
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 sm:block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf7f2] text-[#a17443]">
                <UserRound className="h-5 w-5" />
              </div>
            </div>
          </div>

          {}
          <div className="border-t border-[#f0ece6] px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-[#302a24]">Account details</h3>
              <p className="mt-1 text-[10px] text-[#928b82]">
                Information associated with your account.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={detailCard}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999187]">
                  <UserRound className="h-3.5 w-3.5" />
                  Full name
                </div>

                <p className="mt-3 break-words text-[12px] font-semibold text-[#393129]">
                  {user.name || 'Not provided'}
                </p>
              </div>

              <div className={detailCard}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999187]">
                  <Mail className="h-3.5 w-3.5" />
                  Email address
                </div>

                <p className="mt-3 break-all text-[12px] font-semibold text-[#393129]">
                  {user.email}
                </p>

                <div
                  className={`mt-2 flex items-center gap-1.5 text-[10px] font-semibold ${
                    user.emailVerified ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {user.emailVerified ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}

                  {user.emailVerified ? 'Your email is verified' : 'Your email is not verified'}
                </div>
              </div>

              <div className={detailCard}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999187]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Account type
                </div>

                <p className="mt-3 text-[12px] font-semibold text-[#393129]">{roleLabel}</p>
              </div>

              <div className={detailCard}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999187]">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Account security
                </div>

                <p className="mt-3 text-[12px] font-semibold text-[#393129]">
                  Authenticated account
                </p>
                <p className="mt-1 text-[10px] text-[#928b82]">
                  Your details are loaded from your active session.
                </p>
              </div>
            </div>
          </div>
        </section>

        {}
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-[#302a24]">Account shortcuts</h2>
            <p className="mt-1 text-[10px] text-[#928b82]">Quickly access your account services.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/account/orders"
              className="group flex items-center gap-3.5 rounded-xl border border-[#eeeae3] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#d9c3a8] hover:shadow-sm sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f1e9] text-[#986735]">
                <Package className="h-[19px] w-[19px]" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-bold text-[#302a24]">My orders</h3>
                <p className="mt-1 text-[10px] text-[#89837b]">View and track your orders.</p>
              </div>

              <ChevronRightIcon />
            </Link>

            <Link
              href="/account/addresses"
              className="group flex items-center gap-3.5 rounded-xl border border-[#eeeae3] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#d9c3a8] hover:shadow-sm sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f1e9] text-[#986735]">
                <MapPin className="h-[19px] w-[19px]" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-bold text-[#302a24]">Delivery addresses</h3>
                <p className="mt-1 text-[10px] text-[#89837b]">
                  Manage your saved delivery locations.
                </p>
              </div>

              <ChevronRightIcon />
            </Link>
          </div>
        </section>

        {}
        <section className="mt-6 rounded-xl border border-[#eadfce] bg-[#fbf7f0] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#986735]">
              <Pencil className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="text-[12px] font-bold text-[#393129]">Need to change your details?</h3>

              <p className="mt-1.5 text-[10px] leading-[1.8] text-[#81766a]">
                Profile editing is not currently enabled. Your account information is displayed
                directly from your authenticated session. You can still manage your saved delivery
                addresses.
              </p>

              <Link
                href="/account/addresses"
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#986735] transition hover:text-[#68431f]"
              >
                Manage delivery addresses
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {}
        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-[#eae5dc] pt-5 text-[10px] text-[#999187] sm:flex-row sm:items-center">
          <p>
            <span className="font-bold text-[#766b5e]">ChunkNChop</span> — Good food, delivered.
          </p>

          <Link href="/" className="font-semibold text-[#8a6745] transition hover:text-[#51371e]">
            Continue shopping →
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ChevronRightIcon() {
  return (
    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#b8afa4] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#986735]" />
  );
}
