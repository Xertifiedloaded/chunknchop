'use client';
import { useCallback, useEffect, useState } from 'react';
import { Banknote, CalendarDays, Wallet, Save, RefreshCw } from 'lucide-react';
type Finance = {
  summary: { todayCents: number; weekCents: number; monthCents: number; lifetimeCents: number };
  history: {
    orderNumber: string;
    amountCents: number;
    deliveredAt: string;
    deliveryDate: string | null;
    deliveryWindow: string | null;
  }[];
};
type Bank = { accountName: string; bankName: string; accountNumber: string };
const money = (v: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(v / 100);
const field =
  'mt-1 h-10 w-full rounded-lg border border-[#e9e4dc] bg-white px-3 text-[12px] outline-none focus:border-[#a17443]';
export default function RiderFinancePanel() {
  const [data, setData] = useState<Finance | null>(null);
  const [month, setMonth] = useState(
    new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' }),
  );
  const [bank, setBank] = useState<Bank>({ accountName: '', bankName: '', accountNumber: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const [e, b] = await Promise.all([
      fetch(`/api/rider/earnings?month=${month}`, { cache: 'no-store' }),
      fetch('/api/rider/bank-details', { cache: 'no-store' }),
    ]);
    const [ed, bd] = await Promise.all([e.json(), b.json()]);
    if (!e.ok) throw new Error(ed.error ?? 'Unable to load earnings');
    if (!b.ok) throw new Error(bd.error ?? 'Unable to load bank details');
    setData(ed);
    if (bd.bankDetails) setBank(bd.bankDetails);
  }, [month]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function save() {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const r = await fetch('/api/rider/bank-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bank),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Unable to save bank details');
      setNotice('Bank details saved securely.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }
  const stats = [
    ['Today', data?.summary.todayCents ?? 0],
    ['This week', data?.summary.weekCents ?? 0],
    ['This month', data?.summary.monthCents ?? 0],
    ['Lifetime', data?.summary.lifetimeCents ?? 0],
  ] as const;
  return (
    <section className="mt-8 space-y-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#302a24]">Earnings overview</h2>
            <p className="mt-1 text-[11px] text-[#928b82]">
              You earn 100% of the delivery fee on completed deliveries.
            </p>
          </div>
          <Wallet className="h-5 w-5 text-[#a17443]" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#eae5dc] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#999187]">
                {label}
              </p>
              <p className="mt-2 text-xl font-bold text-[#29241f]">{money(value)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[#eae5dc] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold">Delivery earnings history</h3>
            <p className="mt-1 text-[10px] text-[#928b82]">
              Only successfully delivered orders count as earnings.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-[#71685e]">
            <CalendarDays size={14} />
            <input
              aria-label="Filter earnings by month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 rounded-lg border border-[#e9e4dc] px-2 text-[11px]"
            />
          </label>
        </div>
        <div className="mt-4 divide-y divide-[#f0ece6]">
          {data?.history.length ? (
            data.history.map((row) => (
              <div
                key={row.orderNumber}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-[11px] font-semibold">{row.orderNumber}</p>
                  <p className="mt-1 text-[10px] text-[#928b82]">
                    {new Date(row.deliveredAt).toLocaleString('en-NG')} {row.deliveryWindow ?? ''}
                  </p>
                </div>
                <p className="text-[12px] font-bold text-emerald-700">+{money(row.amountCents)}</p>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-[11px] text-[#928b82]">
              No completed deliveries for this month.
            </p>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[#eae5dc] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-[#a17443]" />
          <div>
            <h3 className="text-[14px] font-bold">Payout bank account</h3>
            <p className="mt-1 text-[10px] text-[#928b82]">
              Add the account where your delivery earnings should be paid.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-semibold text-[#71685e]">
            Name on account
            <input
              className={field}
              value={bank.accountName}
              onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
              placeholder="Account holder's full name"
            />
          </label>
          <label className="text-[10px] font-semibold text-[#71685e]">
            Bank name
            <input
              className={field}
              value={bank.bankName}
              onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
              placeholder="e.g. Access Bank"
            />
          </label>
          <label className="text-[10px] font-semibold text-[#71685e] sm:col-span-2">
            10-digit account number
            <input
              className={field}
              inputMode="numeric"
              maxLength={10}
              value={bank.accountNumber}
              onChange={(e) =>
                setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              placeholder="0123456789"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-[11px] text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-[11px] text-emerald-700">
            {notice}
          </p>
        )}
        <button
          onClick={() => void save()}
          disabled={busy}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#29231e] px-4 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          <Save size={14} />
          {busy ? 'Saving…' : 'Save bank details'}
        </button>
      </div>
    </section>
  );
}
