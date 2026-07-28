import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/sections/shops/ProductForm';

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-sand p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-charcoal">
          <ArrowLeft size={16} />
          Back to products
        </Link>
        <h1 className="text-3xl font-bold text-charcoal">Add product</h1>
        <p className="mb-8 text-ink">Fill in the details below to list a new product.</p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
