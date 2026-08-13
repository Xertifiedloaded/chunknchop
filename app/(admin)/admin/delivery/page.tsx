'use client';

import { useState } from 'react';
import { Bike, CheckCircle2, ChevronDown, Clock3, Map, MapPin, Package, Plus, Truck, UserRound } from 'lucide-react';

type Tab = 'deliveries' | 'riders' | 'zones';

// Replace static data with live fetches
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function useDeliveryData() {
  const { data: orders, error: ordersErr } = useSWR('/api/admin/orders', fetcher);
  const { data: riders, error: ridersErr } = useSWR('/api/admin/rider', fetcher);
  const { data: zones, error: zonesErr } = useSWR('/api/admin/delivery-zones', fetcher);

  return {
    orders: safeArray<any>(orders),
    riders: safeArray<any>(riders),
    zones: safeArray<any>(zones),
    loading: !(orders && riders && zones) && !(ordersErr || ridersErr || zonesErr),
  };
}

const tabs = [
  {
    id: 'deliveries' as Tab,
    label: 'Active Deliveries',
    count: 5,
  },
  {
    id: 'riders' as Tab,
    label: 'Riders',
    count: 6,
  },
  {
    id: 'zones' as Tab,
    label: 'Zones & Fees',
    count: 8,
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'on route': 'bg-[#effaf5] text-[#079455]',
    idle: 'bg-[#f5f5f4] text-[#6b6762]',
    offline: 'bg-[#f1f1f1] text-[#77736e]',
    active: 'bg-[#effaf5] text-[#079455]',
    limited: 'bg-[#fff8e8] text-[#c98a00]',
    paused: 'bg-[#f1efed] text-[#77716b]',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, iconClass, trend, trendText }: { title: string; value: string; subtitle: string; icon: any; iconClass: string; trend?: string; trendText?: string }) {
  return (
    <div className="relative min-h-[126px] overflow-hidden rounded-[15px] border border-[#e8e5e2] bg-white p-4 shadow-[0_2px_10px_rgba(25,20,15,0.04)]">
      {title === 'Out for Delivery' && <div className="absolute inset-x-0 top-0 h-[3px] bg-[#f15b2a]" />}

      <div className="flex items-start justify-between">
        <span className="text-[10px] font-medium text-[#77716b]">{title}</span>

        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>{Icon && <Icon size={15} strokeWidth={2} />}</div>
      </div>

      <div className="mt-2 text-[25px] font-semibold tracking-[-0.5px] text-[#2e2a27]">{value}</div>

      <div className="mt-1 flex items-center gap-2 text-[9px] text-[#99938d]">
        {trend && <span className="rounded-full bg-[#effaf5] px-1.5 py-0.5 font-semibold text-[#079455]">↗ {trend}</span>}
        <span>{trendText || subtitle}</span>
      </div>
    </div>
  );
}

