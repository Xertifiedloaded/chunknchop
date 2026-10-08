import { Suspense } from 'react';
import ShopProduct from './ShopProduct';
import EmptyState from '@/components/sections/shops/EmptyState';
import Hero from '@/components/sections/main/Hero';

export default function ShopPage() {
  return (
    <Suspense fallback={<EmptyState />}>
      <Hero
        title={
          <>
            Shop Fresh. <span className="text-brand">Cook Better.</span>
          </>
        }
        paragraph="Premium beef, chicken, seafood, goat meat, pork and more — expertly portioned and delivered fresh to your doorstep."
        isCenter={true}
        features={false}
      />
      <ShopProduct />
    </Suspense>
  );
}
