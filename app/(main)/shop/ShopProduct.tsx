'use client';

import { useMemo } from 'react';

import ProductSection from '@/components/sections/shops/ProductSection';
import Shop from '@/components/sections/shops/Shop';
import { useProductStore } from '@/lib/store/productStore';

export default function ShopProduct() {
  const { products } = useProductStore();

  const bestSellerProducts = useMemo(() => {
    return products.filter((product) => product.isBestSeller);
  }, [products]);

  const newArrivalProducts = useMemo(() => {
    return products.filter((product) => product.isNewArrival);
  }, [products]);

  return (
    <main>
      <Shop />

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 bg-white text-black lg:px-8">
        <ProductSection title="Best Sellers" description="Our most popular cuts" products={bestSellerProducts} viewAllHref="/shop?section=best-sellers" />

        <ProductSection title="New Arrivals" description="Fresh products just added" products={newArrivalProducts} viewAllHref="/shop?section=new-arrivals" />
      </div>
    </main>
  );
}
