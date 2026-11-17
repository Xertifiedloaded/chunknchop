'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Search, Pencil, Trash2, X, Ticket, RefreshCw } from 'lucide-react';

type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderCents?: number;
  maxDiscountCents?: number | null;
  usageLimit?: number | null;
  usageCount?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
};
type FormState = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderNaira: string;
  maxDiscountNaira: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  active: boolean;
};
const emptyForm: FormState = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderNaira: '0',
  maxDiscountNaira: '',
  usageLimit: '',
  startsAt: '',
  expiresAt: '',
  active: true,
};
const money = (kobo = 0) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(kobo / 100);
const inputClass =
  'w-full min-w-0 rounded-lg border border-[#e8e3de] bg-white px-3 py-2.5 text-sm text-[#302b27] outline-none transition placeholder:text-[#aaa19a] focus:border-[#C8552B] focus:ring-2 focus:ring-[#C8552B]/10';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/coupons', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load coupons');
      setCoupons(data.coupons ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModal(true);
  };
  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(
        coupon.discountType === 'fixed' ? coupon.discountValue / 100 : coupon.discountValue,
      ),
      minOrderNaira: String((coupon.minOrderCents ?? 0) / 100),
      maxDiscountNaira:
        coupon.maxDiscountCents == null ? '' : String(coupon.maxDiscountCents / 100),
      usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
      startsAt: coupon.startsAt?.slice(0, 10) ?? '',
      expiresAt: coupon.expiresAt?.slice(0, 10) ?? '',
      active: coupon.active !== false,
    });
    setError('');
    setModal(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      code: form.code,
      discountType: form.discountType,
      discountValue:
        form.discountType === 'fixed'
          ? Math.round(Number(form.discountValue) * 100)
          : Math.round(Number(form.discountValue)),
      minOrderCents: Math.round(Number(form.minOrderNaira || 0) * 100),
      maxDiscountCents: form.maxDiscountNaira
        ? Math.round(Number(form.maxDiscountNaira) * 100)
        : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      active: form.active,
    };
    try {
      const response = await fetch(
        editing ? `/api/admin/coupons/${editing.id}` : '/api/admin/coupons',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save coupon');
      setModal(false);
      setNotice(editing ? 'Coupon updated.' : 'Coupon created.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save coupon');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete coupon');
      setNotice(`${coupon.code} deleted.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete coupon');
    }
  };
  const toggle = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update coupon');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update coupon');
    }
  };
  const visible = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#F7F8FA] p-3 text-[#302b27] sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#C8552B]">
              Marketing
            </p>
            <h1 className="mt-1 text-2xl font-bold">Coupons</h1>
            <p className="mt-1 text-sm text-[#898078]">
              Create, edit and manage promotional discount codes.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C8552B] px-4 text-sm font-semibold text-white hover:bg-[#b94a25]"
          >
            <Plus size={16} /> Create coupon
          </button>
        </header>
        {notice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        )}
        {error && !modal && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="All coupons" value={coupons.length} />
          <Stat label="Active" value={coupons.filter((c) => c.active).length} />
          <Stat
            label="Inactive / expired"
            value={
              coupons.filter(
                (c) => !c.active || (c.expiresAt && Date.parse(c.expiresAt) < Date.now()),
              ).length
            }
          />
        </section>
        <section className="overflow-hidden rounded-xl border border-[#ece7e2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#f0ece8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Coupon list</h2>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1 sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a69d95]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search coupon code"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <button
                onClick={() => void load()}
                className="rounded-lg border border-[#e8e3de] px-3 text-[#716960] hover:bg-gray-50"
                aria-label="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-10 text-center text-sm text-[#898078]">Loading coupons…</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center">
              <Ticket className="mx-auto text-[#c9bfb6]" />
              <p className="mt-2 text-sm font-medium">No coupons found</p>
              <p className="mt-1 text-xs text-[#99918a]">
                Create your first coupon to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#faf9f7] text-xs text-[#898078]">
                  <tr>
                    {['Code', 'Discount', 'Usage', 'Validity', 'Status', 'Actions'].map((x) => (
                      <th key={x} className="px-4 py-3 font-medium">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece8]">
                  {visible.map((c) => (
                    <tr key={c.id} className="hover:bg-[#fdfcfb]">
                      <td className="px-4 py-3">
                        <p className="font-bold tracking-wide">{c.code}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}%`
                          : money(c.discountValue)}
                      </td>
                      <td className="px-4 py-3 text-[#716960]">
                        {c.usageCount ?? 0} / {c.usageLimit ?? '∞'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#716960]">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString('en-NG')
                          : 'No expiry'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void toggle(c)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="rounded-md border border-[#e8e3de] p-2 hover:bg-gray-50"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => void remove(c)}
                            className="rounded-md border border-red-100 p-2 text-red-600 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form
            onSubmit={submit}
            className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editing ? 'Edit coupon' : 'Create coupon'}</h2>
                <p className="text-xs text-[#898078]">Set the discount and redemption rules.</p>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Coupon code">
                <input
                  required
                  maxLength={32}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  className={inputClass}
                />
              </Field>
              <Field label="Discount type">
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value as FormState['discountType'] })
                  }
                  className={inputClass}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₦)</option>
                </select>
              </Field>
              <Field
                label={
                  form.discountType === 'percentage' ? 'Discount percentage' : 'Discount amount (₦)'
                }
              >
                <input
                  required
                  type="number"
                  min={form.discountType === 'percentage' ? 1 : 0.01}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step={form.discountType === 'percentage' ? 1 : 0.01}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Minimum order (₦)">
                <input
                  type="number"
                  min="0"
                  value={form.minOrderNaira}
                  onChange={(e) => setForm({ ...form, minOrderNaira: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Maximum discount (₦), optional">
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscountNaira}
                  onChange={(e) => setForm({ ...form, maxDiscountNaira: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Usage limit, optional">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Starts on">
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Expires on">
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#514a44]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-[#C8552B]"
              />{' '}
              Coupon is active
            </label>
            <div className="flex flex-col-reverse gap-2 border-t border-[#f0ece8] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="rounded-lg border border-[#e8e3de] px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-[#C8552B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#ece7e2] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#898078]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-[#716960]">{label}</span>
      {children}
    </label>
  );
}
