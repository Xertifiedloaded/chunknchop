import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const defaultDatabaseName = 'fieldandfable';

function getMongoUrl() {
  const url = new URL(process.env.MONGODB_URI!);
  if (!url.pathname || url.pathname === '/') url.pathname = `/${defaultDatabaseName}`;
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getMongoUrl() } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
