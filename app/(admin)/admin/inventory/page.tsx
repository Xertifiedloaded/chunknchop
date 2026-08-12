'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, ChevronDown, Loader2, Package, Plus, RefreshCw, Search, Truck, X } from 'lucide-react';

type InventoryStatus = 'Healthy' | 'Low stock' | 'Out of stock' | 'Expiring soon';

interface InventoryItem {
  id: string; 
  productId: string;
  name: string;
  sku: string;
  locationId: string;
  location: string;
  onHand: number;
  committed: number;
  incoming: string; // e.g. "50 kg" or "—"
  reorderAt: number;
  expiry: string; // ISO date string or "—"
  status: InventoryStatus;
}

const CHANGE_REASONS = [
  'RESTOCK',
  'ADJUSTMENT',
  'DAMAGE',
  'EXPIRY',
  'RETURN',
  'TRANSFER',
  'PURCHASE',
] as const;

type ChangeReason = (typeof CHANGE_REASONS)[number];

const tabs = [{ label: 'Current Stock' }, { label: 'Suppliers' }, { label: 'Purchase Orders' }, { label: 'Inventory History' }];

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

function SummaryCard({ title, value, subtitle, icon: Icon, iconClass }: { title: string; value: string; subtitle: string; icon: React.ElementType; iconClass: string }) {
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
          <span className="text-[9px] text-gray-400">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

function formatExpiry(expiry: string) {
  if (expiry === '—') return expiry;
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return expiry;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('Current Stock');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All locations');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline "Adjust" editor state
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustNewOnHand, setAdjustNewOnHand] = useState('');
  const [adjustReason, setAdjustReason] = useState<ChangeReason>('ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/inventory', { credentials: 'include' });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data: InventoryItem[] = await res.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.location)));
    return ['All locations', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());

      const matchesLocation = location === 'All locations' || item.location === location;

      return matchesSearch && matchesLocation;
    });
  }, [items, search, location]);

  const summary = useMemo(() => {
    const totalOnHand = items.reduce((sum, i) => sum + i.onHand, 0);
    const lowStock = items.filter((i) => i.status === 'Low stock').length;
    const outOfStock = items.filter((i) => i.status === 'Out of stock');
    const incomingTotal = items.reduce((sum, i) => {
      const n = parseInt(i.incoming, 10);
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
    const incomingCount = items.filter((i) => i.incoming !== '—').length;

    return {
      totalOnHand,
      zones: new Set(items.map((i) => i.location)).size,
      lowStock,
      outOfStock: outOfStock.length,
      outOfStockSample: outOfStock[0]?.name,
      incomingTotal,
      incomingCount,
    };
  }, [items]);

  function openAdjust(item: InventoryItem) {
    setAdjustingId(item.id);
    setAdjustNewOnHand(String(item.onHand));
    setAdjustReason('ADJUSTMENT');
    setAdjustNotes('');
    setAdjustError(null);
  }

  function closeAdjust() {
    setAdjustingId(null);
    setAdjustError(null);
  }

  async function submitAdjust(item: InventoryItem) {
    const newOnHand = Number(adjustNewOnHand);

    if (!Number.isInteger(newOnHand) || newOnHand < 0) {
      setAdjustError('Enter a non-negative whole number');
      return;
    }

    setSaving(true);
    setAdjustError(null);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          inventoryRecordId: item.id,
          newOnHand,
          changeReason: adjustReason,
          notes: adjustNotes.trim() || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      await fetchInventory();
      closeAdjust();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Failed to save adjustment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-5 text-gray-900 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-gray-900">Inventory</h1>

            <p className="mt-1 text-[10px] text-gray-500">Live stock across cold rooms, chillers and dry store — with supplier intake and adjustment history.</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={fetchInventory} disabled={loading} className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-[#f15b2a] px-3 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#dc4e21]">
              <Plus size={14} />
              Add Stock
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[10px] font-medium text-red-600">
            <AlertTriangle size={13} />
            {error}
          </div>
        )}


        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Current Stock" value={`${summary.totalOnHand} units`} subtitle={`Across ${summary.zones} storage zones`} icon={Boxes} iconClass="bg-orange-50 text-orange-500" />

          <SummaryCard title="Low Stock" value={`${summary.lowStock} SKU${summary.lowStock === 1 ? '' : 's'}`} subtitle="Below reorder point" icon={AlertTriangle} iconClass="bg-amber-50 text-amber-500" />

          <SummaryCard title="Out of Stock" value={`${summary.outOfStock} SKU${summary.outOfStock === 1 ? '' : 's'}`} subtitle={summary.outOfStockSample ? `Incl. ${summary.outOfStockSample}` : 'None right now'} icon={Package} iconClass="bg-red-50 text-red-500" />

          <SummaryCard title="Incoming Stock" value={`${summary.incomingTotal} units`} subtitle={`${summary.incomingCount} purchase orders in transit`} icon={Truck} iconClass="bg-emerald-50 text-emerald-500" />
        </div>


        <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center overflow-x-auto border-b border-gray-200 px-3 pt-2.5">
            {tabs.map((tab) => {
              const active = activeTab === tab.label;

              return (
                <button key={tab.label} onClick={() => setActiveTab(tab.label)} className={`relative mr-1 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium transition ${active ? 'bg-[#292929] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {tab.label}
                  {tab.label === 'Current Stock' && <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${active ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'}`}>{items.length}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />

              <input type="text" placeholder="Search SKU or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-[10px] text-gray-700 outline-none placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
            </div>

            <div className="relative w-full sm:w-[180px]">
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-[10px] text-gray-600 outline-none focus:border-orange-300">
                {locationOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

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
                {loading && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <Loader2 size={20} className="mx-auto mb-2 animate-spin text-gray-300" />
                      <p className="text-[10px] text-gray-400">Loading inventory…</p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredItems.map((item) => (
                    <Fragment key={item.id}>
                      <tr className="border-b border-gray-100 transition hover:bg-gray-50/70">
                        <td className="px-3.5 py-2.5">
                          <div>
                            <p className="text-xs font-semibold text-charcoal">{item.name}</p>
                            <p className="mt-0.5 font-mono text-[8px] text-gray-400">{item.id}</p>
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 text-[9px] text-gray-600">{item.location}</td>
                        <td className="px-3.5 py-2.5 text-center text-[10px] font-semibold text-charcoal">{item.onHand}</td>
                        <td className="px-3.5 py-2.5 text-center text-[9px] text-gray-600">{item.committed}</td>
                        <td className="px-3.5 py-2.5 text-center text-[9px] text-gray-600">{item.incoming}</td>
                        <td className="px-3.5 py-2.5 text-center text-[9px] text-gray-600">{item.reorderAt}</td>
                        <td className="px-3.5 py-2.5 text-[9px] text-gray-600">{formatExpiry(item.expiry)}</td>

                        <td className="px-3.5 py-2.5">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="px-3.5 py-2.5 text-right">
                          {adjustingId === item.id ? (
                            <button onClick={closeAdjust} className="text-[9px] font-medium text-gray-500 hover:underline">
                              Cancel
                            </button>
                          ) : (
                            <button onClick={() => openAdjust(item)} className="text-[9px] font-medium text-[#e94f22] hover:underline">
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>

                      {adjustingId === item.id && (
                        <tr className="border-b border-gray-100 bg-orange-50/40">
                          <td colSpan={9} className="px-3.5 py-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-medium text-gray-500">New on-hand qty</label>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={adjustNewOnHand}
                                  onChange={(e) => setAdjustNewOnHand(e.target.value)}
                                  className="h-8 w-28 rounded-lg border border-gray-200 bg-white px-2.5 text-[10px] text-gray-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-medium text-gray-500">Reason</label>
                                <div className="relative">
                                  <select
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value as ChangeReason)}
                                    className="h-8 w-40 appearance-none rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-[10px] text-gray-700 outline-none focus:border-orange-300"
                                  >
                                    {CHANGE_REASONS.map((r) => (
                                      <option key={r} value={r}>
                                        {r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown size={12} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-400" />
                                </div>
                              </div>

                              <div className="flex flex-1 min-w-[160px] flex-col gap-1">
                                <label className="text-[8px] font-medium text-gray-500">Notes (optional)</label>
                                <input
                                  type="text"
                                  value={adjustNotes}
                                  onChange={(e) => setAdjustNotes(e.target.value)}
                                  placeholder="e.g. recount after delivery"
                                  className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-[10px] text-gray-700 outline-none placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                />
                              </div>

                              <button
                                onClick={() => submitAdjust(item)}
                                disabled={saving}
                                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#f15b2a] px-3 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#dc4e21] disabled:opacity-50"
                              >
                                {saving && <Loader2 size={12} className="animate-spin" />}
                                Save
                              </button>

                              <button onClick={closeAdjust} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50">
                                <X size={12} />
                              </button>
                            </div>

                            {adjustError && <p className="mt-2 text-[9px] font-medium text-red-500">{adjustError}</p>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}

                {!loading && filteredItems.length === 0 && !error && (
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
      </div>
    </main>
  );
}