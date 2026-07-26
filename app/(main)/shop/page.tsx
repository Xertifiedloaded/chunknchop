'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, SlidersHorizontal, Search } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import {
  DEFAULT_FILTERS,
  FilterState,
  SORT_OPTIONS,
  countActiveFilters,
  filterProducts,
} from '@/lib/filters';

import CategoryPills from '@/components/CategoryPills';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import FilterSidebar, { MobileFilterDrawer } from '@/components/FilterSidebar';
const PAGE_SIZE = 8;

export default function Shop() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => filterProducts(PRODUCTS, filters), [filters]);
  const visibleProducts = filtered.slice(0, visibleCount);
  const activeCount = countActiveFilters(filters);

  const applyFilters = (next: FilterState) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="text-ink-500 pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => applyFilters({ ...filters, search: e.target.value })}
              placeholder="Search premium meat..."
              className="text-ink-900 placeholder:text-ink-500 w-full rounded-full border border-[#E5E7EB] bg-white py-3 pr-4 pl-11 text-sm shadow-sm transition outline-none"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-ink-700 hover:bg-ember-50 flex items-center gap-2 rounded-full border bg-white px-4 py-3 text-sm font-semibold shadow-sm transition lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="bg-ember-500 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>

            <div className="relative">
              <ArrowUpDown className="text-ink-500 pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              <select
                value={filters.sort}
                onChange={(e) =>
                  applyFilters({ ...filters, sort: e.target.value as FilterState['sort'] })
                }
                aria-label="Sort products"
                className="text-ink-700 focus:ring-ember-100 appearance-none rounded-full border bg-white py-3 pr-8 pl-9 text-sm font-medium shadow-sm transition outline-none focus:ring-2"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <CategoryPills
            active={filters.category}
            onSelect={(cat) => applyFilters({ ...filters, category: cat })}
          />
        </div>

        <div className="mt-6 flex gap-8">
          <FilterSidebar
            filters={filters}
            onChange={applyFilters}
            onClearAll={clearAll}
            className="hidden w-64 shrink-0 lg:flex"
          />

          <div className="min-w-0 flex-1">
            <p className="text-ink-500 mb-4 text-sm">
              Showing <span className="text-ink-900 font-semibold">{filtered.length}</span> product
              {filtered.length === 1 ? '' : 's'}
            </p>

            {filtered.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {visibleCount < filtered.length && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="bg-ink-900 hover:bg-ink-700 rounded-full px-8 py-3 text-sm font-semibold text-white transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={applyFilters}
        onClearAll={clearAll}
      />
    </main>
  );
}
