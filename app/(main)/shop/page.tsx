import { Suspense } from 'react';
import ShopProduct from './ShopProduct';

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ShopProduct />
    </Suspense>
  );
}

function ShopPageSkeleton() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted mt-8 h-64 animate-pulse rounded-xl" />
      </div>
    </main>
  );
}
