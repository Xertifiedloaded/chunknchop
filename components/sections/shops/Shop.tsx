"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal, Search } from "lucide-react";

import { useProductStore } from "@/store/productStore";
import { DEFAULT_FILTERS, FilterState, SORT_OPTIONS, countActiveFilters, filterProducts } from "@/features/catalog/filters";

import CategoryPills from "@/features/catalog/components/CategoryPills";
import EmptyState from "@/components/feedback/EmptyState";
import ProductCard from "@/features/catalog/components/ProductCard";
import FilterSidebar, { MobileFilterDrawer } from "@/features/catalog/components/FilterSidebar";
import LoadingState from "@/components/feedback/LoadingState";

const PAGE_SIZE = 8;
const ALL = "All";
const pill = "rounded-full border border-[#E5E7EB] bg-white shadow-sm";

const SECTION_FLAGS: Record<string, Partial<FilterState>> = {
  "best-sellers": { bestSeller: true },
  "new-arrivals": { newArrival: true },
};

interface CategoryOption {
  id?: string;
  name: string;
  slug: string;
}

interface CategorizedProduct {
  categoryId?: string | null;
  category?: string | null;
  meatType?: string | null;
  categoryRef?: { id?: string | null; name?: string | null } | null;
}

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

const applySection = (base: FilterState, section: string | null): FilterState => ({ ...base, ...SECTION_FLAGS[section ?? ""] });

function matchesCategory(product: unknown, category: CategoryOption | null) {
  if (!category) return true;

  const item = product as CategorizedProduct;
  if (category.id && (item.categoryId === category.id || item.categoryRef?.id === category.id)) return true;

  const target = normalize(category.name);
  return [item.category, item.categoryRef?.name, item.meatType].some((value) => normalize(value).replace(/_/g, " ") === target);
}

function useLoad(url: string, onData: (data: any) => void) {
  const [loading, setLoading] = useState(true);
  const handler = useRef(onData);
  handler.current = onData;

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })
      .then((data) => !cancelled && handler.current(data))
      .catch((error) => console.error(`Failed to load ${url}:`, error))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [url]);

  return loading;
}

export default function Shop() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { products, setProducts } = useProductStore();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [filters, setFilters] = useState<FilterState>(() => applySection({ ...DEFAULT_FILTERS, category: ALL }, searchParams.get("section")));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadingProducts = useLoad("/api/products", (data) => setProducts(data.products || []));
  const loadingCategories = useLoad("/api/categories", (data) =>
    setCategories((Array.isArray(data) ? data : []).map(({ id, name, slug }: CategoryOption) => ({ id, name, slug }))),
  );

  const categorySlug = searchParams.get("category");
  const hasCategoryParam = !!categorySlug && normalize(categorySlug) !== "all";
  const resetPage = useCallback(() => setVisibleCount(PAGE_SIZE), []);

  useEffect(() => {
    const section = searchParams.get("section");

    setFilters((current) => {
      const next = applySection(current, section);
      return next.bestSeller === current.bestSeller && next.newArrival === current.newArrival ? current : next;
    });
    resetPage();
  }, [searchParams, resetPage]);

  const selectedCategory = useMemo(() => (hasCategoryParam ? (categories.find((c) => normalize(c.slug) === normalize(categorySlug)) ?? null) : null), [categories, categorySlug, hasCategoryParam]);

  const categoryLabel = selectedCategory?.name ?? ALL;
  const activeFilters = useMemo<FilterState>(() => ({ ...filters, category: categoryLabel as FilterState["category"] }), [filters, categoryLabel]);

  const filtered = useMemo(
    () => filterProducts(products, { ...filters, category: ALL as FilterState["category"] }).filter((product) => matchesCategory(product, selectedCategory)),
    [products, filters, selectedCategory],
  );

  const activeCount = countActiveFilters(activeFilters);
  const isLoading = loadingProducts || (hasCategoryParam && loadingCategories);

  const setCategoryInUrl = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (slug && normalize(slug) !== "all") params.set("category", slug);
    else params.delete("category");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    resetPage();
  };

  const applyFilters = (next: FilterState) => {
    if (next.category !== categoryLabel) {
      setCategoryInUrl(next.category === ALL ? null : (categories.find((c) => c.name === next.category)?.slug ?? null));
    }
    setFilters(next);
    resetPage();
  };

  const clearAll = () => {
    setFilters({ ...DEFAULT_FILTERS, category: ALL });
    resetPage();
    if (searchParams.toString()) router.replace(pathname, { scroll: false });
  };

  return (
    <main className="min-h-screen bg-white text-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-charcoal" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => applyFilters({ ...activeFilters, search: e.target.value })}
              placeholder="Search premium meat..."
              className={`${pill} text-ink-900 w-full py-3 pr-4 pl-11 text-sm transition outline-none placeholder:text-charcoal`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDrawerOpen(true)} className={`${pill} hover:bg-ember-50 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-ink transition lg:hidden`}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && <span className="bg-ember-500 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white">{activeCount}</span>}
            </button>

            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-charcoal" />
              <select
                value={filters.sort}
                onChange={(e) => applyFilters({ ...activeFilters, sort: e.target.value as FilterState["sort"] })}
                aria-label="Sort products"
                className={`${pill} focus:ring-ember-100 appearance-none py-3 pr-8 pl-9 text-sm font-medium text-ink transition outline-none focus:ring-2`}
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
          <CategoryPills active={categoryLabel} onSelect={setCategoryInUrl} />
        </div>

        <div className="mt-6 flex gap-8">
          <FilterSidebar filters={activeFilters} onChange={applyFilters} onClearAll={clearAll} className="hidden w-64 shrink-0 lg:flex" />

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <p className="mb-4 text-sm text-charcoal">
                  Showing <span className="text-ink-900 font-semibold">{filtered.length}</span> product
                  {filtered.length === 1 ? "" : "s"}
                </p>

                {filtered.length === 0 ? (
                  <EmptyState onClear={clearAll} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-1 xl:grid-cols-3 2xl:grid-cols-4">
                      {filtered.slice(0, visibleCount).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {visibleCount < filtered.length && (
                      <div className="mt-10 flex justify-center">
                        <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className={`${pill} px-8 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100`}>
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

      <MobileFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} filters={activeFilters} onChange={applyFilters} onClearAll={clearAll} />
    </main>
  );
}