import { Category, Preparation, Product, Weight } from './products';

export type SortOption = 'Newest' | 'Price: Low to High' | 'Price: High to Low' | 'Top Rated';

export const SORT_OPTIONS: SortOption[] = [
  'Newest',
  'Price: Low to High',
  'Price: High to Low',
  'Top Rated',
];

export interface FilterState {
  search: string;
  category: Category | 'All';
  minPrice: number;
  maxPrice: number;
  weights: Weight[];
  preparations: Preparation[];
  inStock: boolean;
  sameDayDelivery: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  sort: SortOption;
}

export const PRICE_MIN = 1000;
export const PRICE_MAX = 50000;

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'All',
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  weights: [],
  preparations: [],
  inStock: false,
  sameDayDelivery: false,
  newArrival: false,
  bestSeller: false,
  sort: 'Newest',
};

export function isDefaultFilters(f: FilterState): boolean {
  return (
    f.search === '' &&
    f.category === 'All' &&
    f.minPrice === PRICE_MIN &&
    f.maxPrice === PRICE_MAX &&
    f.weights.length === 0 &&
    f.preparations.length === 0 &&
    !f.inStock &&
    !f.sameDayDelivery &&
    !f.newArrival &&
    !f.bestSeller
  );
}

export function countActiveFilters(f: FilterState): number {
  let count = 0;
  if (f.category !== 'All') count += 1;
  if (f.minPrice !== PRICE_MIN || f.maxPrice !== PRICE_MAX) count += 1;
  count += f.weights.length;
  count += f.preparations.length;
  if (f.inStock) count += 1;
  if (f.sameDayDelivery) count += 1;
  if (f.newArrival) count += 1;
  if (f.bestSeller) count += 1;
  return count;
}

export function filterProducts(products: Product[], f: FilterState): Product[] {
  let result = products.filter((p) => {
    if (f.search.trim() && !p.name.toLowerCase().includes(f.search.trim().toLowerCase())) {
      return false;
    }
    if (f.category !== 'All' && p.category !== f.category) return false;
    if (p.price < f.minPrice || p.price > f.maxPrice) return false;
    if (f.weights.length > 0 && !f.weights.includes(p.weight)) return false;
    if (f.preparations.length > 0 && !f.preparations.includes(p.preparation)) return false;
    if (f.inStock && !p.inStock) return false;
    if (f.sameDayDelivery && !p.sameDayDelivery) return false;
    if (f.newArrival && !p.newArrival) return false;
    if (f.bestSeller && !p.bestSeller) return false;
    return true;
  });

  switch (f.sort) {
    case 'Price: Low to High':
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case 'Price: High to Low':
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    case 'Top Rated':
      result = [...result].sort((a, b) => b.rating - a.rating);
      break;
    case 'Newest':
    default:
      result = [...result].sort((a, b) => a.addedDaysAgo - b.addedDaysAgo);
      break;
  }

  return result;
}
