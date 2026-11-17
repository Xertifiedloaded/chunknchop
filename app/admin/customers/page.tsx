'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw, Users as UsersIcon, ShieldCheck, Bike, UserRound } from 'lucide-react';
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string | null;
};
type Summary = { total: number; customers: number; admins: number; riders: number };
const input =
  'w-full rounded-lg border border-[#e8e3de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C8552B]';
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, customers: 0, admins: 0, riders: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q, role });
      const r = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to load users');
      setUsers(d.users ?? []);
      setSummary(d.summary ?? { total: 0, customers: 0, admins: 0, riders: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }, [q, role]);
  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);
  return (
    <main className="min-h-screen bg-[#F7F8FA] p-3 text-[#302b27] sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#C8552B]">
              People
            </p>
            <h1 className="mt-1 text-2xl font-bold">Users</h1>
            <p className="mt-1 text-sm text-[#898078]">
              View registered customers, administrators and riders.
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e8e3de] bg-white px-3 text-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </header>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="All users" value={summary.total} icon={UsersIcon} />
          <Stat label="Customers" value={summary.customers} icon={UserRound} />
          <Stat label="Administrators" value={summary.admins} icon={ShieldCheck} />
          <Stat label="Riders" value={summary.riders} icon={Bike} />
        </section>
        <section className="overflow-hidden rounded-xl border border-[#ece7e2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#f0ece8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Registered accounts</h2>
              <p className="mt-1 text-xs text-[#898078]">
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
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name or email"
                  className={`${input} pl-9 sm:w-64`}
                />
              </div>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={input}>
                <option value="all">All roles</option>
                <option value="customer">Customers</option>
                <option value="admin">Administrators</option>
                <option value="rider">Riders</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="p-10 text-center text-sm text-[#898078]">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#898078]">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-[#faf9f7] text-xs text-[#898078]">
                  <tr>
                    {['User', 'Role', 'Email verification', 'Joined'].map((x) => (
                      <th key={x} className="px-4 py-3 font-medium">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece8]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#fdfcfb]">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#C8552B]">
                            {(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{u.name || 'Unnamed user'}</p>
                            <p className="truncate text-xs text-[#99918a]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#f3f1ee] px-2.5 py-1 text-xs font-semibold capitalize">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                        >
                          {u.emailVerified ? 'Verified' : 'Not verified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#716960]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-NG') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
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
    <div className="rounded-xl border border-[#ece7e2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#898078]">{label}</p>
        <span className="rounded-lg bg-orange-50 p-2 text-[#C8552B]">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value.toLocaleString('en-NG')}</p>
    </div>
  );
}
