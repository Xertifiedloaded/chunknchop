'use client';

import { X } from 'lucide-react';
import { CATEGORIES, PREPARATIONS } from '@/lib/categories';
import { formatNaira } from '@/lib/format';
import { FilterState, PRICE_MAX, PRICE_MIN } from '@/lib/filters';

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClearAll: () => void;
  className?: string;
  hideHeader?: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-ink mb-3 text-sm font-semibold">{children}</h3>;
}

export default function FilterSidebar({ filters, onChange, onClearAll, className = '', hideHeader = false }: Props) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const toggleInArray = (arr: string[], value: string): string[] => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

  const rangeProgress = Math.round(((filters.maxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100);

  return (
    <aside className={`flex flex-col ${className}`}>
      {!hideHeader && (
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-ink text-base font-bold">Filters</h2>
          <button type="button" onClick={onClearAll} className="hover:text-ember-700 text-sm font-medium text-[#E65C2E] transition-colors">
            Clear all
          </button>
        </div>
      )}

      <div className="divide-ink/5 flex flex-col divide-y [&>section]:py-5 first:[&>section]:pt-0">
        <section>
          <SectionTitle>Categories</SectionTitle>
          <div className="flex flex-col gap-2.5">
            <label className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="category" className="h-4 w-4 text-black" checked={filters.category === 'All'} onChange={() => update({ category: 'All' })} />
              All
            </label>
            {CATEGORIES.map((cat) => (
              <label key={cat} className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="radio" name="category" className="h-4 w-4 text-black" checked={filters.category === cat} onChange={() => update({ category: cat })} />
                {cat}
              </label>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Price</SectionTitle>
          <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={500} value={filters.maxPrice} style={{ ['--range-progress' as string]: `${rangeProgress}%` }} onChange={(e) => update({ maxPrice: Number(e.target.value) })} className="w-full" aria-label="Maximum price" />
          <div className="text-ink mt-2 flex items-center justify-between text-xs font-medium">
            <span>{formatNaira(PRICE_MIN)}</span>
            <span className="text-ink">{formatNaira(filters.maxPrice)}</span>
          </div>
        </section>

        <section>
          <SectionTitle>Preparation</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {PREPARATIONS.map((p) => (
              <label key={p} className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded text-black" checked={filters.preparations.includes(p)} onChange={() => update({ preparations: toggleInArray(filters.preparations, p) })} />
                {p}
              </label>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Availability</SectionTitle>
          <div className="flex flex-col gap-2.5">
            <label className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded text-black" checked={filters.inStock} onChange={(e) => update({ inStock: e.target.checked })} />
              In Stock
            </label>
            <label className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded text-black" checked={filters.sameDayDelivery} onChange={(e) => update({ sameDayDelivery: e.target.checked })} />
              Same Day Delivery
            </label>
            <label className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded text-black" checked={filters.newArrival} onChange={(e) => update({ newArrival: e.target.checked })} />
              New Arrival
            </label>
            <label className="text-charcoal flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded text-black" checked={filters.bestSeller} onChange={(e) => update({ bestSeller: e.target.checked })} />
              Best Seller
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}

export function MobileFilterDrawer({ open, onClose, filters, onChange, onClearAll }: { open: boolean; onClose: () => void; filters: FilterState; onChange: (next: FilterState) => void; onClearAll: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="bg-ink/40 absolute inset-0 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="bg-cream-100 absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col shadow-2xl">
        <div className="border-ink/10 flex items-center justify-between border-b px-5 py-4">
          <span className="text-ink text-base font-bold">Filters</span>
          <button type="button" onClick={onClose} aria-label="Close filters" className="hover:bg-ink/5 text-charcoal flex h-9 w-9 items-center justify-center rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 scrollbar-thin overflow-y-auto px-5 py-5">
          <FilterSidebar filters={filters} onChange={onChange} onClearAll={onClearAll} hideHeader />
        </div>
        <div className="border-ink/10 border-t p-4">
          <button type="button" onClick={onClose} className="bg-ember-500 w-full rounded-full py-3 text-sm font-semibold text-white transition-colors hover:bg-black">
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
