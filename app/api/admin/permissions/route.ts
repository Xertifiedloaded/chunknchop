import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { STAFF_ROLES, ROLE_META, ROLE_PERMISSIONS } from '@/lib/permission';

function toCamelCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

export async function GET(req: NextRequest) {
  const current = await getUserFromRequest(req);

  if (!current || current.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const areas = new Set<string>();

  STAFF_ROLES.forEach((role) => {
    const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || {};
    Object.keys(rolePermissions).forEach((area) => areas.add(area));
  });

  const permissions = Array.from(areas).map((area) => {
    const row: Record<string, string> = { area };

    STAFF_ROLES.forEach((role) => {
      const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || {};
      const camelKey = toCamelCase(role);
      row[camelKey] = (rolePermissions as any)[area] || 'None';
    });

    return row;
  });

  return NextResponse.json({
    permissions,
    roles: STAFF_ROLES.map((role) => ({
      value: role,
      key: toCamelCase(role),
      label: ROLE_META[role as keyof typeof ROLE_META]?.label ?? role,
    })),
  });
}
