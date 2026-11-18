import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  const profile = await prisma.riderProfile.findUnique({
    where: { userId: s.user.id },
    include: { zones: { include: { zone: true } } },
  });
  return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'private, no-store' } });
}
