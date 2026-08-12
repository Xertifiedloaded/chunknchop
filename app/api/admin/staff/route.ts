import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';
import { STAFF_ROLES, ROLE_META, ROLE_PERMISSIONS, permissionCount } from '@/lib/permission';

const staffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  staffRole: z.enum(STAFF_ROLES),
  shift: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const current = getUserFromRequest(req);

    if (!current || current.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staff = await prisma.user.findMany({
      where: {
        role: 'STAFF',
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formatted = staff.map((s) => {
      const staffRole = s.staffRole;

      const roleMeta = staffRole ? ROLE_META[staffRole as keyof typeof ROLE_META] : null;

      const rolePermissions = staffRole ? ROLE_PERMISSIONS[staffRole as keyof typeof ROLE_PERMISSIONS] : {};

      const permissions = Object.entries(rolePermissions)
        .filter(([, level]) => level !== 'None')
        .map(([area, level]) => ({
          area,
          level,
        }));

      return {
        id: s.id,
        email: s.email,
        name: s.name,
        role: s.role,
        staffRole,
        staffRoleLabel: roleMeta?.label ?? null,
        department: roleMeta?.department ?? null,
        description: roleMeta?.description ?? null,
        color: roleMeta?.color ?? null,
        permissions,
        permissionCount: staffRole ? permissionCount(staffRole as keyof typeof ROLE_PERMISSIONS) : 0,
        shift: s.shift,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error listing staff:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const current = getUserFromRequest(req);

    if (!current || current.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const { email, password, name, staffRole, shift } = staffSchema.parse(body);

    const exists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (exists) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashed = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? null,
        role: 'STAFF',
        staffRole,
        shift: shift || null,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          staffRole: user.staffRole,
          shift: user.shift,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error('Error creating staff:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.errors,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
