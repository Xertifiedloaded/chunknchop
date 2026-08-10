'use client';

import Link from 'next/link';
import ProductCard from '@/components/sections/shops/ProductCard';
import { Product } from '@/lib/store/productStore';

interface ProductSectionProps {
  title: string;
  description?: string;
  products: Product[];
  viewAllHref?: string;
}

export default function ProductSection({ title, description, products, viewAllHref = '/shop' }: ProductSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl space-y-16 px-4 py-16 text-black sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>

          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>

        <Link href={viewAllHref} className="shrink-0 text-sm font-semibold text-orange-500 transition hover:text-orange-600">
          View all
          <span className="ml-1">›</span>
        </Link>
      </div>

      <div className="grid  gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
