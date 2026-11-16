import type { Product } from '@prisma/client';
import { productCategories, type CatalogProduct } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';

const categories = new Set<string>(productCategories);

export function toCatalogProduct(product: Product): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    cut: product.cut,
    priceCents: product.priceCents, 
    unit: product.unit,
    imageUrl: product.imageUrl,
    badge: product.badge ?? null,
    category: product.category as CatalogProduct['category'],
    published: product.published,
    createdAt: product.createdAt.toISOString(),
  };
}

export async function getPublishedProducts() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return products.filter((p) => categories.has(p.category)).map(toCatalogProduct);
}