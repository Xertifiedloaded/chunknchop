'use client';

import { CalendarDays, ChevronDown, Download, MoreVertical, SlidersHorizontal, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/fetchClient';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customerName: string;

  itemsCount?: number;
  productSummary?: string;
  location?: string;
  riderName?: string;
}

const TAB_ALL = 'All Orders';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-[#fff5dc] text-[#d98500] before:bg-[#f5a900]',
  PREPARING: 'bg-[#fff0eb] text-[#e65326] before:bg-[#ee5a31]',
  PROCESSING: 'bg-[#fff0eb] text-[#e65326] before:bg-[#ee5a31]',
  QUALITY_CHECK: 'bg-[#fbecef] text-[#731d36] before:bg-[#8b2542]',
  PACKAGING: 'bg-[#eceae8] text-[#514d49] before:bg-[#89847f]',
  READY_FOR_DISPATCH: 'bg-[#e8f6ff] text-[#007ac1] before:bg-[#119ee6]',
  OUT_FOR_DELIVERY: 'bg-[#e7f6ff] text-[#007cc3] before:bg-[#119ee6]',
  SHIPPED: 'bg-[#e7f6ff] text-[#007cc3] before:bg-[#119ee6]',
  DELIVERED: 'bg-[#e5faef] text-[#00854f] before:bg-[#12bd65]',
  CANCELLED: 'bg-[#fff0f0] text-[#ed3d3d] before:bg-[#ff4c4c]',
  REFUNDED: 'bg-[#eceae8] text-[#514d49] before:bg-[#89847f]',
};
const DEFAULT_STATUS_STYLE = 'bg-[#eceae8] text-[#514d49] before:bg-[#89847f]';

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toUpperCase()] ?? DEFAULT_STATUS_STYLE;
  const dot = style.split('before:')[1] ?? 'bg-[#89847f]';

  return (
    <span className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] leading-none font-semibold ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {formatStatusLabel(status)}
    </span>
  );
}

