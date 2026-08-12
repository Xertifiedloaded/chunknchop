export const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Top Rated'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const PRICE_MIN = 0;
export const PRICE_MAX = 50000;

export interface FilterState {
  search: string;
  sort: SortOption;
  category: string | 'All';
  maxPrice: number;
  preparations: string[];
  inStock: boolean;
  sameDayDelivery: boolean;
  newArrival: boolean;
  bestSeller: boolean;
}

export function countActiveFilters(f: FilterState) {
  let count = 0;
  if (f.category !== 'All') count++;
  if (f.maxPrice < PRICE_MAX) count++;
  if (f.preparations.length) count++;
  if (f.inStock) count++;
  if (f.sameDayDelivery) count++;
  if (f.newArrival) count++;
  if (f.bestSeller) count++;
  return count;
}

export function filterProducts(products: any[], f: FilterState): any[] {
  const result = products.filter((p) => {
    if (f.category !== 'All' && p.category !== f.category) return false;
    if (p.basePrice > f.maxPrice) return false;
    if (f.preparations.length && !f.preparations.some((prep) => p.preparations.includes(prep))) return false;
    if (f.inStock && !p.inStock) return false;
    if (f.sameDayDelivery && !p.sameDayDelivery) return false;
    if (f.newArrival && !p.isNewArrival) return false;
    if (f.bestSeller && !p.isBestSeller) return false;
    if (f.search && !p.name.toLowerCase().includes(f.search.toLowerCase())) return false;
    return true;
  });

  switch (f.sort) {
    case 'Price: Low to High':
      return [...result].sort((a, b) => a.basePrice - b.basePrice);
    case 'Price: High to Low':
      return [...result].sort((a, b) => b.basePrice - a.basePrice);
    case 'Top Rated':
      return [...result].sort((a, b) => b.rating - a.rating);
    default:
      return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
