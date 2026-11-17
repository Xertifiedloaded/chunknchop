import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/catalog/product-detail';
import { prisma } from '@/lib/prisma';
import { toCatalogProduct } from '@/lib/products';

type ProductPageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, published: true },
    select: { name: true, description: true },
  });
  return {
    title: product ? `${product.name} | ChunknChop` : 'Cut not found | ChunknChop',
    description: product?.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({ where: { slug, published: true } });
  if (!product) notFound();
  return <ProductDetail product={toCatalogProduct(product)} />;
}
