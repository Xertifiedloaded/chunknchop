import Storefront from '@/components/home/storefront';
import { getPublishedProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const products = await getPublishedProducts();
  return <Storefront products={products} />;
}
