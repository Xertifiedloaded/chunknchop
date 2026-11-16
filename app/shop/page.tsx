import type { Metadata } from 'next';
import CatalogPage from '@/components/catalog-page';
import { getPublishedProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Shop all cuts | ChunknChop',
  description: 'Browse the current ChunknChop product catalogue.',
};

export default async function ShopPage() {
  const products = await getPublishedProducts();
  return <CatalogPage products={products} />;
}
