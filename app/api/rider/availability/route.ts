import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
export async function PATCH(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  const p = z
    .object({ isAvailable: z.boolean() })
    .strict()
    .safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: 'Invalid availability value' }, { status: 400 });
  const profile = await prisma.riderProfile.findUnique({ where: { userId: s.user.id } });
  if (!profile)
    return NextResponse.json({ error: 'Complete rider registration first' }, { status: 409 });
  if (profile.verificationStatus !== 'approved' || !profile.isActive)
    return NextResponse.json(
      { error: 'Your rider account must be approved and active before you can go online' },
      { status: 403 },
    );
  const updated = await prisma.riderProfile.update({
    where: { userId: s.user.id },
    data: { isAvailable: p.data.isAvailable },
  });
  return NextResponse.json({ isAvailable: updated.isAvailable });
}
