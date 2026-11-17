
'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Search,
  RefreshCw,
  Users as UsersIcon,
  ShieldCheck,
  Bike,
  UserRound,
  Plus,
  X,
  Mail,
  LoaderCircle,
  CheckCircle2,
} from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string | null;
};

type Summary = {
  total: number;
  customers: number;
  admins: number;
  riders: number;
};

const input =
  'h-10 w-full rounded-lg border border-[#e8e3de] bg-white px-3 text-[13px] text-[#302b27] outline-none transition-colors placeholder:text-[#aaa29a] focus:border-[#C8552B]';

const button =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    customers: 0,
    admins: 0,
    riders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('customer');
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ q, role });
      const response = await fetch(`/api/admin/users?${params}`, {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load users.');
      }

      setUsers(data.users ?? []);
      setSummary(
        data.summary ?? {
          total: 0,
          customers: 0,
          admins: 0,
          riders: 0,
        },
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to load users.',
      );
    } finally {
      setLoading(false);
    }
  }, [q, role]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Could not send invitation.');
      }

      setInviteSuccess(data.message || 'Invitation sent successfully.');
      setInviteEmail('');

      await load();
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : 'Could not send invitation.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8FA] p-3 text-[#302b27] sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#C8552B]">
              People management
            </p>
            <h1 className="mt-1 text-[22px] font-bold tracking-tight">
              Users
            </h1>
            <p className="mt-1 text-[12px] text-[#898078]">
              Manage customers, administrators and delivery riders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className={`${button} border border-[#e8e3de] bg-white text-[#514b46] hover:bg-[#faf9f7]`}
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setShowInvite(true);
                setInviteError('');
                setInviteSuccess('');
              }}
              className={`${button} bg-[#C8552B] text-white hover:bg-[#a9442c]`}
            >
              <Plus size={15} />
              Create account
            </button>
          </div>
        </header>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
            {error}
          </p>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label="All users" value={summary.total} icon={UsersIcon} />
          <Stat label="Customers" value={summary.customers} icon={UserRound} />
          <Stat label="Administrators" value={summary.admins} icon={ShieldCheck} />
          <Stat label="Riders" value={summary.riders} icon={Bike} />
        </section>

        <section className="overflow-hidden rounded-xl border border-[#ece7e2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#f0ece8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[14px] font-semibold">Registered accounts</h2>
              <p className="mt-1 text-[11px] text-[#898078]">
                {users.length} matching account{users.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99918a]"
                />
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search name or email"
                  className={`${input} pl-9 sm:w-64`}
                />
              </div>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className={input}
              >
                <option value="all">All roles</option>
                <option value="customer">Customers</option>
                <option value="admin">Administrators</option>
                <option value="rider">Riders</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-10 text-center text-[12px] text-[#898078]">
              Loading users…
            </p>
          ) : users.length === 0 ? (
            <p className="p-10 text-center text-[12px] text-[#898078]">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-[#faf9f7] text-[10px] uppercase tracking-wide text-[#898078]">
                  <tr>
                    {['User', 'Role', 'Email verification', 'Joined'].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ece8]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#fdfcfb]">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[12px] font-bold text-[#C8552B]">
                            {(user.name || user.email || 'U')
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold">
                              {user.name || 'Unnamed user'}
                            </p>
                            <p className="truncate text-[11px] text-[#99918a]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#f3f1ee] px-2.5 py-1 text-[10px] font-semibold capitalize">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            user.emailVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[11px] text-[#716960]">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-NG')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !sending) {
              setShowInvite(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
            className="w-full max-w-[440px] rounded-xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-orange-50 text-[#C8552B]">
                  <Mail size={17} />
                </span>
                <h2 id="invite-title" className="text-[17px] font-bold">
                  Create an account
                </h2>
                <p className="mt-1 text-[11px] leading-5 text-[#898078]">
                  Send an invitation so the recipient can verify their email and set a password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={sending}
                aria-label="Close"
                className="rounded-lg p-2 text-[#898078] hover:bg-[#f5f3f0]"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={createInvitation} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold text-[#514b46]">
                  Email address
                </span>
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="person@example.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className={input}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold text-[#514b46]">
                  Account role
                </span>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                  className={input}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Administrator</option>
                  <option value="rider">Delivery rider</option>
                </select>
              </label>

              <div className="rounded-lg border border-[#f0ece8] bg-[#faf9f7] p-3">
                <p className="text-[11px] font-semibold text-[#514b46]">
                  What happens next?
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#898078]">
                  The recipient gets an eight-digit email code. They will use it to verify their invitation, enter their name and create a password.
                </p>
              </div>

              {inviteError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-[11px] text-red-700">
                  {inviteError}
                </p>
              )}

              {inviteSuccess && (
                <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-[11px] text-emerald-700">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  {inviteSuccess}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setShowInvite(false)}
                  className={`${button} border border-[#e8e3de] bg-white text-[#514b46]`}
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className={`${button} bg-[#C8552B] text-white hover:bg-[#a9442c]`}
                >
                  {sending ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      Sending invitation…
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      Send invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof UsersIcon;
}) {
  return (
    <div className="rounded-xl border border-[#ece7e2] bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-[#898078]">{label}</p>
        <span className="rounded-lg bg-orange-50 p-2 text-[#C8552B]">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 text-[22px] font-bold tracking-tight">
        {value.toLocaleString('en-NG')}
      </p>
    </div>
  );
}
