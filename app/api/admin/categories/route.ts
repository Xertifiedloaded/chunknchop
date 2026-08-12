import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { slugify } from '@/lib/slug';
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [categories, paidItems] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'PAID' } },
        select: {
          quantity: true,
          pricePerUnit: true,
          product: { select: { categoryId: true } },
        },
      }),
    ]);

    const revenueByCategoryId = new Map<string, number>();

    for (const item of paidItems) {
      const categoryId = item.product.categoryId;
      if (!categoryId) continue;

      const lineTotal = item.quantity * item.pricePerUnit;
      revenueByCategoryId.set(categoryId, (revenueByCategoryId.get(categoryId) ?? 0) + lineTotal);
    }

    const totalRevenue = Array.from(revenueByCategoryId.values()).reduce((sum, v) => sum + v, 0);

    const result = categories.map((category) => {
      const revenue = revenueByCategoryId.get(category.id) ?? 0;
      const share = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;

      return {
        id: category.id,
        name: category.name,
        slug: `/${category.slug.replace(/^\//, '')}`,
        description: category.description,
        image: category.image,
        products: category._count.products,
        revenue,
        share,
        color: category.color,
        visible: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Categories error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const rawSlug = String(body.slug ?? '').trim();
    const slug = slugify(rawSlug || name);

    if (!slug) {
      return NextResponse.json({ error: 'Could not derive a valid slug from the name' }, { status: 400 });
    }

    const color = typeof body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color) ? body.color : '#f45d27';
    const description = typeof body.description === 'string' ? body.description.trim() || null : null;
    const isActive = typeof body.visible === 'boolean' ? body.visible : true;

    const category = await prisma.category.create({
      data: { name, description, slug, color, isActive },
    });

    return NextResponse.json(
      {
        id: category.id,
        name: category.name,
        slug: `/${category.slug}`,
        description: category.description,
        image: category.image,
        products: 0,
        revenue: 0,
        share: 0,
        color: category.color,
        visible: category.isActive,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] ?? 'name or slug';
      return NextResponse.json({ error: `A category with this ${field} already exists` }, { status: 409 });
    }

    console.error('Category create error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
