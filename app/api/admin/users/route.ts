import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const role = (url.searchParams.get('role') ?? 'all').toLowerCase();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  });
  const filtered = users.filter((user) => {
    const text = `${user.name ?? ''} ${user.email ?? ''} ${user.id}`.toLowerCase();
    return (
      (!q || text.includes(q)) &&
      (role === 'all' || (user.role ?? 'customer').toLowerCase() === role)
    );
  });
  const safeUsers = filtered.map((user) => ({
    id: user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? 'customer',
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt.toISOString(),
  }));
  return NextResponse.json(
    {
      users: safeUsers,
      total: safeUsers.length,
      summary: {
        total: users.length,
        customers: users.filter((user) => (user.role ?? 'customer').toLowerCase() === 'customer')
          .length,
        admins: users.filter((user) => (user.role ?? '').toLowerCase() === 'admin').length,
        riders: users.filter((user) => (user.role ?? '').toLowerCase() === 'rider').length,
      },
    },
    { headers },
  );
}
