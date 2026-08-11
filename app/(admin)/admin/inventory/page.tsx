'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownToLine, ArrowUpDown, Boxes, Carrot, ChevronDown, CircleAlert, Download, Package, Plus, RefreshCw, Search, SlidersHorizontal, Truck } from 'lucide-react';

type InventoryStatus = 'Healthy' | 'Low stock' | 'Out of stock' | 'Expiring soon';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  location: string;
  onHand: number;
  committed: number;
  incoming: string;
  reorderAt: number;
  expiry: string;
  status: InventoryStatus;
}

const inventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Grass-Fed Ribeye Steak',
    sku: 'CNC-RFB-0121',
    location: 'Cold Room 1',
    onHand: 184,
    committed: 42,
    incoming: '120 kg',
    reorderAt: 60,
    expiry: 'Nov 12, 2026',
    status: 'Healthy',
  },
  {
    id: '2',
    name: 'Free-Range Chicken Breast',
    sku: 'CNC-CHK-0043',
    location: 'Chiller 3',
    onHand: 42,
    committed: 38,
    incoming: '—',
    reorderAt: 80,
    expiry: 'Aug 11, 2026',
    status: 'Low stock',
  },
  {
    id: '3',
    name: 'Atlantic King Prawns',
    sku: 'CNC-SEA-0088',
    location: 'Freezer 2',
    onHand: 0,
    committed: 0,
    incoming: '80 kg',
    reorderAt: 40,
    expiry: '—',
    status: 'Out of stock',
  },
  {
    id: '4',
    name: 'Goat Meat Stew Cuts',
    sku: 'CNC-GOT-0012',
    location: 'Cold Room 2',
    onHand: 96,
    committed: 24,
    incoming: '60 kg',
    reorderAt: 50,
    expiry: 'Dec 03, 2026',
    status: 'Healthy',
  },
  {
    id: '5',
    name: 'Signature Beef Sausages',
    sku: 'CNC-SAU-0201',
    location: 'Freezer 1',
    onHand: 312,
    committed: 88,
    incoming: '—',
    reorderAt: 90,
    expiry: 'Oct 20, 2026',
    status: 'Healthy',
  },
  {
    id: '6',
    name: 'Whole Turkey (Cleaned)',
    sku: 'CNC-TRK-0007',
    location: 'Freezer 3',
    onHand: 28,
    committed: 12,
    incoming: '40 kg',
    reorderAt: 30,
    expiry: 'Jan 14, 2027',
    status: 'Low stock',
  },
  {
    id: '7',
    name: 'Pork Loin Chops',
    sku: 'CNC-PRK-0033',
    location: 'Chiller 1',
    onHand: 74,
    committed: 16,
    incoming: '—',
    reorderAt: 40,
    expiry: 'Aug 09, 2026',
    status: 'Expiring soon',
  },
  {
    id: '8',
    name: 'BBQ Party Pack',
    sku: 'CNC-BBQ-0410',
    location: 'Freezer 1',
    onHand: 51,
    committed: 22,
    incoming: '30 kg',
    reorderAt: 25,
    expiry: 'Sep 28, 2026',
    status: 'Healthy',
  },
  {
    id: '9',
    name: 'Cultured Butter Blocks',
    sku: 'CNC-DRY-0055',
    location: 'Chiller 2',
    onHand: 18,
    committed: 6,
    incoming: '—',
    reorderAt: 25,
    expiry: 'Aug 08, 2026',
    status: 'Expiring soon',
  },
  {
    id: '10',
    name: 'Suya Spice Blend',
    sku: 'CNC-SPC-0090',
    location: 'Dry Store',
    onHand: 240,
    committed: 30,
    incoming: '—',
    reorderAt: 60,
    expiry: 'Mar 30, 2027',
    status: 'Healthy',
  },
];

const locations = ['All locations', 'Cold Room 1', 'Cold Room 2', 'Chiller 1', 'Chiller 2', 'Chiller 3', 'Freezer 1', 'Freezer 2', 'Freezer 3', 'Dry Store'];

const tabs = [{ label: 'Current Stock', count: 10 }, { label: 'Suppliers', count: 5 }, { label: 'Purchase Orders', count: 5 }, { label: 'Inventory History' }];

