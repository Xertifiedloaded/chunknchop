import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import prisma from '@/lib/db';
import ProductForm from '@/components/sections/shops/ProductForm';

function toCsv(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : '';
}

async function EditProductFormLoader({ id }: { id: string }) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      meatType: true,
      category: true,
      basePrice: true,
      stock: true,
      tags: true,
      preparations: true,
      isNewArrival: true,
      isBestSeller: true,
      sameDayDelivery: true,
      images: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      mode="edit"
      productId={id}
      initial={{
        name: product.name,
        description: product.description ?? '',
        meatType: product.meatType,
        category: product.category ?? '',
        basePrice: String(product.basePrice),
        stock: String(product.stock),
        tags: toCsv(product.tags),
        preparations: toCsv(product.preparations),
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        sameDayDelivery: product.sameDayDelivery,
      }}
      initialImages={product.images}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="border-sand mx-auto flex max-w-3xl items-center justify-center rounded-2xl border bg-white p-16 shadow-sm">
      <Loader2 className="text-ink h-6 w-6 animate-spin" />
    </div>
  );
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="bg-sand min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/products" className="text-ink hover:text-charcoal mb-4 inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft size={16} />
          Back to products
        </Link>
        <h1 className="text-charcoal text-3xl font-bold">Edit product</h1>
        <p className="text-ink mb-8">Update the details below and save your changes.</p>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <EditProductFormLoader id={id} />
      </Suspense>
    </div>
  );
}
