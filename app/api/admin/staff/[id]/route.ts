import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';
import { STAFF_ROLES } from '@/lib/permission';

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  staffRole: z.enum(STAFF_ROLES).optional(),
  shift: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await getUserFromRequest(req);

    if (!current || current.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing || existing.role !== 'STAFF') {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email ? { email: data.email } : {}),
        ...(data.name !== undefined ? { name: data.name || null } : {}),
        ...(data.staffRole ? { staffRole: data.staffRole } : {}),
        ...(data.shift !== undefined ? { shift: data.shift || null } : {}),
        ...(data.password ? { password: hashPassword(data.password) } : {}),
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        staffRole: updated.staffRole,
        shift: updated.shift,
      },
    });
  } catch (error) {
    console.error('Error updating staff:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await getUserFromRequest(req);

    if (!current || current.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing || existing.role !== 'STAFF') {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
