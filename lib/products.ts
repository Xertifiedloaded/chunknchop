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
    discountPercent: product.discountPercent ?? 0,
    discountStartsAt: product.discountStartsAt?.toISOString() ?? null,
    discountEndsAt: product.discountEndsAt?.toISOString() ?? null,
    discountedPriceCents: getEffectiveProductPrice(product),
    category: product.category as CatalogProduct['category'],
    productType: (product as any).productType ?? 'standard',
    bundleItems: Array.isArray((product as any).bundleItems) ? (product as any).bundleItems : [],
    published: product.published,
    createdAt: product.createdAt.toISOString(),
  };
}

export function isProductDiscountActive(
  product: {
    discountPercent?: number | null;
    discountStartsAt?: Date | null;
    discountEndsAt?: Date | null;
  },
  now = new Date(),
) {
  return (
    (product.discountPercent ?? 0) > 0 &&
    (!product.discountStartsAt || product.discountStartsAt <= now) &&
    (!product.discountEndsAt || product.discountEndsAt >= now)
  );
}

export function getEffectiveProductPrice(
  product: {
    priceCents: number;
    discountPercent?: number | null;
    discountStartsAt?: Date | null;
    discountEndsAt?: Date | null;
  },
  now = new Date(),
) {
  if (!isProductDiscountActive(product, now)) return product.priceCents;
  return Math.max(0, Math.round(product.priceCents * (1 - (product.discountPercent ?? 0) / 100)));
}

export async function getPublishedProducts() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return products.map(toCatalogProduct);
}
