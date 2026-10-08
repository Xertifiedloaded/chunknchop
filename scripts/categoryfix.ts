// scripts/countcheck.ts
import { prisma } from '@/lib/db';

async function main() {
  const cats = await prisma.category.findMany({
    select: {
      name: true,
      _count: { select: { products: { where: { isArchived: false } } } },
    },
  });
  console.table(cats.map((c) => ({ name: c.name, productCount: c._count.products })));

  const products = await prisma.product.findMany({
    select: { name: true, isActive: true, isArchived: true, categoryId: true },
  });
  console.table(products);
}

main().catch(console.error).finally(() => prisma.$disconnect());