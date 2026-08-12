'use client';

import { useEffect, useMemo, useState } from 'react';
import { ROLE_META, StaffRole, roleOptions } from '@/lib/permission';
import { RoleBadge } from './RoleBadge';
import { AddStaffModal } from './AddStaffModal';

interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  staffRole: StaffRole | null;
  department: string | null;
  shift: string | null;
}

export function StaffTable() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  async function loadStaff() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to load staff');
      const data = await res.json();
      setStaff(data);
    } catch {
      setError('Could not load staff members. Try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchesRole = roleFilter === 'ALL' || s.staffRole === roleFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.staffRole ? ROLE_META[s.staffRole].label.toLowerCase().includes(q) : false);
      return matchesRole && matchesSearch;
    });
  }, [staff, search, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input type="text" placeholder="Search by name, email, or role" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none" />

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'ALL')} className="w-full max-w-[180px] rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-stone-600 focus:outline-none">
            <option value="ALL">All roles</option>
            {roleOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => setModalOpen(true)} className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-white">
          + Add staff member
        </button>
      </div>

      {error && <p className="rounded-md border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{error}</p>}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-stone-800 sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/60 text-xs font-medium tracking-wide text-stone-500 uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Shift</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-stone-500">
                  Loading staff…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-stone-500">
                  No staff members match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((s, idx) => (
                <tr key={s.id} className={`border-b border-stone-900 ${idx % 2 === 0 ? '' : 'bg-stone-900/30'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-stone-100">{s.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-stone-400">{s.email}</td>
                  <td className="px-4 py-3">{s.staffRole ? <RoleBadge staffRole={s.staffRole} /> : '—'}</td>
                  <td className="px-4 py-3 text-sm text-stone-400">{s.shift ?? 'Unassigned'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {loading ? (
          <p className="py-6 text-center text-sm text-stone-500">Loading staff…</p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">No staff members match your filters.</p>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-100">{s.name ?? '—'}</p>
                  <p className="text-xs text-stone-500">{s.email}</p>
                </div>
                {s.staffRole && <RoleBadge staffRole={s.staffRole} />}
              </div>
              <p className="mt-2 text-xs text-stone-500">Shift: {s.shift ?? 'Unassigned'}</p>
            </div>
          ))
        )}
      </div>

      <AddStaffModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={loadStaff} />
    </div>
  );
}
