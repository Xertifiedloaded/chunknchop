'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Search, RefreshCw, Clock3, CircleCheck, CircleX } from 'lucide-react';

type Payment = {
  id: string;
  orderNumber: string;
  customerName?: string;
  email?: string;
  paymentStatus?: string;
  status?: string;
  subtotalCents?: number;
  currency?: string;
  paymentReference?: string;
  paymentTransactionId?: string | number;
  createdAt?: string;
  paidAt?: string;
};
type Analytics = {
  revenueCents: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
  totalCount: number;
  averagePaymentCents: number;
  successRate: number;
  daily: { date: string; revenueCents: number; count: number }[];
};
const naira = (k = 0) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(k / 100);
const input =
  'w-full rounded-lg border border-[#e8e3de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C8552B]';
export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('30');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q, status, range });
      const r = await fetch(`/api/admin/payments?${params}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to load payments');
      setPayments(d.payments ?? []);
      setAnalytics(d.analytics ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load payments');
    } finally {
      setLoading(false);
    }
  }, [q, status, range]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);
  const max = Math.max(1, ...(analytics?.daily ?? []).map((d) => d.revenueCents));
  return (
    <main className="min-h-screen bg-[#F7F8FA] p-3 text-[#302b27] sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#C8552B]">
              Finance
            </p>
            <h1 className="mt-1 text-2xl font-bold">Payments</h1>
            <p className="mt-1 text-sm text-[#898078]">
              Payment transactions, collection performance and revenue analytics.
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
          {[
            ['Collected revenue', naira(analytics?.revenueCents), CreditCard],
            ['Successful payments', analytics?.paidCount ?? '—', CircleCheck],
            ['Pending payments', analytics?.pendingCount ?? '—', Clock3],
            ['Failed payments', analytics?.failedCount ?? '—', CircleX],
          ].map(([label, value, Icon]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-[#ece7e2] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#898078]">{String(label)}</p>
                <span className="rounded-lg bg-orange-50 p-2 text-[#C8552B]">
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-3 text-xl font-bold">{String(value)}</p>
            </div>
          ))}
        </section>
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-[#ece7e2] bg-white p-4 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">Revenue trend</h2>
                <p className="mt-1 text-xs text-[#898078]">
                  Paid transactions grouped by payment date
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {analytics?.successRate ?? 0}% success rate
              </span>
            </div>
            <div className="mt-5 flex h-48 items-end gap-1 overflow-x-auto pb-5">
              {(analytics?.daily ?? []).map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${naira(day.revenueCents)}`}
                  className="flex h-full min-w-4 flex-1 flex-col justify-end"
                >
                  <div
                    className="w-full rounded-t bg-[#C8552B] hover:bg-[#ad4725]"
                    style={{ height: `${Math.max(2, (day.revenueCents / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#99918a]">
              <span>{analytics?.daily[0]?.date ?? 'No data'}</span>
              <span>{analytics?.daily.at(-1)?.date ?? ''}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#ece7e2] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Payment summary</h2>
            <p className="mt-1 text-xs text-[#898078]">For the selected period</p>
            <div className="mt-5 space-y-4">
              <Metric label="Average payment" value={naira(analytics?.averagePaymentCents ?? 0)} />
              <Metric label="Total transactions" value={analytics?.totalCount ?? 0} />
              <Metric label="Successful" value={analytics?.paidCount ?? 0} />
              <Metric label="Failed" value={analytics?.failedCount ?? 0} />
            </div>
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-[#ece7e2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#f0ece8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">All payments</h2>
              <p className="mt-1 text-xs text-[#898078]">
                Transactions recorded against customer orders
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99918a]"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search order or customer"
                  className={`${input} pl-9`}
                />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select value={range} onChange={(e) => setRange(e.target.value)} className={input}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="p-10 text-center text-sm text-[#898078]">Loading payments…</p>
          ) : payments.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#898078]">
              No payment transactions found for these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#faf9f7] text-xs text-[#898078]">
                  <tr>
                    {['Order', 'Customer', 'Reference', 'Amount', 'Status', 'Date'].map((x) => (
                      <th key={x} className="px-4 py-3 font-medium">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece8]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fdfcfb]">
                      <td className="px-4 py-3 font-semibold">{p.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p>{p.customerName || 'Customer'}</p>
                        <p className="text-xs text-[#99918a]">{p.email}</p>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-xs text-[#716960]">
                        {p.paymentReference || p.paymentTransactionId || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">{naira(p.subtotalCents)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : p.paymentStatus === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                        >
                          {p.paymentStatus ?? 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#716960]">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleString('en-NG')
                          : p.createdAt
                            ? new Date(p.createdAt).toLocaleString('en-NG')
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
    </main>
  );
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#f0ece8] pb-3 last:border-0">
      <span className="text-xs text-[#898078]">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
