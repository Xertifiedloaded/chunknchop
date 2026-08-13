import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { STAFF_ROLES, ROLE_META } from '@/lib/permission';

export async function GET(req: NextRequest) {
  const current = await getUserFromRequest(req);

  if (!current || current.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = STAFF_ROLES.map((role) => ({
    value: role,
    label: ROLE_META[role as keyof typeof ROLE_META]?.label ?? role,
  }));

  return NextResponse.json(roles);
}
