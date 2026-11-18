import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { isAdminUser, hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const clean = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 50) : '';
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
async function admin() {
  const session = await getSession(await headers());
  return session?.user && isAdminUser(session.user) ? session.user : null;
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [saved, products] = await Promise.all([
    prisma.$runCommandRaw({ find: 'ProductCategory', filter: {}, sort: { name: 1 }, limit: 300 }),
    prisma.product.findMany({ select: { category: true }, distinct: ['category'] }),
  ]);
  const docs = (saved as any)?.cursor?.firstBatch ?? [];
  const names = new Set<string>(
    [...docs.map((x: any) => x.name), ...products.map((x) => x.category)].filter(Boolean),
  );
  return NextResponse.json(
    { categories: [...names].sort((a, b) => a.localeCompare(b)) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!(await admin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const name = clean((await req.json().catch(() => null))?.name);
  if (!name) return NextResponse.json({ error: 'Enter a category name' }, { status: 400 });
  const id = slug(name);
  const existing = await prisma.$runCommandRaw({
    find: 'ProductCategory',
    filter: { _id: id },
    limit: 1,
  });
  if ((existing as any)?.cursor?.firstBatch?.length)
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
  await prisma.$runCommandRaw({
    insert: 'ProductCategory',
    documents: [{ _id: id, name, createdAt: new Date() }],
  });
  return NextResponse.json({ category: name }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!(await admin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const name = clean(new URL(req.url).searchParams.get('name'));
  if (!name) return NextResponse.json({ error: 'Category required' }, { status: 400 });
  const used = await prisma.product.count({ where: { category: name } });
  if (used)
    return NextResponse.json(
      { error: `This category is used by ${used} product(s). Reassign them before deleting.` },
      { status: 409 },
    );
  await prisma.$runCommandRaw({
    delete: 'ProductCategory',
    deletes: [{ q: { _id: slug(name) }, limit: 1 }],
  });
  return NextResponse.json({ deleted: true });
}
