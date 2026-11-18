import { NextRequest, NextResponse } from 'next/server';

import { hasSameOrigin, isValidEmail, normalizeEmail, requestIp, takeRateLimit } from '@/lib/auth';

import { requireAdminApi } from '@/lib/admin-api';
import { issueEmailCode } from '@/lib/auth-email';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'private, no-store',
};

const allowedRoles = ['customer', 'admin', 'rider'] as const;

type AllowedRole = (typeof allowedRoles)[number];

function isAllowedRole(role: unknown): role is AllowedRole {
  return typeof role === 'string' && allowedRoles.includes(role as AllowedRole);
}

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  const access = await requireAdminApi();

  if (access.response) {
    return access.response;
  }

  try {
    const url = new URL(request.url);

    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();

    const role = (url.searchParams.get('role') ?? 'all').toLowerCase();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2000,
    });

    const filtered = users.filter((user) => {
      const searchableText = `${user.name} ${user.email} ${user.id}`.toLowerCase();

      return (
        (!q || searchableText.includes(q)) && (role === 'all' || user.role.toLowerCase() === role)
      );
    });

    return json({
      users: filtered.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      })),

      total: filtered.length,

      summary: {
        total: users.length,
        customers: users.filter((user) => user.role.toLowerCase() === 'customer').length,
        admins: users.filter((user) => user.role.toLowerCase() === 'admin').length,
        riders: users.filter((user) => user.role.toLowerCase() === 'rider').length,
      },
    });
  } catch (error) {
    console.error('[admin-users] GET failed:', error);

    return json(
      {
        error: 'Could not load users. Please try again.',
      },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi();

  if (access.response) {
    return access.response;
  }

  if (!hasSameOrigin(request)) {
    return json(
      {
        error: 'Request could not be verified.',
      },
      403,
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return json(
      {
        error: 'Invalid request body.',
      },
      400,
    );
  }

  const email = normalizeEmail(body.email);
  const role = body.role;

  if (!isValidEmail(email) || !isAllowedRole(role)) {
    return json(
      {
        error: 'Enter a valid email address and select a valid account role.',
      },
      400,
    );
  }

  const rateLimitKey = `admin-invite:${access.user.id}:${requestIp(request)}`;

  if (!(await takeRateLimit(rateLimitKey, 20, 60 * 60_000))) {
    return json(
      {
        error: 'You have sent too many invitations. Please try again later.',
      },
      429,
    );
  }

  let createdUserId: string | null = null;

  try {
    const existing = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (existing) {
      return json(
        {
          error: existing.emailVerified
            ? 'An account with this email already exists.'
            : 'An account with this email is already awaiting verification. Resolve that account before inviting again.',
        },
        409,
      );
    }

    const displayName = email.split('@')[0].slice(0, 80) || 'New user';

    const user = await prisma.user.create({
      data: {
        name: displayName,
        email,
        role,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    createdUserId = user.id;

    const sent = await issueEmailCode(user.email, user.name, 'invite');

    if (!sent) {
      console.error('[admin-users] EmailJS did not accept invitation:', user.email);

      await prisma.user.deleteMany({
        where: {
          id: user.id,
          emailVerified: false,
        },
      });

      createdUserId = null;

      return json(
        {
          error:
            'The invitation email could not be sent. Check the server logs and EmailJS history.',
        },
        503,
      );
    }

    console.info('[admin-users] Invitation accepted by EmailJS:', {
      email: user.email,
      role: user.role,
    });

    return json(
      {
        ok: true,
        message: `Invitation email accepted for ${user.email}.`,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      201,
    );
  } catch (error) {
    console.error('[admin-users] POST failed:', error);

    if (createdUserId) {
      try {
        await prisma.user.deleteMany({
          where: {
            id: createdUserId,
            emailVerified: false,
          },
        });
      } catch (cleanupError) {
        console.error('[admin-users] Pending account cleanup failed:', cleanupError);
      }
    }

    return json(
      {
        error: 'Could not create or invite this account. Please try again.',
      },
      500,
    );
  }
}
