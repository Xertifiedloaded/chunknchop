'use client';
import { useCallback, useEffect, useState } from 'react';
import { Banknote, RefreshCw, Search, Wallet, CheckCircle2, Clock3 } from 'lucide-react';
type Rider = {
  riderId: string;
  profileId: string;
  name: string;
  email: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  earnedCents: number;
  paidCents: number;
  unpaidCents: number;
  deliveryCount: number;
};
type Delivery = {
  orderNumber: string;
  riderId: string;
  amountCents: number;
  deliveredAt: string | null;
};
type Payout = {
  _id: string;
  riderId: string;
  amountCents: number;
  reference: string;
  note?: string;
  paidAt: string;
  paidBy: string;
};
const money = (v: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(v / 100);
const input =
  'h-10 w-full rounded-lg border border-[#e8e3dc] bg-white px-3 text-[11px] outline-none focus:border-[#a17443]';
export default function RiderPayoutsPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [month, setMonth] = useState(
    new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' }),
  );
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Rider | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/rider-payouts?month=${month}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Unable to load rider payouts');
      setRiders(d.riders ?? []);
      setPayouts(d.payouts ?? []);
      setDeliveries(d.deliveries ?? []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load data');
    } finally {
      setLoading(false);
    }
  }, [month]);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = riders.filter((r) =>
    `${r.name} ${r.email} ${r.bankName}`.toLowerCase().includes(query.toLowerCase()),
  );
  const totals = riders.reduce(
    (a, r) => ({
      earned: a.earned + r.earnedCents,
      paid: a.paid + r.paidCents,
      unpaid: a.unpaid + r.unpaidCents,
    }),
    { earned: 0, paid: 0, unpaid: 0 },
  );
  async function pay() {
    if (!selected) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/rider-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: selected.riderId,
          amountCents: Math.round(Number(amount) * 100),
          reference,
          note,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Unable to record payout');
      setMessage(`Payout of ${money(d.payout.amountCents)} recorded for ${selected.name}.`);
      setSelected(null);
      setAmount('');
      setReference('');
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record payout');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#f8f8f6]  py-6 text-[#302b27] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-brand">
              Rider finance
            </p>
            <h1 className="mt-1 text-2xl font-bold">Rider payments</h1>
            <p className="mt-1 text-[11px] text-[#928b82]">
              Review completed delivery earnings and record bank transfers.
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e8e3dc] bg-white px-3 text-[11px] font-semibold"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </header>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 p-3 text-[11px] text-red-700"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[11px] text-emerald-800"
          >
            {message}
          </p>
        )}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ['Total earned', totals.earned, Wallet],
            ['Total paid', totals.paid, CheckCircle2],
            ['Outstanding', totals.unpaid, Clock3],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-xl border border-[#eae5dc] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#928b82]">{label}</p>
                <Icon size={17} className="text-brand" />
              </div>
              <p className="mt-2 text-2xl font-bold">{money(value)}</p>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-[#eae5dc] bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-bold">Rider balances</h2>
              <p className="mt-1 text-[10px] text-[#928b82]">
                Riders earn 100% of the delivery fee once an order is marked delivered.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-[#a59c91]" />
              <input
                className={`${input} pl-9`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rider or bank"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-[11px]">
              <thead className="border-y border-[#f0ece6] text-[9px] uppercase tracking-wide text-[#928b82]">
                <tr>
                  {[
                    'Rider',
                    'Bank account',
                    'Deliveries',
                    'Earned',
                    'Paid',
                    'Outstanding',
                    'Action',
                  ].map((x) => (
                    <th key={x} className="px-3 py-3 font-semibold">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece6]">
                {filtered.map((r) => (
                  <tr key={r.riderId}>
                    <td className="px-3 py-3">
                      <p className="font-bold">{r.name}</p>
                      <p className="mt-1 text-[10px] text-[#928b82]">{r.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      {r.bankName ? (
                        <>
                          <p className="font-semibold">{r.bankAccountName}</p>
                          <p className="mt-1 text-[#928b82]">
                            {r.bankName} · {r.bankAccountNumber}
                          </p>
                        </>
                      ) : (
                        <span className="text-amber-700">Bank details not provided</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{r.deliveryCount}</td>
                    <td className="px-3 py-3 font-semibold">{money(r.earnedCents)}</td>
                    <td className="px-3 py-3">{money(r.paidCents)}</td>
                    <td className="px-3 py-3 font-bold text-emerald-700">{money(r.unpaidCents)}</td>
                    <td className="px-3 py-3">
                      <button
                        disabled={!r.unpaidCents || !r.bankAccountNumber}
                        onClick={() => {
                          setSelected(r);
                          setAmount((r.unpaidCents / 100).toFixed(2));
                        }}
                        className="rounded-lg bg-[#29231e] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-40"
                      >
                        Record payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !filtered.length && (
              <p className="py-8 text-center text-[11px] text-[#928b82]">No riders found.</p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-[#eae5dc] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-bold">Completed delivery history</h2>
              <p className="mt-1 text-[10px] text-[#928b82]">
                Filter completed rider deliveries by month.
              </p>
            </div>
            <input
              aria-label="Filter delivery history by month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 rounded-lg border border-[#e8e3dc] px-2 text-[11px]"
            />
          </div>
          <div className="mt-3 divide-y divide-[#f0ece6]">
            {deliveries.length ? (
              deliveries.map((d) => (
                <div
                  key={d.orderNumber}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-[11px] font-semibold">{d.orderNumber}</p>
                    <p className="mt-1 text-[10px] text-[#928b82]">
                      {riders.find((r) => r.riderId === d.riderId)?.name ?? 'Rider'} ·{' '}
                      {d.deliveredAt
                        ? new Date(d.deliveredAt).toLocaleString('en-NG')
                        : 'Date unavailable'}
                    </p>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700">{money(d.amountCents)}</p>
                </div>
              ))
            ) : (
              <p className="py-5 text-center text-[11px] text-[#928b82]">
                No completed deliveries for this month.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-[#eae5dc] bg-white p-4">
          <h2 className="text-[14px] font-bold">Payment history</h2>
          <div className="mt-3 divide-y divide-[#f0ece6]">
            {payouts.length ? (
              payouts.map((p) => {
                const rider = riders.find((r) => r.riderId === p.riderId);
                return (
                  <div
                    key={p._id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="text-[11px] font-semibold">
                        {rider?.name ?? 'Rider'} · {p.reference}
                      </p>
                      <p className="mt-1 text-[10px] text-[#928b82]">
                        {new Date(p.paidAt).toLocaleString('en-NG')} {p.note ? `· ${p.note}` : ''}
                      </p>
                    </div>
                    <p className="text-[12px] font-bold text-emerald-700">{money(p.amountCents)}</p>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-[11px] text-[#928b82]">
                No rider payouts recorded yet.
              </p>
            )}
          </div>
        </section>
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-[16px] font-bold">Record rider payment</h2>
            <p className="mt-1 text-[11px] text-[#928b82]">
              {selected.name} · Outstanding {money(selected.unpaidCents)}
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-[#faf8f5] p-3 text-[11px]">
                <p className="font-semibold">{selected.bankAccountName}</p>
                <p className="mt-1">
                  {selected.bankName} · {selected.bankAccountNumber}
                </p>
              </div>
              <label className="block text-[10px] font-semibold">
                Amount in naira
                <input
                  className={`${input} mt-1`}
                  type="number"
                  min="0.01"
                  max={(selected.unpaidCents / 100).toFixed(2)}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block text-[10px] font-semibold">
                Bank transfer reference
                <input
                  className={`${input} mt-1`}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Transaction reference"
                />
              </label>
              <label className="block text-[10px] font-semibold">
                Note (optional)
                <input
                  className={`${input} mt-1`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Payment note"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="h-9 rounded-lg border border-[#e8e3dc] px-4 text-[11px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => void pay()}
                disabled={
                  busy ||
                  !reference.trim() ||
                  !(Number(amount) > 0) ||
                  Number(amount) * 100 > selected.unpaidCents
                }
                className="h-9 rounded-lg bg-[#29231e] px-4 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Confirm payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
