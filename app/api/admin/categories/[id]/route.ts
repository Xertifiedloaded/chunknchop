import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { slugify } from '@/lib/slug';

// PATCH /api/admin/categories/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.description === 'string') data.description = body.description.trim() || null;
    if (typeof body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color)) data.color = body.color;
    if (typeof body.visible === 'boolean') data.isActive = body.visible;

    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = slugify(body.slug);
      if (!slug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
      data.slug = slug;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data,
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({
      id: category.id,
      name: category.name,
      slug: `/${category.slug}`,
      description: category.description,
      image: category.image,
      products: category._count.products,
      color: category.color,
      visible: category.isActive,
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] ?? 'name or slug';
      return NextResponse.json({ error: `A category with this ${field} already exists` }, { status: 409 });
    }

    console.error('Category update error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productCount = await prisma.product.count({ where: { categoryId: params.id } });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `${productCount} product(s) still use this category. Reassign them first.` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.error('Category delete error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
