'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  Clock3,
  CircleCheck,
  CircleX,
  TrendingUp,
  Wallet,
  Activity,
} from 'lucide-react';

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
  items?: {
    name: string;
    quantity?: number;
    imageUrl?: string;
  }[];
};

type Analytics = {
  revenueCents: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
  totalCount: number;
  averagePaymentCents: number;
  successRate: number;
  daily: {
    date: string;
    revenueCents: number;
    count: number;
  }[];
};

const naira = (k = 0) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(k / 100);

const input =
  'h-9 w-full min-w-0 rounded-md border border-[#eae7e2] bg-[#fdfcfb] px-3 text-[11px] text-[#37332e] outline-none transition-all placeholder:text-[#aaa39b] hover:border-[#d8d1c9] focus:border-[#c8552b] focus:ring-2 focus:ring-[#c8552b]/10';

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

      const response = await fetch(`/api/admin/payments?${params}`, {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load payments');
      }

      setPayments(data.payments ?? []);
      setAnalytics(data.analytics ?? null);
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

  const max = Math.max(1, ...(analytics?.daily ?? []).map((day) => day.revenueCents));

  const stats = [
    {
      label: 'Collected revenue',
      value: naira(analytics?.revenueCents),
      detail: 'Successfully collected',
      icon: Wallet,
      tone: 'orange',
    },
    {
      label: 'Successful payments',
      value: analytics?.paidCount ?? '—',
      detail: 'Completed transactions',
      icon: CircleCheck,
      tone: 'green',
    },
    {
      label: 'Pending payments',
      value: analytics?.pendingCount ?? '—',
      detail: 'Awaiting confirmation',
      icon: Clock3,
      tone: 'amber',
    },
    {
      label: 'Failed payments',
      value: analytics?.failedCount ?? '—',
      detail: 'Unsuccessful transactions',
      icon: CircleX,
      tone: 'red',
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f8f8f6] px-3 py-5 text-[#302b27] sm:px-5 lg:px-7 lg:py-7">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#c8552b]" />
              <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[#c8552b]">
                Finance & Reports
              </p>
            </div>

            <h1 className="text-[23px] font-semibold tracking-[-0.045em] text-[#292520] sm:text-[25px]">
              Payments
            </h1>

            <p className="mt-1 text-[11px] leading-5 text-[#969087]">
              Monitor transactions, collections and payment performance.
            </p>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-md border border-[#e9e5df] bg-white px-3.5 text-[11px] font-semibold text-[#5d554d] shadow-sm transition hover:border-[#d6c9bd] hover:bg-[#fdfbf9] disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh data
          </button>
        </header>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-[11px] leading-5 text-red-700">{error}</p>
            <button
              onClick={() => void load()}
              className="shrink-0 text-[10px] font-semibold text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            const tones = {
              orange: 'bg-[#fff2eb] text-[#c8552b]',
              green: 'bg-[#edf7ef] text-[#34804c]',
              amber: 'bg-[#fff7e8] text-[#b77a22]',
              red: 'bg-[#fff0ef] text-[#c34c42]',
            };

            return (
              <div
                key={item.label}
                className="rounded-lg border border-[#ece9e4] bg-white p-4 shadow-[0_2px_9px_rgba(35,30,25,0.025)] transition hover:border-[#e0d8cf]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[#89837b]">{item.label}</p>
                    <p className="mt-2 text-[21px] font-semibold tracking-[-0.045em] text-[#302b27]">
                      {item.value}
                    </p>
                  </div>

                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-md ${tones[item.tone]}`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-[9px] text-[#a19b93]">
                  <span className="size-1 rounded-full bg-[#c8c1b8]" />
                  {item.detail}
                </p>
              </div>
            );
          })}
        </section>

        {}
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <div className="min-w-0 rounded-lg border border-[#ece9e4] bg-white p-4 shadow-[0_2px_9px_rgba(35,30,25,0.025)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-[#c8552b]" />
                  <h2 className="text-[12px] font-semibold text-[#37312c]">Revenue overview</h2>
                </div>
                <p className="mt-1 text-[10px] text-[#999188]">
                  Daily successful payment collections
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6f0e7] bg-[#f2f8f2] px-2.5 py-1.5 text-[9px] font-semibold text-[#438052]">
                <Activity size={11} />
                {analytics?.successRate ?? 0}% success rate
              </span>
            </div>

            <div className="mt-5 flex h-44 items-end gap-1.5 overflow-x-auto border-b border-[#f0ede9] pb-2">
              {(analytics?.daily ?? []).map((day) => {
                const percentage = (day.revenueCents / max) * 100;

                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${naira(day.revenueCents)} · ${day.count} payments`}
                    className="group flex h-full min-w-[9px] flex-1 flex-col justify-end"
                  >
                    <div
                      className="w-full rounded-t-[3px] bg-[#e8a083] transition-colors group-hover:bg-[#c8552b]"
                      style={{
                        height: `${Math.max(percentage > 0 ? 3 : 0, percentage)}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between text-[9px] text-[#aaa39b]">
              <span>{analytics?.daily[0]?.date ?? 'No data'}</span>
              <span>{analytics?.daily.at(-1)?.date ?? ''}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#ece9e4] bg-white p-4 shadow-[0_2px_9px_rgba(35,30,25,0.025)] sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-[#fff2eb] text-[#c8552b]">
                <CreditCard size={14} />
              </span>
              <h2 className="text-[12px] font-semibold text-[#37312c]">Payment summary</h2>
            </div>

            <p className="mt-1 text-[10px] text-[#999188]">Performance for selected period</p>

            <div className="mt-5 space-y-4">
              <Metric label="Average payment" value={naira(analytics?.averagePaymentCents ?? 0)} />
              <Metric label="Total transactions" value={analytics?.totalCount ?? 0} />
              <Metric label="Successful" value={analytics?.paidCount ?? 0} tone="green" />
              <Metric label="Failed" value={analytics?.failedCount ?? 0} tone="red" />
            </div>
          </div>
        </section>

        {}
        <section className="overflow-hidden rounded-lg border border-[#ece9e4] bg-white shadow-[0_2px_9px_rgba(35,30,25,0.025)]">
          <div className="flex flex-col gap-3 border-b border-[#f0ede9] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[12px] font-semibold text-[#37312c]">All transactions</h2>
                <span className="rounded-full bg-[#f5f2ee] px-2 py-0.5 text-[9px] font-semibold text-[#777067]">
                  {payments.length}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[#999188]">
                Customer payments and order transaction records
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[480px]">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa39b]"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search transactions..."
                  className={`${input} pl-8`}
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
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <RefreshCw size={18} className="animate-spin text-[#c8552b]" />
              <p className="text-[10px] text-[#999188]">Loading transactions...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#f7f4f0] text-[#aaa097]">
                <CreditCard size={19} />
              </span>
              <p className="text-[12px] font-semibold text-[#4a443e]">No transactions found</p>
              <p className="mt-1 max-w-[260px] text-[10px] leading-5 text-[#a29b92]">
                No payment records match your current search and filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#faf9f7]">
                  <tr>
                    {['Product', 'Customer', 'Payment reference', 'Amount', 'Status', 'Date'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.09em] text-[#969087]"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f2efeb]">
                  {payments.map((payment) => {
                    const paymentStatus = (
                      payment.paymentStatus ??
                      payment.status ??
                      'pending'
                    ).toLowerCase();

                    const isPaid = paymentStatus === 'paid';
                    const isFailed = paymentStatus === 'failed';

                    return (
                      <tr key={payment.id} className="transition-colors hover:bg-[#fdfbf9]">
                        {}
                        <td className="px-4 py-3.5">
                          <div className="flex min-w-[190px] flex-col gap-2">
                            {payment.items?.length ? (
                              <>
                                {payment.items.slice(0, 2).map((item, index) => (
                                  <div
                                    key={`${item.name}-${index}`}
                                    className="flex items-center gap-2.5"
                                  >
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        loading="lazy"
                                        className="size-9 shrink-0 rounded-md border border-[#eee9e3] bg-[#faf9f7] object-cover"
                                      />
                                    ) : (
                                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff2eb] text-[11px] font-semibold text-[#c8552b]">
                                        {item.name?.charAt(0).toUpperCase() || 'P'}
                                      </span>
                                    )}

                                    <div className="min-w-0">
                                      <p className="max-w-[190px] truncate text-[10px] font-semibold text-[#37312c]">
                                        {item.name || 'Unnamed product'}
                                      </p>
                                      <p className="mt-0.5 text-[9px] text-[#999188]">
                                        Qty: {item.quantity ?? 1}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                {payment.items.length > 2 && (
                                  <span className="pl-11 text-[9px] font-medium text-[#c8552b]">
                                    +{payment.items.length - 2} more products
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-[#999188]">
                                Product information unavailable
                              </span>
                            )}
                          </div>
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <p className="max-w-[160px] truncate text-[11px] font-medium text-[#514a43]">
                            {payment.customerName || 'Customer'}
                          </p>
                          <p className="mt-0.5 max-w-[160px] truncate text-[9px] text-[#a39c93]">
                            {payment.email || '—'}
                          </p>
                        </td>

                        {}
                        <td className="max-w-[170px] truncate px-4 py-3.5 text-[10px] text-[#898178]">
                          {payment.paymentReference || payment.paymentTransactionId || '—'}
                        </td>

                        {}
                        <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold text-[#37312c]">
                          {naira(payment.subtotalCents)}
                        </td>

                        {}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                              isPaid
                                ? 'bg-[#edf7ef] text-[#438052]'
                                : isFailed
                                  ? 'bg-[#fff0ef] text-[#bd4e45]'
                                  : 'bg-[#fff7e8] text-[#a87827]'
                            }`}
                          >
                            <span
                              className={`size-1 rounded-full ${
                                isPaid ? 'bg-[#438052]' : isFailed ? 'bg-[#bd4e45]' : 'bg-[#c18b34]'
                              }`}
                            />
                            {paymentStatus}
                          </span>
                        </td>

                        {}
                        <td className="whitespace-nowrap px-4 py-3.5 text-[10px] text-[#898178]">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleString('en-NG')
                            : payment.createdAt
                              ? new Date(payment.createdAt).toLocaleString('en-NG')
                              : '—'}
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
              Showing {payments.length} transaction
              {payments.length === 1 ? '' : 's'}
            </p>
            <p className="text-[9px] text-[#b0aaa2]">ChunknChop Finance</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'green' | 'red';
}) {
  const valueTone = {
    default: 'text-[#37312c]',
    green: 'text-[#438052]',
    red: 'text-[#bd4e45]',
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#f1eeea] pb-3 last:border-0 last:pb-0">
      <span className="text-[10px] text-[#89837b]">{label}</span>
      <span className={`text-[12px] font-semibold tabular-nums ${valueTone[tone]}`}>{value}</span>
    </div>
  );
}
