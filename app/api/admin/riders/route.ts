import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-api';
export async function GET() {
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const riders = await prisma.riderProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true, image: true } },
      zones: { include: { zone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ riders });
}
