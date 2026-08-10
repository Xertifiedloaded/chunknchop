'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, SlidersHorizontal, Search } from 'lucide-react';

import { useProductStore } from '@/lib/store/productStore';
import { DEFAULT_FILTERS, FilterState, SORT_OPTIONS, countActiveFilters, filterProducts } from '@/lib/filters';
import { resolveCategoryFromSlug } from '@/lib/categories';

import CategoryPills from '@/components/sections/shops/CategoryPills';
import EmptyState from '@/components/sections/shops/EmptyState';
import ProductCard from '@/components/sections/shops/ProductCard';
import FilterSidebar, { MobileFilterDrawer } from '@/components/sections/shops/FilterSidebar';
import LoadingState from '@/components/sections/common/LoadingState';

const PAGE_SIZE = 8;

function applySectionParam(base: FilterState, section: string | null): FilterState {
  switch (section) {
    case 'best-sellers':
      return { ...base, bestSeller: true };
    case 'new-arrivals':
      return { ...base, newArrival: true };
    default:
      return base;
  }
}

export default function Shop() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { products, setProducts } = useProductStore();

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [filters, setFilters] = useState<FilterState>(() =>
    applySectionParam(
      {
        ...DEFAULT_FILTERS,
        category: resolveCategoryFromSlug(searchParams.get('category')),
      },
      searchParams.get('section')
    )
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);

        const res = await fetch('/api/products');

        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await res.json();

        console.log('Products:', data.products);

        setProducts(data.products || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [setProducts]);

  useEffect(() => {
    const categoryFromUrl = resolveCategoryFromSlug(searchParams.get('category'));
    const sectionFromUrl = searchParams.get('section');

    setFilters((currentFilters) => {
      const next = applySectionParam(
        {
          ...currentFilters,
          category: categoryFromUrl,
        },
        sectionFromUrl
      );

      const unchanged = next.category === currentFilters.category && next.bestSeller === currentFilters.bestSeller && next.newArrival === currentFilters.newArrival;

      return unchanged ? currentFilters : next;
    });

    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return filterProducts(products, filters);
  }, [products, filters]);

  const visibleProducts = filtered.slice(0, visibleCount);

  const activeCount = countActiveFilters(filters);

  const applyFilters = (next: FilterState) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const clearAll = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      category: 'All',
    });

    setVisibleCount(PAGE_SIZE);
    if (searchParams.toString()) {
      router.replace(pathname, { scroll: false });
    }
  };

  return (
    <main className="text-charcoal min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="text-charcoal pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />

            <input
              type="search"
              value={filters.search}
              onChange={(e) =>
                applyFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
              placeholder="Search premium meat..."
              className="text-ink-900 placeholder:text-charcoal w-full rounded-full border border-[#E5E7EB] bg-white py-3 pr-4 pl-11 text-sm shadow-sm transition outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDrawerOpen(true)} className="text-ink hover:bg-ember-50 flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold shadow-sm transition lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && <span className="bg-ember-500 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white">{activeCount}</span>}
            </button>

            <div className="relative">
              <ArrowUpDown className="text-charcoal pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />

              <select
                value={filters.sort}
                onChange={(e) =>
                  applyFilters({
                    ...filters,
                    sort: e.target.value as FilterState['sort'],
                  })
                }
                aria-label="Sort products"
                className="text-ink focus:ring-ember-100 appearance-none rounded-full border border-[#E5E7EB] bg-white py-3 pr-8 pl-9 text-sm font-medium shadow-sm transition outline-none focus:ring-2"
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
            onSelect={(cat) =>
              applyFilters({
                ...filters,
                category: cat,
              })
            }
          />
        </div>

        <div className="mt-6 flex gap-8">
          <FilterSidebar filters={filters} onChange={applyFilters} onClearAll={clearAll} className="hidden w-64 shrink-0 lg:flex" />

          <div className="min-w-0 flex-1">
            {isLoadingProducts ? (
              <LoadingState />
            ) : (
              <>
                <p className="text-charcoal mb-4 text-sm">
                  Showing <span className="text-ink-900 font-semibold">{filtered.length}</span> product
                  {filtered.length === 1 ? '' : 's'}
                </p>

                {filtered.length === 0 ? (
                  <EmptyState onClear={clearAll} />
                ) : (
                  <>
                    <div className="grid  gap-5 grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {visibleCount < filtered.length && (
                      <div className="mt-10 flex justify-center">
                        <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-full border border-[#E5E7EB] bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100">
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MobileFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} filters={filters} onChange={applyFilters} onClearAll={clearAll} />
    </main>
  );
}
