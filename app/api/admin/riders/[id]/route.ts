import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const p = z
    .object({
      verificationStatus: z.enum(['pending', 'approved', 'rejected']),
      isActive: z.boolean(),
    })
    .strict()
    .safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: 'Invalid rider review decision' }, { status: 400 });
  const { id } = await params;
  try {
    const rider = await prisma.riderProfile.update({
      where: { id },
      data: {
        ...p.data,
        isAvailable:
          p.data.verificationStatus === 'approved' && p.data.isActive ? undefined : false,
      },
    });
    return NextResponse.json({ rider });
  } catch {
    return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
  }
}
