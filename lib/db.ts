import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prismaClientSingleton: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

let prisma: PrismaClient;

if (!global.prismaClientSingleton) {
  global.prismaClientSingleton = new PrismaClient({ adapter });
}
prisma = global.prismaClientSingleton;

export default prisma;
export { prisma };
