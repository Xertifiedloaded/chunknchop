import { slugify } from "@/lib/utils/slug";

export const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low", "Top Rated"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const PRICE_MIN = 0;
export const PRICE_MAX = 50000;

export interface FilterState {
  search: string;
  sort: SortOption;
  category: string | "All";
  maxPrice: number;
  preparations: string[];
  inStock: boolean;
  sameDayDelivery: boolean;
  newArrival: boolean;
  bestSeller: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  sort: "Newest",
  category: "All",
  maxPrice: PRICE_MAX,
  preparations: [],
  inStock: false,
  sameDayDelivery: false,
  newArrival: false,
  bestSeller: false,
};

export interface FilterableProduct {
  name: string;
  basePrice: number;
  rating?: number | null;
  createdAt?: string | number | Date | null;
  category?: string | null;
  categoryId?: string | number | null;
  categoryRef?: { slug?: string | null; name?: string | null } | null;
  preparations?: string[] | null;
  inStock?: boolean;
  sameDayDelivery?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export function countActiveFilters(f: FilterState) {
  return [f.category !== "All", f.maxPrice < PRICE_MAX, (f.preparations?.length ?? 0) > 0, f.inStock, f.sameDayDelivery, f.newArrival, f.bestSeller].filter(Boolean).length;
}

function productCategorySlug(p: FilterableProduct): string {
  const ref = p.categoryRef;

  const raw = ref?.slug ? ref.slug.replace(/^\//, "") : typeof p.category === "string" && p.category.trim() ? p.category : ref?.name ? ref.name : p.categoryId ? String(p.categoryId) : "";

  return raw ? slugify(raw) : "";
}

function timeOf(value: FilterableProduct["createdAt"]) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

export function filterProducts<T extends FilterableProduct>(products: T[], f: FilterState): T[] {
  const query = f.search.trim().toLowerCase();
  const selectedPreparations = f.preparations ?? [];
  const selectedCategory = f.category !== "All" && typeof f.category === "string" ? slugify(f.category) : null;

  const result = products.filter((p) => {
    if (f.category !== "All") {
      const productCategory = productCategorySlug(p);
      if (!productCategory || !selectedCategory) return false;
      if (productCategory !== selectedCategory) return false;
    }

    if (p.basePrice > f.maxPrice) return false;

    if (selectedPreparations.length) {
      const available = p.preparations ?? [];
      if (!selectedPreparations.some((prep) => available.includes(prep))) return false;
    }

    if (f.inStock && !p.inStock) return false;
    if (f.sameDayDelivery && !p.sameDayDelivery) return false;
    if (f.newArrival && !p.isNewArrival) return false;
    if (f.bestSeller && !p.isBestSeller) return false;
    if (query && !p.name.toLowerCase().includes(query)) return false;

    return true;
  });

  switch (f.sort) {
    case "Price: Low to High":
      return result.sort((a, b) => a.basePrice - b.basePrice);
    case "Price: High to Low":
      return result.sort((a, b) => b.basePrice - a.basePrice);
    case "Top Rated":
      return result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return result.sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
  }
}
