import { PrismaClient, type ContentType } from "@prisma/client";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_FAQS,
  DEFAULT_HIGHLIGHTS,
  DEFAULT_LOCATIONS,
  DEFAULT_MEATBOXES,
  DEFAULT_SECTIONS,
  DEFAULT_SLIDES,
  DEFAULT_STANDARD_POINTS,
  DEFAULT_STEPS,
  SEED_PRODUCTS,
} from "../lib/cms/defaults";

const prisma = new PrismaClient();

type SeedRow = { title: string; slug?: string; data: Record<string, unknown> };

async function seedType(type: ContentType, rows: SeedRow[]) {
  const existing = await prisma.contentEntry.count({ where: { type } });
  if (existing > 0) return console.log(`• ${type.padEnd(18)} skipped (${existing} already exist)`);

  await prisma.contentEntry.createMany({
    data: rows.map((r, i) => ({
      type,
      title: r.title,
      slug: r.slug ?? null,
      status: "LIVE" as const,
      sortOrder: i,
      data: r.data as object,
      publishedAt: new Date(),
    })),
  });
  console.log(`✓ ${type.padEnd(18)} seeded ${rows.length}`);
}

async function main() {
  await seedType(
    "HERO",
    DEFAULT_SLIDES.map((s, i) => ({
      title: `Hero ${i + 1}: ${s.lines[0].replace(/\.$/, "")}`,
      data: { lines: s.lines, text: s.text, image: s.image, ctaLabel: s.ctaLabel, ctaTarget: s.ctaTarget, secondaryLabel: s.secondaryLabel, secondaryTarget: s.secondaryTarget },
    }))
  );

  await seedType(
    "SECTION",
    Object.entries(DEFAULT_SECTIONS).map(([key, s]) => ({
      title: `${key[0].toUpperCase()}${key.slice(1)} section`,
      slug: key,
      data: { eyebrow: s.eyebrow ?? "", heading: s.heading, subtext: s.subtext ?? "", image: s.image ?? "", buttonLabel: s.buttonLabel ?? "", secondaryLabel: s.secondaryLabel ?? "" },
    }))
  );

  await seedType("HIGHLIGHT", DEFAULT_HIGHLIGHTS.map((t) => ({ title: t, data: {} })));
  await seedType("STEP", DEFAULT_STEPS.map((s) => ({ title: s.title, data: { number: s.number, description: s.description } })));
  await seedType(
    "MEATBOX",
    DEFAULT_MEATBOXES.map((b) => ({ title: b.title, data: { label: b.label, contents: b.contents, price: b.price, featured: b.featured, link: b.link ?? "" } }))
  );
  await seedType("STANDARD_POINT", DEFAULT_STANDARD_POINTS.map((p) => ({ title: p.title, data: { description: p.description } })));
  await seedType("FAQ", DEFAULT_FAQS.map((f) => ({ title: f.question, data: { answer: f.answer } })));
  await seedType("DELIVERY_LOCATION", DEFAULT_LOCATIONS.map((name) => ({ title: name, data: {} })));

  for (const [i, c] of DEFAULT_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, description: c.description, image: c.image, sortOrder: i },
    });
  }
  console.log(`✓ Category           ensured ${DEFAULT_CATEGORIES.length}`);

  const supplier = await prisma.user.findFirst({ where: { role: "SUPPLIER" }, select: { id: true } });
  if (!supplier) {
    console.log("• Product            skipped: no SUPPLIER user found. Create one, then re-run.");
  } else {
    for (const p of SEED_PRODUCTS) {
      const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug }, select: { id: true } });
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          supplierId: supplier.id,
          name: p.name,
          description: p.description,
          images: [p.image],
          basePrice: p.basePrice,
          stock: 100,
          inStock: true,
          sku: p.sku,
          unit: "kg",
          reorderPoint: 10,
          meatType: p.meatType,
          preparations: p.preparations,
          category: p.categorySlug.toUpperCase(),
          categoryId: cat?.id,
          isBestSeller: true,
          sameDayDelivery: true,
          tags: [],
        },
      });
    }
    console.log(`✓ Product            ensured ${SEED_PRODUCTS.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());