'use client';

import { useState } from 'react';
import { roleOptions, StaffRole } from '@/lib/permission';

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SHIFTS = ['Morning', 'Afternoon', 'Night', 'Rotating'];

export function AddStaffModal({ open, onClose, onCreated }: AddStaffModalProps) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    staffRole: '' as StaffRole | '',
    shift: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.staffRole) {
      setError('Select a role for this staff member.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Try again.');
        return;
      }

      onCreated();
      onClose();
      setForm({ email: '', password: '', name: '', staffRole: '', shift: '' });
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-950 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-100">Add staff member</h2>
          <button onClick={onClose} className="rounded-md p-1 text-stone-500 hover:bg-stone-900 hover:text-stone-300" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-400">Full name</label>
            <input type="text" value={form.name} onChange={update('name')} placeholder="e.g. Adaeze Okonkwo" className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-400">Email</label>
            <input type="email" required value={form.email} onChange={update('email')} placeholder="name@chunknchop.com" className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-400">Temporary password</label>
            <input type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="Minimum 6 characters" className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-400">Role</label>
              <select required value={form.staffRole} onChange={update('staffRole')} className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-stone-600 focus:outline-none">
                <option value="" disabled>
                  Select role
                </option>
                {roleOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-400">Shift</label>
              <select value={form.shift} onChange={update('shift')} className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-stone-600 focus:outline-none">
                <option value="">Unassigned</option>
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="rounded-md border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm text-stone-400 hover:text-stone-200">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-white disabled:opacity-50">
              {submitting ? 'Adding…' : 'Add staff member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
