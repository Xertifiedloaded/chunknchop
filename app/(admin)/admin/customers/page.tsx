'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpDown, Download, Mail, Search, Users, Wallet, Repeat, ChevronDown } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

type LoyaltyTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

type SortKey = 'recent' | 'spend' | 'orders' | 'name';

function getLoyaltyTier(totalSpent: number): LoyaltyTier {
  if (totalSpent >= 2000) return 'Platinum';
  if (totalSpent >= 800) return 'Gold';
  if (totalSpent >= 300) return 'Silver';
  return 'Bronze';
}

const loyaltyStyles: Record<LoyaltyTier, { chip: string; dot: string }> = {
  Platinum: { chip: 'bg-[#f5e4df] text-[#7a2415]', dot: 'bg-brand' },
  Gold: { chip: 'bg-[#f4ecd8] text-[#7a5c14]', dot: 'bg-[#a8801f]' },
  Silver: { chip: 'bg-[#eeece9] text-[#57524c]', dot: 'bg-[#8a847d]' },
  Bronze: { chip: 'bg-[#f1ece6] text-[#7a5b3e]', dot: 'bg-[#a97c4f]' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toUpperCase() === 'N/A') return '—';
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/customers');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError("Couldn't load customers. Try refreshing the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase();

    const filtered = customers.filter((customer) => (customer.name ?? '').toLowerCase().includes(query) || (customer.email ?? '').toLowerCase().includes(query));

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'spend':
          return b.totalSpent - a.totalSpent;
        case 'orders':
          return b.orderCount - a.orderCount;
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '');
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [customers, search, sortKey]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0);
    const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return { totalCustomers, totalRevenue, avgOrderValue, repeatRate };
  }, [customers]);

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 text-[#1c1917] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-350">
        {/* Header */}
        <div className="mb-1 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.6px]">Customers</h1>

            <p className="font-worksans max-w-140 text-[13px] leading-5 text-[#847d76]">Every registered customer, pulled live from your store.</p>
          </div>


          <div className="flex items-center gap-2">
            <button
              disabled={loading || customers.length === 0}
              className="flex h-8 items-center gap-1.5 rounded-[7px] border border-[#ddd7d0] bg-white px-3 text-xs font-medium text-[#3a352f] transition hover:border-[#c9c1b8] hover:bg-[#faf9f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={13} strokeWidth={2} />
              Export
            </button>

            <button
              disabled={loading || customers.length === 0}
              className="flex h-8 items-center gap-1.5 rounded-[7px] bg-brand px-3 text-xs font-medium text-white shadow-[0_1px_2px_rgba(158,43,26,0.25)] transition hover:bg-[#872417] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail size={13} strokeWidth={2} />
              Email segment
            </button>
          </div>


        </div>



        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-[10px] border border-[#f0c9c0] bg-[#faece8] px-4 py-3 text-[13px] text-[#872417]">
            <AlertCircle size={16} strokeWidth={2} />
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 font-sora gap-3.5  xl:grid-cols-4">
          <StatCard title="Total customers" value={loading ? '—' : stats.totalCustomers.toLocaleString()} icon={<Users size={17} strokeWidth={2} />} loading={loading} />

          <StatCard title="Total revenue" value={loading ? '—' : formatCurrency(stats.totalRevenue)} icon={<Wallet size={17} strokeWidth={2} />} loading={loading} />

          <StatCard title="Avg. order value" value={loading ? '—' : formatCurrency(stats.avgOrderValue)} icon={<ArrowUpDown size={17} strokeWidth={2} />} loading={loading} />

          <StatCard title="Repeat customers" value={loading ? '—' : `${stats.repeatRate.toFixed(0)}%`} icon={<Repeat size={17} strokeWidth={2} />} loading={loading} />
        </div>

        <section className="overflow-hidden rounded-[14px] border border-[#e6e1da] bg-white shadow-[0_1px_3px_rgba(28,25,23,0.05)]">
          <div className="flex flex-col gap-2.5 border-b border-[#eae5de] p-3.5 md:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#a39c95]" />

              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" disabled={loading} className="h-[37px] w-full rounded-[9px] border border-[#ddd7d0] bg-white pr-4 pl-10 text-[13px] text-[#2b2723] outline-none placeholder:text-[#a39c95] focus:border-brand focus:ring-[3px] focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-[#faf9f7]" />
            </div>

            <div className="relative">
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} disabled={loading} className="h-[37px] min-w-[150px] appearance-none rounded-[9px] border border-[#ddd7d0] bg-white pr-9 pl-3.5 text-[13px] text-[#4a453f] outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-[#faf9f7]">
                <option value="recent">Newest joined</option>
                <option value="spend">Highest spend</option>
                <option value="orders">Most orders</option>
                <option value="name">Name A–Z</option>
              </select>

              <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[#8c8580]" />
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="h-9.5 border-b border-[#eae5de] bg-[#faf9f7] text-left">
                      <th className="px-4.75 font-worksans text-[10px] font-semibold tracking-[0.7px] text-[#918a83] uppercase">Customer</th>
                      <th className="px-4 text-right font-worksans text-[10px] font-semibold tracking-[0.7px] text-[#918a83] uppercase">Orders</th>
                      <th className="px-4 text-right font-worksans text-[10px] font-semibold tracking-[0.7px] text-[#918a83] uppercase">Total spent</th>
                      <th className="px-4 font-worksans text-[10px] font-semibold tracking-[0.7px] text-[#918a83] uppercase">Tier</th>
                      <th className="px-4.75 font-worksans text-[10px] font-semibold tracking-[0.7px] text-[#918a83] uppercase">Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <CustomerRow key={customer.id} customer={customer} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#eeeae5] md:hidden">
                {filteredCustomers.map((customer) => (
                  <MobileCustomerCard key={customer.id} customer={customer} />
                ))}
              </div>

              {filteredCustomers.length === 0 && (
                <div className="py-14 text-center">
                  <p className="text-sm font-medium text-[#3a352f]">{customers.length === 0 ? 'No customers yet' : 'No customers found'}</p>
                  <p className="mt-1 text-xs text-[#a39c95]">{customers.length === 0 ? 'New customers will show up here once they register.' : 'Try a different search term.'}</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}



function StatCard({ title, value, icon, loading }: { title: string; value: string; icon: React.ReactNode; loading: boolean }) {
  return (
    <div className="min-h-[100px] rounded-[13px] border border-[#e6e1da] bg-white p-[17px] shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium text-[#847d76]">{title}</span>

        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#f5e4df] text-brand">{icon}</div>
      </div>

      <div className={`tabular mt-2 text-[24px] font-semibold tracking-[-0.4px] ${loading ? 'animate-pulse text-[#c9c1b8]' : ''}`}>{value}</div>
    </div>
  );
}



function TableSkeleton() {
  return (
    <div className="divide-y divide-[#f0ece7]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex h-[58px] items-center gap-3 px-[19px]">
          <div className="h-[32px] w-[32px] animate-pulse rounded-[9px] bg-[#efece7]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-[10px] w-[140px] animate-pulse rounded bg-[#efece7]" />
            <div className="h-[9px] w-[180px] animate-pulse rounded bg-[#f4f2ee]" />
          </div>
          <div className="h-[10px] w-[60px] animate-pulse rounded bg-[#efece7]" />
        </div>
      ))}
    </div>
  );
}



function CustomerRow({ customer }: { customer: Customer }) {
  const tier = getLoyaltyTier(customer.totalSpent || 0);

  return (
    <tr className="h-14.5 border-b border-[#f0ece7] last:border-b-0 hover:bg-[#faf9f7]">
      <td className="px-4.75">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} />

          <div className="min-w-0">
            <p className="truncate font-sora text-[13px] font-semibold text-[#241f1b]">{customer.name || 'N/A'}</p>
            <p className="truncate font-worksans text-[11px] text-[#a39c95]">{customer.email}</p>
          </div>
        </div>
      </td>

      <td className="tabular px-4 text-right text-[13px] text-[#4a453f]">{customer.orderCount}</td>

      <td className="tabular px-4 text-right text-[13px] font-sora font-semibold text-[#241f1b]">{formatCurrency(customer.totalSpent || 0)}</td>

      <td className="px-4">
        <LoyaltyBadge tier={tier} />
      </td>

      <td className="tabular px-4.75 text-[13px] font-worksans text-[#847d76]">{formatDate(customer.createdAt)}</td>
    </tr>
  );
}



