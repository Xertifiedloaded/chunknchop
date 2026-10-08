import { prisma } from '../lib/db';

async function backfill() {
  const items = await prisma.orderItem.findMany({
    where: {
      productId: { not: null },
      OR: [{ productName: null }, { productCategoryId: null }],
    },
    include: { product: { select: { name: true, images: true, sku: true, categoryId: true } } },
  });

  for (const item of items) {
    if (!item.product) continue;

    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        productName: item.productName ?? item.product.name,
        productImage: item.productImage ?? item.product.images?.[0] ?? null,
        productSku: item.productSku ?? item.product.sku,
        productCategoryId: item.productCategoryId ?? item.product.categoryId,
      },
    });
  }
}

backfill().finally(() => prisma.$disconnect());