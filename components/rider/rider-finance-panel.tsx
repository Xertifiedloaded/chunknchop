'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  Wallet,
  Save,
  Package,
  RefreshCw,
  LoaderCircle,
} from 'lucide-react';

type FinanceHistoryItem = {
  name?: string;
};

type FinanceHistory = {
  orderNumber: string;
  orderName?: string;
  items?: FinanceHistoryItem[];
  amountCents: number;
  deliveredAt: string;
  deliveryDate: string | null;
  deliveryWindow: string | null;
};

type Finance = {
  summary: {
    todayCents: number;
    weekCents: number;
    monthCents: number;
    lifetimeCents: number;
  };
  history: FinanceHistory[];
};

type Bank = {
  accountName: string;
  bankName: string;
  accountNumber: string;
};

const money = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value / 100);

const field =
  'mt-1 h-9 w-full rounded-lg border border-[#e9e4dc] bg-white px-3 text-[10px] text-[#393129] outline-none transition placeholder:text-[#b2aaa0] focus:border-[#a17443]';

function getOrderName(row: FinanceHistory) {
  if (row.orderName?.trim()) return row.orderName;

  const names = row.items
    ?.map((item) => item.name?.trim())
    .filter((item): item is string => Boolean(item));

  if (names?.length) {
    if (names.length === 1) return names[0];
    return `${names[0]} + ${names.length - 1} more`;
  }

  return 'Delivery order';
}

function formatDeliveredAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function RiderFinancePanel() {
  const [data, setData] = useState<Finance | null>(null);

  const [month, setMonth] = useState(
    new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
    }),
  );

  const [bank, setBank] = useState<Bank>({
    accountName: '',
    bankName: '',
    accountNumber: '',
  });

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [earningsResponse, bankResponse] = await Promise.all([
      fetch(`/api/rider/earnings?month=${month}`, {
        cache: 'no-store',
      }),
      fetch('/api/rider/bank-details', {
        cache: 'no-store',
      }),
    ]);

    const [earningsData, bankData] = await Promise.all([
      earningsResponse.json().catch(() => ({})),
      bankResponse.json().catch(() => ({})),
    ]);

    if (!earningsResponse.ok) {
      throw new Error(earningsData.error ?? 'Unable to load earnings');
    }

    if (!bankResponse.ok) {
      throw new Error(bankData.error ?? 'Unable to load bank details');
    }

    setData(earningsData);

    if (bankData.bankDetails) {
      setBank(bankData.bankDetails);
    }
  }, [month]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError('');

      try {
        await load();
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Unable to load finance details');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [load]);

  async function save() {
    setBusy(true);
    setNotice('');
    setError('');

    try {
      const response = await fetch('/api/rider/bank-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bank),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to save bank details');
      }

      setNotice('Bank details saved securely.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save bank details');
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
    <section className="space-y-4">
      {}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-[#302a24]">Earnings overview</h2>
            <p className="mt-1 text-[9px] text-[#928b82]">
              You earn 100% of the delivery fee on completed deliveries.
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5eee4]">
            <Wallet className="h-4 w-4 text-[#a17443]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#eae5dc] bg-white p-3">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-[#999187]">
                {label}
              </p>

              <p className="mt-2 text-[16px] font-bold tracking-tight text-[#29241f]">
                {money(value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="rounded-xl border border-[#eae5dc] bg-white p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h3 className="text-[12px] font-bold text-[#302a24]">Delivery earnings history</h3>
            <p className="mt-1 text-[9px] text-[#928b82]">
              Completed deliveries and their earnings.
            </p>
          </div>

          <label className="flex items-center gap-1.5 text-[9px] text-[#71685e]">
            <CalendarDays className="h-3 w-3" />
            <input
              aria-label="Filter earnings by month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="h-8 rounded-lg border border-[#e9e4dc] px-2 text-[9px] outline-none focus:border-[#a17443]"
            />
          </label>
        </div>

        <div className="mt-3 divide-y divide-[#f0ece6]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[9px] text-[#928b82]">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#a17443]" />
              Loading earnings...
            </div>
          ) : data?.history?.length ? (
            data.history.map((row) => (
              <div key={row.orderNumber} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5eee4] text-[#a17443]">
                    <Package className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-[#393129]">
                      {getOrderName(row)}
                    </p>

                    <p className="mt-1 break-all text-[8px] font-medium text-[#8d8378]">
                      {row.orderNumber}
                    </p>

                    <p className="mt-1 text-[8px] text-[#a29a90]">
                      {formatDeliveredAt(row.deliveredAt)}
                      {row.deliveryWindow ? ` · ${row.deliveryWindow}` : ''}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-[11px] font-bold text-emerald-700">
                  +{money(row.amountCents)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <Package className="mx-auto h-5 w-5 text-[#c0b5a8]" />
              <p className="mt-2 text-[10px] font-semibold text-[#554c42]">
                No completed deliveries
              </p>
              <p className="mt-1 text-[9px] text-[#928b82]">No earnings found for this month.</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="rounded-xl border border-[#eae5dc] bg-white p-3.5 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5eee4]">
            <Banknote className="h-4 w-4 text-[#a17443]" />
          </div>

          <div>
            <h3 className="text-[12px] font-bold text-[#302a24]">Payout bank account</h3>
            <p className="mt-0.5 text-[9px] text-[#928b82]">
              Add the account where your delivery earnings should be paid.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <label className="text-[9px] font-semibold text-[#71685e]">
            Name on account
            <input
              className={field}
              value={bank.accountName}
              onChange={(event) => setBank({ ...bank, accountName: event.target.value })}
              placeholder="Account holder's full name"
            />
          </label>

          <label className="text-[9px] font-semibold text-[#71685e]">
            Bank name
            <input
              className={field}
              value={bank.bankName}
              onChange={(event) => setBank({ ...bank, bankName: event.target.value })}
              placeholder="e.g. Access Bank"
            />
          </label>

          <label className="text-[9px] font-semibold text-[#71685e] sm:col-span-2">
            10-digit account number
            <input
              className={field}
              inputMode="numeric"
              maxLength={10}
              value={bank.accountNumber}
              onChange={(event) =>
                setBank({
                  ...bank,
                  accountNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                })
              }
              placeholder="0123456789"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[9px] text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="mt-3 text-[9px] text-emerald-700">
            {notice}
          </p>
        )}

        <button
          onClick={() => void save()}
          disabled={busy}
          type="button"
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#29231e] px-3.5 text-[9px] font-semibold text-white transition hover:bg-[#493b2d] disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {busy ? 'Saving...' : 'Save bank details'}
        </button>
      </div>
    </section>
  );
}