function MobileCustomerCard({ customer }: { customer: Customer }) {
  const tier = getLoyaltyTier(customer.totalSpent || 0);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={customer.name} />

          <div className="min-w-0">
            <p className="truncate font-sora text-[13px] font-semibold text-[#241f1b]">{customer.name || 'N/A'}</p>
            <p className="truncate font-worksans text-[11px] text-[#a39c95]">{customer.email}</p>
          </div>
        </div>

        <LoyaltyBadge tier={tier} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <Info label="Orders" value={String(customer.orderCount)} />
        <Info label="Total spent" value={formatCurrency(customer.totalSpent || 0)} />
        <div className="col-span-2">
          <Info label="Joined" value={formatDate(customer.createdAt)} />
        </div>
      </div>
    </div>
  );
}



function Avatar({ name }: { name: string }) {
  return <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#ece7e1] bg-[#f6f5f2] font-worksans text-[10px] font-semibold text-[#4a453f]">{getInitials(name)}</div>;
}

function LoyaltyBadge({ tier }: { tier: LoyaltyTier }) {
  const styles = loyaltyStyles[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[8px] font-semibold tracking-[0.3px] uppercase ${styles.chip} `}>
      <span className={`h-1.25 w-1.25 rounded-full ${styles.dot}`} />
      {tier}
    </span>
  );
}



function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 font-worksans text-[9px] font-medium tracking-[0.5px] text-[#a39c95] uppercase">{label}</p>
      <p className="text-xs font-medium text-[#3a352f]">{value}</p>
    </div>
  );
}
