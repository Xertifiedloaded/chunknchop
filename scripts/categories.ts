import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Chicken',
    slug: 'chicken',
    color: '#f45d27',
    visible: true,
  },
  {
    name: 'Beef',
    slug: 'beef',
    color: '#781c2d',
    visible: true,
  },
  {
    name: 'Seafood',
    slug: 'seafood',
    color: '#f5a400',
    visible: true,
  },
  {
    name: 'Goat',
    slug: 'goat',
    color: '#918a83',
    visible: true,
  },
  {
    name: 'Turkey',
    slug: 'turkey',
    color: '#b8b3ad',
    visible: true,
  },
  {
    name: 'Pork',
    slug: 'pork',
    color: '#f2764c',
    visible: false,
  },
  {
    name: 'Sausages',
    slug: 'sausages',
    color: '#18c768',
    visible: true,
  },
  {
    name: 'BBQ',
    slug: 'bbq',
    color: '#b73e13',
    visible: true,
  },
  {
    name: 'Dairy',
    slug: 'dairy',
    color: '#625b54',
    visible: true,
  },
  {
    name: 'Frozen',
    slug: 'frozen',
    color: '#37332f',
    visible: true,
  },
  {
    name: 'Spices',
    slug: 'spices',
    color: '#ff9679',
    visible: true,
  },
];

async function main() {
  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        color: category.color,
        isActive: category.visible,
      },
      create: {
        name: category.name,
        slug: category.slug,
        color: category.color,
        isActive: category.visible,
      },
    });

    console.log(`${result.name} → /${result.slug} → ${result.color} → visible: ${result.isActive}`);
  }

  console.log(`\nCreated/updated ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error('Category seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
