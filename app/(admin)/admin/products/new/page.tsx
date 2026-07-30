import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/sections/shops/ProductForm';

export default function NewProductPage() {
  return (
    <div className="bg-sand min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/products" className="text-ink hover:text-charcoal mb-4 inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft size={16} />
          Back to products
        </Link>
        <h1 className="text-charcoal text-3xl font-bold">Add product</h1>
        <p className="text-ink mb-8">Fill in the details below to list a new product.</p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
