import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { StaffRole } from '../lib/permission';

const prisma = new PrismaClient();

const staffMembers: {
  name: string;
  email: string;
  staffRole: StaffRole;
  shift?: string;
}[] = [
  {
    name: 'Makinde Olaitan',
    email: 'makindeolaitan.chunknchop@gmail.com',
    staffRole: 'SUPER_ADMIN',
  },
  {
    name: 'Ismaila Emmanuel',
    email: 'ismailaemmanuel.chunknchop@gmail.com',
    staffRole: 'OPS_MANAGER',
  },
  {
    name: 'MiccyJoe',
    email: 'miccyjoe.chunknchop@gmail.com',
    staffRole: 'SUPPORT',
  },
];

const PASSWORD = 'admin1234';

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 10);

  for (const staff of staffMembers) {
    const existing = await prisma.user.findUnique({ where: { email: staff.email } });

    if (existing) {
      console.log(`Skipping ${staff.email} — already exists`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: staff.email,
        password: hashed,
        name: staff.name,
        role: UserRole.STAFF,
        staffRole: staff.staffRole,
        shift: staff.shift ?? null,
      },
    });

    console.log(`Created staff: ${user.name} (${user.email}) — ${staff.staffRole}`);
  }
}

main()
  .catch((error) => {
    console.error('Error seeding staff:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