function StatusBadge({ status }: { status: InventoryStatus }) {
  const styles: Record<InventoryStatus, string> = {
    Healthy: 'bg-emerald-50 text-emerald-600',
    'Low stock': 'bg-amber-50 text-amber-600',
    'Out of stock': 'bg-red-50 text-red-500',
    'Expiring soon': 'bg-orange-50 text-orange-600',
  };

  const dots: Record<InventoryStatus, string> = {
    Healthy: 'bg-emerald-500',
    'Low stock': 'bg-amber-500',
    'Out of stock': 'bg-red-500',
    'Expiring soon': 'bg-orange-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, iconClass, trend }: { title: string; value: string; subtitle: string; icon: React.ElementType; iconClass: string; trend?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-medium text-gray-500">{title}</p>

        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={15} strokeWidth={2} />
        </div>
      </div>

      <div className="mt-2">
        <p className="text-[19px] font-bold tracking-tight text-gray-900">{value}</p>

        <div className="mt-1.5 flex items-center gap-2">
          {trend && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">↗ {trend}</span>}

          <span className="text-[9px] text-gray-400">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('Current Stock');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All locations');

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());

      const matchesLocation = location === 'All locations' || item.location === location;

      return matchesSearch && matchesLocation;
    });
  }, [search, location]);

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-5 text-gray-900 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1450px]">
        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-gray-900">Inventory</h1>

            <p className="mt-1 text-[10px] text-gray-500">Live stock across cold rooms, chillers and dry store — with supplier intake and adjustment history.</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
              <Download size={13} />
              Generate Report
            </button>

            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
              <ArrowUpDown size={13} />
              Transfer
            </button>

            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-[#f15b2a] px-3 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#dc4e21]">
              <Plus size={14} />
              Add Stock
            </button>
          </div>
        </div>

        {/* =========================================================
            SUMMARY CARDS
        ========================================================= */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Current Stock" value="1,065 kg" subtitle="Across 5 storage zones" trend="4.8%" icon={Boxes} iconClass="bg-orange-50 text-orange-500" />

          <SummaryCard title="Low Stock" value="2 SKUs" subtitle="Below reorder point" icon={AlertTriangle} iconClass="bg-amber-50 text-amber-500" />

          <SummaryCard title="Out of Stock" value="1 SKU" subtitle="Prawns — 3 orders blocked" icon={Package} iconClass="bg-red-50 text-red-500" />

          <SummaryCard title="Incoming Stock" value="330 kg" subtitle="4 purchase orders in transit" icon={Truck} iconClass="bg-emerald-50 text-emerald-500" />
        </div>

        {/* =========================================================
            MAIN INVENTORY PANEL
        ========================================================= */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {/* TABS */}
          <div className="flex items-center overflow-x-auto border-b border-gray-200 px-3 pt-2.5">
            {tabs.map((tab) => {
              const active = activeTab === tab.label;

              return (
                <button key={tab.label} onClick={() => setActiveTab(tab.label)} className={`relative mr-1 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium transition ${active ? 'bg-[#292929] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {tab.label}

                  {tab.count && <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${active ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {/* SEARCH / FILTER */}
          <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />

              <input type="text" placeholder="Search SKU or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-[10px] text-gray-700 outline-none placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
            </div>

            <div className="relative w-full sm:w-[180px]">
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-[10px] text-gray-600 outline-none focus:border-orange-300">
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* =========================================================
              TABLE
          ========================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-[#fafafa]">
                  <th className="px-3.5 py-2.5 text-left text-[9px] font-medium text-gray-500">Item</th>

                  <th className="px-3.5 py-2.5 text-left text-[9px] font-medium text-gray-500">Location</th>

                  <th className="px-3.5 py-2.5 text-center text-[9px] font-medium text-gray-500">On hand</th>

                  <th className="px-3.5 py-2.5 text-center text-[9px] font-medium text-gray-500">Committed</th>

                  <th className="px-3.5 py-2.5 text-center text-[9px] font-medium text-gray-500">Incoming</th>

                  <th className="px-3.5 py-2.5 text-center text-[9px] font-medium text-gray-500">Reorder at</th>

                  <th className="px-3.5 py-2.5 text-left text-[9px] font-medium text-gray-500">Expiry</th>

                  <th className="px-3.5 py-2.5 text-left text-[9px] font-medium text-gray-500">Status</th>

                  <th className="px-3.5 py-2.5 text-right text-[9px] font-medium text-gray-500">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition hover:bg-gray-50/70">
                    <td className="px-3.5 py-2.5">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-800">{item.name}</p>

                        <p className="mt-0.5 font-mono text-[8px] text-gray-400">{item.sku}</p>
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 text-[9px] text-gray-600">{item.location}</td>

                    <td className="px-3.5 py-2.5 text-center text-[10px] font-semibold text-gray-800">{item.onHand}</td>

                    <td className="px-3.5 py-2.5 text-center text-[9px] text-gray-600">{item.committed}</td>

                    <td className="px-3.5 py-2.5 text-center text-[9px] text-gray-600">{item.incoming}</td>

                    <td className="px-3.5 py-2.5 text-center text-[9px] text-gray-600">{item.reorderAt}</td>

                    <td className="px-3.5 py-2.5 text-[9px] text-gray-600">{item.expiry}</td>

                    <td className="px-3.5 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <button className="text-[9px] font-medium text-[#e94f22] hover:underline">Adjust</button>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <Package size={25} className="mx-auto mb-2 text-gray-300" />

                      <p className="text-xs font-medium text-gray-600">No inventory found</p>

                      <p className="mt-1 text-[10px] text-gray-400">Try changing your search or location filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================================
            EXPIRY WATCHLIST
        ========================================================= */}
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="mb-3">
            <h2 className="text-[11px] font-semibold text-gray-800">Expiry watchlist</h2>

            <p className="text-[9px] text-gray-400">Items approaching their use-by date in the next 72 hours</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <ExpiryCard name="Pork Loin Chops" location="Chiller 1" expiry="Aug 09, 2026" stock="74 kg on hand" />

            <ExpiryCard name="Cultured Butter Blocks" location="Chiller 2" expiry="Aug 08, 2026" stock="18 kg on hand" />

            <ExpiryCard name="Free-Range Chicken Breast" location="Chiller 3" expiry="Aug 11, 2026" stock="42 kg on hand" />
          </div>
        </section>
      </div>
    </main>
  );
}

function ExpiryCard({ name, location, expiry, stock }: { name: string; location: string; expiry: string; stock: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-[#fffdf5] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold text-gray-800">{name}</p>

          <p className="mt-0.5 text-[8px] text-gray-500">
            {location} · expires {expiry}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-gray-700">{stock}</span>

        <button className="text-[9px] font-medium text-[#e94f22] hover:underline">Apply markdown</button>
      </div>
    </div>
  );
}