function PaymentBadge({ payment }: { payment: string }) {
  const isPaid = payment.toUpperCase() === 'PAID';
  const isFailed = payment.toUpperCase() === 'FAILED';

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${isPaid ? 'bg-[#e5faef] text-[#00854f]' : isFailed ? 'bg-[#fff0f0] text-[#e93636]' : 'bg-[#fff5dc] text-[#d98500]'}`}>{payment.toLowerCase()}</span>;
}

const AVATAR_PALETTE = ['bg-[#fce0d6] text-[#e75b2e]', 'bg-[#fff0b8] text-[#a67900]', 'bg-[#d9efff] text-[#1675aa]', 'bg-[#d5f8e9] text-[#149568]', 'bg-[#e8e6e4] text-[#55514d]'];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const response = await fetchWithAuth('/api/admin/orders');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError("Couldn't load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => {
      const label = formatStatusLabel(o.status);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return [[TAB_ALL, orders.length] as [string, number], ...Array.from(counts.entries())];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = activeTab === TAB_ALL || formatStatusLabel(o.status) === activeTab;
      const q = search.trim().toLowerCase();
      const matchesSearch = q === '' || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  // Only show a handful of page buttons, centered around the current page,
  // so the pager doesn't overflow on narrow screens.
  const pageButtons = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-5 text-[#292725] sm:px-6 sm:py-7">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.3px] sm:text-[21px]">Orders</h1>
          <p className="mt-1 text-[12px] text-[#8d8985]">Every order across the ChunkNChop storefront, wholesale desk and subscription runs.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-[11px] border border-[#dedbd8] bg-white px-3 text-[12px] font-medium whitespace-nowrap text-[#45413e]">
            <CalendarDays size={14} strokeWidth={1.8} />
            All time
            <ChevronDown size={14} />
          </button>

          <button className="flex h-9 items-center gap-2 rounded-[11px] border border-[#dedbd8] bg-white px-3 text-[12px] font-medium whitespace-nowrap text-[#45413e]">
            <Download size={14} strokeWidth={1.8} />
            Export
          </button>

          <button className="flex h-9 items-center gap-2 rounded-[11px] bg-[#ef5b2a] px-3.5 text-[12px] font-semibold whitespace-nowrap text-white shadow-sm">
            <Truck size={14} strokeWidth={2} />
            Assign Riders
          </button>
        </div>
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-[17px] border border-[#e8e5e2] bg-white shadow-[0_2px_7px_rgba(0,0,0,0.04)]">
        {/* Tabs */}
        <div className="flex h-11.75 items-center gap-0 overflow-x-auto border-b border-[#ebe8e5] px-[14px]">
          {tabs.map(([label, count]) => (
            <button
              key={label}
              onClick={() => {
                setActiveTab(label);
                setPage(1);
              }}
              className={`flex h-7.75 shrink-0 items-center gap-2 rounded-[10px] px-3 text-[11px] font-semibold whitespace-nowrap transition ${activeTab === label ? 'bg-[#292725] text-white' : 'text-[#635d58] hover:bg-[#f7f5f3]'}`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === label ? 'bg-[#56524f] text-white' : 'bg-[#eeecea] text-[#766f69]'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Search / filters */}
        <div className="flex flex-col gap-2 border-b border-[#e8e5e2] px-[14px] py-3 sm:h-15.5 sm:flex-row sm:items-center sm:gap-1.5 sm:px-[17px] sm:py-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by order number or customer..."
              className="h-8.75 w-full rounded-[10px] border border-[#ddd9d6] bg-white px-3.5 text-[12px] text-[#403c39] outline-none placeholder:text-[#9ca8ba] focus:border-[#ef5b2a]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button className="flex h-8.75 flex-1 items-center justify-between gap-2 rounded-[10px] border border-[#ddd9d6] bg-white px-3 text-[#817b76] sm:w-31.5 sm:flex-none sm:justify-end">
              <ChevronDown size={15} />
            </button>

            <button className="flex h-8.75 flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#ddd9d6] bg-white px-3 text-[11px] font-medium whitespace-nowrap text-[#4d4844] sm:flex-none">
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-10 text-center text-[13px] text-[#8d8985]">Loading orders…</div>
        ) : error ? (
          <div className="p-10 text-center text-[13px] text-[#e93636]">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-[#8d8985]">No orders match this filter.</div>
        ) : (
          <>
            {/* Table — visible from md up */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="h-[38px] border-b border-[#ebe8e5] bg-[#fcfbfa] text-left">
                    <th className="w-[48px] px-[17px]">
                      <input type="checkbox" className="h-[14px] w-[14px] appearance-none rounded-[3px] border border-[#ff5b2d] checked:bg-[#ff5b2d]" />
                    </th>
                    <th className="w-[158px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Order</th>
                    <th className="w-[205px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Customer</th>
                    <th className="w-[203px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Items</th>
                    <th className="w-[180px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Status</th>
                    <th className="w-[100px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Payment</th>
                    <th className="w-[175px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Rider</th>
                    <th className="w-[105px] text-[9px] font-semibold tracking-[0.3px] text-[#827c77]">Total</th>
                    <th className="w-[30px]" />
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const created = new Date(order.createdAt);
                    return (
                      <tr key={order.id} className="h-[55px] border-b border-[#efedeb] last:border-b-0 hover:bg-[#fdfbf9]">
                        <td className="px-[17px]">
                          <input type="checkbox" className="h-[14px] w-[14px] appearance-none rounded-[3px] border border-[#ff5b2d] checked:bg-[#ff5b2d]" />
                        </td>

                        {/* Order */}
                        <td>
                          <div className="text-[12px] font-bold text-[#34312f]">{order.orderNumber}</div>
                          <div className="mt-[1px] text-[10px] text-[#8e8883]">
                            {created.toLocaleDateString()} ·{' '}
                            {created.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={`flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-[7px] text-[9px] font-bold ${getAvatarColor(order.customerName)}`}>{getInitials(order.customerName)}</div>
                            <div>
                              <div className="text-[12px] font-medium text-[#393532]">{order.customerName}</div>
                              <div className="text-[10px] text-[#948e89]">{order.location ?? '—'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Items */}
                        <td>
                          <div className="text-[11px] font-medium text-[#4d4844]">{order.itemsCount ? `${order.itemsCount} item${order.itemsCount > 1 ? 's' : ''}` : '—'}</div>
                          <div className="mt-[1px] max-w-[170px] truncate text-[10px] text-[#8c8681]">{order.productSummary ?? ''}</div>
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Payment */}
                        <td>
                          <PaymentBadge payment={order.paymentStatus} />
                        </td>

                        {/* Rider */}
                        <td>
                          <span className={!order.riderName ? 'text-[11px] text-[#aaa39d]' : 'text-[11px] font-medium text-[#48433f]'}>{order.riderName ?? 'Unassigned'}</span>
                        </td>

                        {/* Total */}
                        <td>
                          <span className="text-[12px] font-bold text-[#393532]">{formatNaira(order.total)}</span>
                        </td>

                        {/* More / View */}
                        <td className="pr-[17px] text-right">
                          <Link href={`/admin/orders/${order.id}`} className="inline-flex text-[#8d8782] hover:text-[#292725]">
                            <MoreVertical size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Card list — visible below md */}
            <div className="divide-y divide-[#efedeb] md:hidden">
              {paginatedOrders.map((order) => {
                const created = new Date(order.createdAt);
                return (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex flex-col gap-3 px-4 py-4 active:bg-[#fdfbf9]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold ${getAvatarColor(order.customerName)}`}>{getInitials(order.customerName)}</div>
                        <div>
                          <div className="text-[13px] font-bold text-[#34312f]">{order.orderNumber}</div>
                          <div className="text-[11px] text-[#948e89]">{order.customerName}</div>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold whitespace-nowrap text-[#393532]">{formatNaira(order.total)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={order.status} />
                      <PaymentBadge payment={order.paymentStatus} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8e8883]">
                      <span>
                        {created.toLocaleDateString()} ·{' '}
                        {created.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>{order.riderName ?? 'Unassigned'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Footer / Pagination */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#ebe8e5] px-[14px] py-3 sm:h-[51px] sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-[17px] sm:py-0">
            <div className="text-[10px] text-[#8e8883]">
              Page <span className="text-[#5f5954]">{page}</span> of <span className="text-[#5f5954]">{totalPages}</span> · {filteredOrders.length} records
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`h-[28px] rounded-[8px] border px-3 text-[10px] ${page === 1 ? 'border-[#eeeae7] text-[#c5c0bc]' : 'border-[#ddd9d6] font-medium text-[#4d4844]'}`}>
                Previous
              </button>

              {pageButtons.map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`h-[28px] min-w-[28px] rounded-[8px] text-[10px] ${page === n ? 'bg-[#292725] font-semibold text-white' : 'text-[#5e5854] hover:bg-[#f5f3f1]'}`}>
                  {n}
                </button>
              ))}

              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`ml-1 h-[28px] rounded-[8px] border px-3 text-[10px] font-medium ${page === totalPages ? 'border-[#eeeae7] text-[#c5c0bc]' : 'border-[#ddd9d6] text-[#4d4844]'}`}>
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
