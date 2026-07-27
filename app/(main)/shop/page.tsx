import { Suspense } from 'react';
import ShopProduct from './ShopProduct';
import EmptyState from '@/components/sections/shops/EmptyState';

export default function ShopPage() {
  return (
    <Suspense fallback={<EmptyState />}>
      <ShopProduct />
    </Suspense>
  );
}


