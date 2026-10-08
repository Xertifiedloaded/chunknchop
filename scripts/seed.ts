import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'makindeolaitan01@gmail.com';
  const password = 'admin1234';
  const name = 'Administrator';

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: UserRole.ADMIN,
      password: hashedPassword,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log('Admin created successfully:');
  console.log({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });