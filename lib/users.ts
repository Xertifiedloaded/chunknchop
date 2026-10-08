import prisma from "./db";

prisma

export interface SessionUserRecord {
  id: string;
  email: string;
  role: string;
}

export async function findUserById(id: string): Promise<SessionUserRecord | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
}