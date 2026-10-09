"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal, Search } from "lucide-react";

import { useProductStore } from "@/store/productStore";
import {
  DEFAULT_FILTERS,
  FilterState,
  SORT_OPTIONS,
  countActiveFilters,
  filterProducts,
} from "@/features/catalog/filters";

import CategoryPills from "@/features/catalog/components/CategoryPills";
import EmptyState from "@/components/feedback/EmptyState";
import ProductCard from "@/features/catalog/components/ProductCard";
import FilterSidebar, {
  MobileFilterDrawer,
} from "@/features/catalog/components/FilterSidebar";
import LoadingState from "@/components/feedback/LoadingState";

const PAGE_SIZE = 8;
const ALL = "All";

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

function matchesCategory(
  product: unknown,
  category: CategoryOption | null,
): boolean {
  if (!category) return true;

  const item = product as CategorizedProduct;

  if (
    category.id &&
    (item.categoryId === category.id || item.categoryRef?.id === category.id)
  ) {
    return true;
  }

  const target = normalize(category.name);

  return [item.category, item.categoryRef?.name, item.meatType].some(
    (value) => normalize(value).replace(/_/g, " ") === target,
  );
}

function applySectionParam(
  base: FilterState,
  section: string | null,
): FilterState {
  switch (section) {
    case "best-sellers":
      return { ...base, bestSeller: true };
    case "new-arrivals":
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
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() =>
    applySectionParam(
      { ...DEFAULT_FILTERS, category: ALL },
      searchParams.get("section"),
    ),
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categorySlug = searchParams.get("category");
  const hasCategoryParam =
    Boolean(categorySlug) && normalize(categorySlug) !== "all";

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setIsLoadingProducts(true);

        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        if (cancelled) return;

        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [setProducts]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to load categories");

        const data = await res.json();
        if (cancelled) return;

        setCategories(
          (Array.isArray(data) ? data : []).map(
            (c: { id?: string; name: string; slug: string }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
            }),
          ),
        );
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        if (!cancelled) setCategoriesLoaded(true);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const section = searchParams.get("section");

    setFilters((current) => {
      const next = applySectionParam(current, section);
      const unchanged =
        next.bestSeller === current.bestSeller &&
        next.newArrival === current.newArrival;
      return unchanged ? current : next;
    });

    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  const selectedCategory = useMemo<CategoryOption | null>(() => {
    if (!hasCategoryParam) return null;
    return (
      categories.find((c) => normalize(c.slug) === normalize(categorySlug)) ??
      null
    );
  }, [categories, categorySlug, hasCategoryParam]);

  const categoryLabel = selectedCategory?.name ?? ALL;

  const activeFilters = useMemo<FilterState>(
    () => ({ ...filters, category: categoryLabel as FilterState["category"] }),
    [filters, categoryLabel],
  );

  const filtered = useMemo(() => {
    const base = filterProducts(products, {
      ...filters,
      category: ALL as FilterState["category"],
    });
    return base.filter((product) => matchesCategory(product, selectedCategory));
  }, [products, filters, selectedCategory]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const activeCount = countActiveFilters(activeFilters);
  const isLoading =
    isLoadingProducts || (hasCategoryParam && !categoriesLoaded);

  const setCategoryInUrl = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (slug && normalize(slug) !== "all") {
      params.set("category", slug);
    } else {
      params.delete("category");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    setVisibleCount(PAGE_SIZE);
  };

  const applyFilters = (next: FilterState) => {
    if (next.category !== categoryLabel) {
      const match =
        next.category === ALL
          ? null
          : categories.find((c) => c.name === next.category);
      setCategoryInUrl(match?.slug ?? null);
    }

    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const clearAll = () => {
    setFilters({ ...DEFAULT_FILTERS, category: ALL });
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
                applyFilters({ ...activeFilters, search: e.target.value })
              }
              placeholder="Search premium meat..."
              className="text-ink-900 placeholder:text-charcoal w-full rounded-full border border-[#E5E7EB] bg-white py-3 pr-4 pl-11 text-sm shadow-sm transition outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-ink hover:bg-ember-50 flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold shadow-sm transition lg:hidden"
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
              <ArrowUpDown className="text-charcoal pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />

              <select
                value={filters.sort}
                onChange={(e) =>
                  applyFilters({
                    ...activeFilters,
                    sort: e.target.value as FilterState["sort"],
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
            active={categoryLabel}
            onSelect={(slug) => setCategoryInUrl(slug)}
          />
        </div>

        <div className="mt-6 flex gap-8">
          <FilterSidebar
            filters={activeFilters}
            onChange={applyFilters}
            onClearAll={clearAll}
            className="hidden w-64 shrink-0 lg:flex"
          />

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <p className="text-charcoal mb-4 text-sm">
                  Showing{" "}
                  <span className="text-ink-900 font-semibold">
                    {filtered.length}
                  </span>{" "}
                  product
                  {filtered.length === 1 ? "" : "s"}
                </p>

                {filtered.length === 0 ? (
                  <EmptyState onClear={clearAll} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-1 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {visibleCount < filtered.length && (
                      <div className="mt-10 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleCount((count) => count + PAGE_SIZE)
                          }
                          className="rounded-full border border-[#E5E7EB] bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
                        >
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

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={activeFilters}
        onChange={applyFilters}
        onClearAll={clearAll}
      />
    </main>
  );
}
