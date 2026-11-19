'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Ticket,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Tag,
  ChevronRight,
} from 'lucide-react';

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
  'h-10 w-full min-w-0 rounded-md border border-[#eae6e0] bg-[#fdfcfb] px-3 text-[11px] text-[#302b27] outline-none transition placeholder:text-[#aaa19a] hover:border-[#d8d0c7] focus:border-brand focus:ring-2 focus:ring-brand/10';

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
      const response = await fetch('/api/admin/coupons', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load coupons');
      }

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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    const payload = {
      code: form.code.trim().toUpperCase(),
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

      if (!response.ok) {
        throw new Error(data.error || 'Could not save coupon');
      }

      setModal(false);
      setNotice(editing ? 'Coupon updated successfully.' : 'Coupon created successfully.');

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save coupon');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) {
      return;
    }

    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not delete coupon');
      }

      setNotice(`${coupon.code} deleted successfully.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete coupon');
    }
  };

  const toggle = async (coupon: Coupon) => {
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not update coupon');
      }

      setNotice(`${coupon.code} ${!coupon.active ? 'activated' : 'deactivated'}.`);

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update coupon');
    }
  };

  const visible = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = coupons.filter((c) => c.active !== false).length;

  const expiredCount = coupons.filter(
    (c) => c.active === false || (c.expiresAt && Date.parse(c.expiresAt) < Date.now()),
  ).length;

  return (
    <main className="min-h-screen bg-[#f8f8f6]  py-5 text-[#302b27] sm:px-5 lg:px-7 lg:py-7">
      <div className="mx-auto max-w-360 space-y-5">
        {}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand" />
              <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-brand">
                Marketing & Promotions
              </p>
            </div>

            <h1 className="text-[23px] font-semibold tracking-[-0.045em] text-[#292520] sm:text-[25px]">
              Coupons
            </h1>

            <p className="mt-1 text-[11px] leading-5 text-[#969087]">
              Create and manage promotional discounts for your customers.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-md bg-brand px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#ad4725] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:self-auto"
          >
            <Plus size={14} />
            Create coupon
          </button>
        </header>

        {}
        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-[#dcecdf] bg-[#f1f8f2] px-4 py-3">
            <p className="text-[11px] text-[#438052]">{notice}</p>
            <button
              onClick={() => setNotice('')}
              className="text-[#438052]"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && !modal && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-[11px] text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-700"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            label="All coupons"
            value={coupons.length}
            icon={<Ticket size={16} />}
            tone="orange"
            description="Total promotional codes"
          />

          <Stat
            label="Active coupons"
            value={activeCount}
            icon={<CheckCircle2 size={16} />}
            tone="green"
            description="Currently enabled"
          />

          <Stat
            label="Inactive / expired"
            value={expiredCount}
            icon={<CircleOff size={16} />}
            tone="gray"
            description="Disabled or past expiry"
          />
        </section>

        {}
        <section className="overflow-hidden rounded-lg border border-[#ece9e4] bg-white shadow-[0_2px_9px_rgba(35,30,25,0.025)]">
          <div className="flex flex-col gap-3 border-b border-[#f0ede9] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[12px] font-semibold text-[#37312c]">Coupon list</h2>
                <span className="rounded-full bg-[#f5f2ee] px-2 py-0.5 text-[9px] font-semibold text-[#777067]">
                  {visible.length}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[#999188]">
                View redemption limits, discounts and coupon validity.
              </p>
            </div>

            <div className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa39b]"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search coupon code..."
                  className={`${inputClass} pl-8`}
                />
              </div>

              <button
                onClick={() => void load()}
                disabled={loading}
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#eae6e0] bg-white text-[#716960] transition hover:bg-[#faf8f5] disabled:opacity-50"
                aria-label="Refresh coupons"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <RefreshCw size={17} className="animate-spin text-brand" />
              <p className="text-[10px] text-[#999188]">Loading coupons...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#fff2eb] text-brand">
                <Ticket size={19} />
              </span>

              <p className="text-[12px] font-semibold text-[#4a443e]">
                {search ? 'No matching coupons' : 'No coupons yet'}
              </p>

              <p className="mt-1 max-w-[270px] text-[10px] leading-5 text-[#a29b92]">
                {search
                  ? 'Try another coupon code or check your spelling.'
                  : 'Create your first promotional coupon to start offering discounts.'}
              </p>

              {!search && (
                <button
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand hover:underline"
                >
                  <Plus size={13} />
                  Create your first coupon
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#faf9f7]">
                  <tr>
                    {[
                      'Coupon code',
                      'Discount',
                      'Redemptions',
                      'Validity',
                      'Status',
                      'Actions',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.09em] text-[#969087]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f2efeb]">
                  {visible.map((coupon) => {
                    const expired = !!coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now();

                    const isActive = coupon.active !== false && !expired;

                    return (
                      <tr key={coupon.id} className="transition-colors hover:bg-[#fdfbf9]">
                        {}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#fff2eb] text-brand">
                              <Tag size={14} />
                            </span>

                            <div>
                              <p className="text-[11px] font-bold tracking-[0.04em] text-[#37312c]">
                                {coupon.code}
                              </p>
                              <p className="mt-0.5 text-[9px] text-[#aaa39b]">
                                Min. order {money(coupon.minOrderCents ?? 0)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-md bg-[#f7f4f0] px-2.5 py-1 text-[10px] font-semibold text-[#554c43]">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `${money(coupon.discountValue)} OFF`}
                          </span>

                          {coupon.maxDiscountCents != null && (
                            <p className="mt-1 text-[9px] text-[#999188]">
                              Max. {money(coupon.maxDiscountCents)}
                            </p>
                          )}
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <p className="text-[11px] font-semibold text-[#514a43]">
                            {coupon.usageCount ?? 0}
                            <span className="font-normal text-[#aaa39b]">
                              {' / '}
                              {coupon.usageLimit ?? '∞'}
                            </span>
                          </p>

                          {coupon.usageLimit != null && (
                            <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-[#f0ece7]">
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((coupon.usageCount ?? 0) / Math.max(1, coupon.usageLimit)) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-[#716960]">
                            <CalendarDays size={12} className="text-[#a49b92]" />
                            {coupon.expiresAt
                              ? new Date(coupon.expiresAt).toLocaleDateString('en-NG', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'No expiry'}
                          </div>

                          {coupon.startsAt && (
                            <p className="mt-1 text-[9px] text-[#aaa39b]">
                              Starts {new Date(coupon.startsAt).toLocaleDateString('en-NG')}
                            </p>
                          )}
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => void toggle(coupon)}
                            title="Click to change coupon status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold transition ${
                              isActive
                                ? 'bg-[#edf7ef] text-[#438052] hover:bg-[#e1f0e3]'
                                : 'bg-[#f3f1ee] text-[#777067] hover:bg-[#eae7e2]'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isActive ? 'bg-[#438052]' : 'bg-[#999188]'
                              }`}
                            />
                            {expired ? 'Expired' : isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(coupon)}
                              className="flex size-8 items-center justify-center rounded-md border border-[#eae6e0] text-[#716960] transition hover:border-[#e0c2b3] hover:bg-[#fff5ef] hover:text-brand"
                              aria-label={`Edit ${coupon.code}`}
                              title="Edit coupon"
                            >
                              <Pencil size={13} />
                            </button>

                            <button
                              onClick={() => void remove(coupon)}
                              className="flex size-8 items-center justify-center rounded-md border border-[#f0dfdc] text-[#bd6259] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              aria-label={`Delete ${coupon.code}`}
                              title="Delete coupon"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-1 border-t border-[#f0ede9] bg-[#fdfcfb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] text-[#a29b92]">
              Showing {visible.length} of {coupons.length} coupons
            </p>

            <p className="text-[9px] text-[#b0aaa2]">ChunknChop Promotions</p>
          </div>
        </section>
      </div>

      {}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#24211e]/45 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setModal(false);
            }
          }}
        >
          <form
            onSubmit={submit}
            className="max-h-[94dvh] w-full max-w-[570px] space-y-5 overflow-y-auto rounded-t-xl border border-[#efebe6] bg-white p-5 shadow-[0_20px_70px_rgba(0,0,0,0.16)] sm:rounded-lg sm:p-6"
          >
            {}
            <div className="flex items-start justify-between gap-3 border-b border-[#f0ede9] pb-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff2eb] text-brand">
                  <Ticket size={17} />
                </span>

                <div>
                  <h2 className="text-[14px] font-semibold tracking-[-0.02em] text-[#302b27]">
                    {editing ? 'Edit coupon' : 'Create a coupon'}
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-[#999188]">
                    Configure the discount and redemption conditions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModal(false)}
                disabled={saving}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#8c847b] transition hover:bg-[#f5f2ee] hover:text-[#37312c] disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5 text-[10px] leading-5 text-red-700">
                {error}
              </div>
            )}

            {}
            <div>
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[#a0988f]">
                Coupon details
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Coupon code">
                  <input
                    required
                    maxLength={32}
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase().replace(/\s/g, ''),
                      })
                    }
                    placeholder="WELCOME10"
                    className={inputClass}
                  />
                </Field>

                <Field label="Discount type">
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountType: e.target.value as FormState['discountType'],
                      })
                    }
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount (₦)</option>
                  </select>
                </Field>

                <Field
                  label={
                    form.discountType === 'percentage'
                      ? 'Discount percentage (%)'
                      : 'Discount amount (₦)'
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
                    placeholder={form.discountType === 'percentage' ? '10' : '1000'}
                    className={inputClass}
                  />
                </Field>

                <Field label="Minimum order amount (₦)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderNaira}
                    onChange={(e) => setForm({ ...form, minOrderNaira: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {}
            <div className="border-t border-[#f0ede9] pt-4">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[#a0988f]">
                Redemption rules
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Maximum discount (₦), optional">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscountNaira}
                    onChange={(e) => setForm({ ...form, maxDiscountNaira: e.target.value })}
                    placeholder="No maximum"
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
                    placeholder="Unlimited"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {}
            <div className="border-t border-[#f0ede9] pt-4">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[#a0988f]">
                Validity period
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>

            {}
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#eeeae5] bg-[#fdfcfb] px-3.5 py-3">
              <div>
                <p className="text-[11px] font-semibold text-[#514a43]">Coupon availability</p>
                <p className="mt-0.5 text-[9px] text-[#999188]">
                  Allow customers to redeem this coupon.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  form.active ? 'bg-brand' : 'bg-[#d6d0c9]'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                    form.active ? 'translate-x-[17px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {}
            <div className="flex flex-col-reverse gap-2 border-t border-[#f0ede9] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModal(false)}
                disabled={saving}
                className="h-10 rounded-md border border-[#eae6e0] px-5 text-[10px] font-semibold text-[#716960] transition hover:bg-[#f8f6f3] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-5 text-[10px] font-semibold text-white transition hover:bg-[#ad4725] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <RefreshCw size={12} className="animate-spin" />}
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create coupon'}
                {!saving && <ChevronRight size={13} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: 'orange' | 'green' | 'gray';
  description: string;
}) {
  const tones = {
    orange: 'bg-[#fff2eb] text-brand',
    green: 'bg-[#edf7ef] text-[#438052]',
    gray: 'bg-[#f2f0ed] text-[#777067]',
  };

  return (
    <div className="rounded-lg border border-[#ece9e4] bg-white p-4 shadow-[0_2px_9px_rgba(35,30,25,0.025)] transition hover:border-[#e0d8cf]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium text-[#89837b]">{label}</p>
          <p className="mt-2 text-[23px] font-semibold tracking-[-0.045em] text-[#302b27]">
            {value}
          </p>
        </div>

        <span className={`flex size-9 items-center justify-center rounded-md ${tones[tone]}`}>
          {icon}
        </span>
      </div>

      <p className="mt-3 text-[9px] text-[#a19b93]">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold text-[#716960]">{label}</span>
      {children}
    </label>
  );
}
