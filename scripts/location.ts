import { PrismaClient, LocationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


const locations: { name: string; type: LocationType }[] = [
  { name: 'Cold Room 1', type: 'COLD_ROOM' },
  { name: 'Cold Room 2', type: 'COLD_ROOM' },
  { name: 'Chiller 1', type: 'CHILLER' },
  { name: 'Chiller 2', type: 'CHILLER' },
  { name: 'Chiller 3', type: 'CHILLER' },
  { name: 'Freezer 1', type: 'FREEZER' },
  { name: 'Freezer 2', type: 'FREEZER' },
  { name: 'Freezer 3', type: 'FREEZER' },
  { name: 'Dry Store', type: 'DRY_STORE' },
];

async function main() {
  console.log(`Seeding ${locations.length} storage locations...`);

  for (const location of locations) {
    const result = await prisma.storageLocation.upsert({
      where: { name: location.name },
      update: { type: location.type, isActive: true },
      create: location,
    });

    console.log(`  ✓ ${result.name} (${result.type})`);
  }

  console.log('Done.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