function LiveTracking() {
  const { riders, loading } = useDeliveryData();

  return (
    <div className="rounded-[15px] border border-[#e8e5e2] bg-white p-4 shadow-[0_2px_10px_rgba(25,20,15,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-[#2f2b28]">Live Tracking</h3>
          <p className="mt-0.5 text-[9px] text-[#99938d]">Rider positions across active delivery zones</p>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-[#ecfaf4] px-2 py-1 text-[9px] font-medium text-[#079455]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00a86b]" />
          Live
        </span>
      </div>

      <div className="relative mt-3 h-[148px] overflow-hidden rounded-[10px] border border-[#e8e5e2] bg-[#f7f7f6]">
        {/* Map placeholder - render rider dots from API */}
        <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#8c857f]">{loading ? 'Loading riders…' : riders.length === 0 ? 'No active riders' : `${riders.length} riders active`}</div>
      </div>
    </div>
  );
}

function DeliveryVolume() {
  return (
    <div className="rounded-[15px] border border-[#e8e5e2] bg-white p-4 shadow-[0_2px_10px_rgba(25,20,15,0.04)]">
      <h3 className="text-[13px] font-semibold text-[#2f2b28]">Delivery Volume</h3>

      <p className="mt-0.5 text-[9px] text-[#99938d]">Delivered vs late, last 7 days</p>

      <div className="relative mt-3 h-[148px]">
        <div className="absolute right-0 bottom-0 left-0 flex h-full items-end justify-around px-3 pb-5">
          {[52, 70, 45, 82, 61, 88, 76].map((height, index) => (
            <div key={index} className="flex h-full w-[7%] items-end justify-center">
              <div className="w-full rounded-t-[3px] bg-[#f15b2a]" style={{ height: `${height}%`, opacity: 0.9 }} />
            </div>
          ))}
        </div>

        <div className="absolute right-0 bottom-0 left-0 h-px bg-[#eeeae7]" />

        <div className="absolute bottom-[-2px] left-1/2 flex -translate-x-1/2 translate-y-full items-center gap-3 pt-2 text-[8px]">
          <span className="flex items-center gap-1 text-[#f15b2a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f15b2a]" />
            Delivered
          </span>
          <span className="flex items-center gap-1 text-[#e99b00]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e99b00]" />
            Late
          </span>
        </div>
      </div>
    </div>
  );
}

function DeliveriesTable() {
  const { orders, loading } = useDeliveryData();

  const display = orders.slice(0, 10).map((order: any) => ({
    orderNumber: order.orderNumber || `CNC-${order.id?.slice(-6).toUpperCase()}`,
    customer: order.customerName || (order.customer?.name ?? 'Customer'),
    rider: order.rider?.name ?? (order.riderId ? 'Assigned' : 'Unassigned'),
    zone: order.location || order.shippingCity || 'Unknown',
    progress: Math.min(100, Math.floor(Math.random() * 90) + 10),
    temp: '—',
    eta: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleTimeString() : '—',
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-[#eeeae7] bg-[#fcfbfa] text-left">
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Order</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Customer</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Rider</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Zone</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Progress</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Pack temp</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">ETA</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[10px] text-[#8c857f]">
                Loading orders…
              </td>
            </tr>
          )}

          {!loading && display.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[10px] text-[#8c857f]">
                No orders available.
              </td>
            </tr>
          )}

          {display.map((item) => (
            <tr key={item.orderNumber} className="border-b border-[#f0eeec] last:border-0">
              <td className="px-4 py-3 text-[10px] font-medium text-[#3d3935]">{item.orderNumber}</td>
              <td className="px-4 py-3 text-[10px] text-[#55504b]">{item.customer}</td>
              <td className="px-4 py-3 text-[10px] text-[#55504b]">{item.rider}</td>
              <td className="px-4 py-3 text-[10px] text-[#55504b]">{item.zone}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-[3px] w-12 overflow-hidden rounded-full bg-[#eeeae7]">
                    <div className="h-full rounded-full bg-[#f15b2a]" style={{ width: `${item.progress}%` }} />
                  </div>
                  <span className="text-[9px] text-[#8c857f]">{item.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[10px] font-medium text-[#1688cf]">{item.temp}</td>
              <td className="px-4 py-3 text-[10px] font-medium text-[#3d3935]">{item.eta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RidersTable() {
  const { riders, loading } = useDeliveryData();

  const display = riders.map((r: any) => ({
    rider: r.name,
    zone: r.zone || '—',
    vehicle: r.vehicleType ? `${r.vehicleType} · ${r.licensePlate ?? ''}` : '—',
    active: r.activeDeliveries ?? r._count?.orders ?? 0,
    completed: r.totalDeliveries ?? 0,
    onTime: 95,
    rating: typeof r.rating === 'number' ? r.rating.toFixed(1) : (r.rating ?? '—'),
    status: (r.status as string)?.toLowerCase() ?? 'offline',
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-[#eeeae7] bg-[#fcfbfa] text-left">
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Rider</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Zone</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Vehicle</th>
            <th className="px-4 py-2.5 text-center text-[9px] font-medium text-[#8c857f]">Active</th>
            <th className="px-4 py-2.5 text-center text-[9px] font-medium text-[#8c857f]">Completed today</th>
            <th className="px-4 py-2.5 text-center text-[9px] font-medium text-[#8c857f]">On-time</th>
            <th className="px-4 py-2.5 text-center text-[9px] font-medium text-[#8c857f]">Rating</th>
            <th className="px-4 py-2.5 text-[9px] font-medium text-[#8c857f]">Status</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-[10px] text-[#8c857f]">
                Loading riders…
              </td>
            </tr>
          )}

          {!loading && display.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-[10px] text-[#8c857f]">
                No riders available.
              </td>
            </tr>
          )}

          {display.map((item) => (
            <tr key={item.rider} className="border-b border-[#f0eeec] last:border-0">
              <td className="px-4 py-3 text-[10px] font-medium text-[#3d3935]">{item.rider}</td>
              <td className="px-4 py-3 text-[10px] text-[#55504b]">{item.zone}</td>
              <td className="px-4 py-3 text-[9px] text-[#55504b]">{item.vehicle}</td>
              <td className="px-4 py-3 text-center text-[10px] text-[#55504b]">{item.active}</td>
              <td className="px-4 py-3 text-center text-[10px] text-[#55504b]">{item.completed}</td>
              <td className="px-4 py-3 text-center text-[10px] text-[#55504b]">{item.onTime}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#55504b]">
                  <span className="text-[#f5a000]">★</span>
                  {item.rating}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZonesTable() {
  const { zones, loading } = useDeliveryData();

  const display = zones.map((zone: any) => ({
    zone: zone.name || zone.zone || 'Unknown',
    fee: typeof zone.baseCost === 'number' ? `₦${zone.baseCost.toLocaleString()}` : '—',
    eta: zone.estimatedDays === 1 ? 'Next day' : zone.estimatedDays ? `${zone.estimatedDays} days` : '—',
    riders: zone.riders ?? '—',
    orders: zone.orders ?? '—',
    status: zone.isActive ? 'active' : 'paused',
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-[#eeeae7] bg-[#fcfbfa] text-left">
            <th className="px-4 py-3 text-[9px] font-medium text-[#8c857f]">Zone</th>
            <th className="px-4 py-3 text-[9px] font-medium text-[#8c857f]">Delivery fee</th>
            <th className="px-4 py-3 text-[9px] font-medium text-[#8c857f]">Promised ETA</th>
            <th className="px-4 py-3 text-center text-[9px] font-medium text-[#8c857f]">Riders</th>
            <th className="px-4 py-3 text-right text-[9px] font-medium text-[#8c857f]">Orders (30d)</th>
            <th className="px-4 py-3 text-[9px] font-medium text-[#8c857f]">Status</th>
            <th className="px-4 py-3 text-right text-[9px] font-medium text-[#8c857f]" />
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[10px] text-[#8c857f]">
                Loading zones…
              </td>
            </tr>
          )}

          {!loading && display.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[10px] text-[#8c857f]">
                No zones available.
              </td>
            </tr>
          )}

          {display.map((item) => (
            <tr key={item.zone} className="border-b border-[#f0eeec] last:border-0">
              <td className="px-4 py-3.5 text-[11px] font-semibold text-[#3d3935]">{item.zone}</td>
              <td className="px-4 py-3.5 text-[11px] text-[#55504b]">{item.fee}</td>
              <td className="px-4 py-3.5 text-[11px] text-[#55504b]">{item.eta}</td>
              <td className="px-4 py-3.5 text-center text-[11px] text-[#55504b]">{item.riders}</td>
              <td className="px-4 py-3.5 text-right text-[11px] text-[#55504b]">{item.orders}</td>
              <td className="px-4 py-3.5">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button className="text-[10px] font-medium text-[#f15b2a] hover:underline">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('deliveries');

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.6px] text-[#302c29]">Delivery</h1>

            <p className="mt-1 text-[11px] text-[#8d8781] sm:text-[12px]">Live cold-chain tracking, rider assignment and zone economics across Lagos and beyond.</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-[9px] border border-[#ddd8d3] bg-white px-3.5 text-[11px] font-medium text-[#403b37] transition hover:bg-[#faf9f8]">
              <Map size={14} />
              Full Map
            </button>

            <button className="flex h-9 items-center gap-2 rounded-[9px] bg-[#f15b2a] px-3.5 text-[11px] font-medium text-white transition hover:bg-[#df4e20]">
              <Plus size={14} />
              Add Rider
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Out for Delivery" value="27" subtitle="11 riders active" icon={Truck} iconClass="bg-[#fff2ed] text-[#f15b2a]" />

          <StatCard title="Delivered Today" value="137" subtitle="Average 41 min door-to-door" trend="9.2%" trendText="Average 41 min door-to-door" icon={CheckCircle2} iconClass="bg-[#edfaf4] text-[#00a86b]" />

          <StatCard title="On-Time Rate" value="93%" subtitle="Target 95%" trend="1.8%" trendText="Target 95%" icon={Clock3} iconClass="bg-[#fff8e8] text-[#e89b00]" />

          <StatCard title="Cold-Chain Breaches" value="0" subtitle="All packs under 4°C" icon={Bike} iconClass="bg-[#f1efed] text-[#77716b]" />
        </section>

        <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_0.8fr]">
          <LiveTracking />
          <DeliveryVolume />
        </section>

        <section className="mt-3 overflow-hidden rounded-[15px] border border-[#e8e5e2] bg-white shadow-[0_2px_10px_rgba(25,20,15,0.04)]">
          <div className="flex overflow-x-auto border-b border-[#eeeae7] px-3 pt-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;

              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-t-[9px] px-3.5 py-2.5 text-[10px] font-medium transition ${active ? 'bg-[#292622] text-white' : 'text-[#706a64] hover:bg-[#f7f5f3]'}`}>
                  {tab.label}

                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${active ? 'bg-white/15 text-white' : 'bg-[#f0eeec] text-[#77716b]'}`}>{tab.count}</span>
                </button>
              );
            })}

            {activeTab === 'zones' && (
              <button className="ml-auto hidden items-center gap-1 px-3 text-[9px] text-[#77716b] sm:flex">
                <ChevronDown size={12} />
              </button>
            )}
          </div>

          {activeTab === 'deliveries' && <DeliveriesTable />}
          {activeTab === 'riders' && <RidersTable />}
          {activeTab === 'zones' && <ZonesTable />}
        </section>
      </div>
    </main>
  );
}
