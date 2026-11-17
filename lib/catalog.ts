export const productCategories = ['Beef', 'Poultry', 'Pork', 'Lamb'] as const;

export type ProductCategory = (typeof productCategories)[number];

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cut: string;
  priceCents: number;
  unit: string;
  imageUrl: string;
  badge: string | null;
  discountPercent: number;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
  discountedPriceCents: number;
  category: ProductCategory;
  published: boolean;
  createdAt: string;
};

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(priceKobo: number) {
  return nairaFormatter.format(priceKobo / 100);
}

export function koboToNairaInput(priceKobo: number) {
  return String(priceKobo / 100);
}
