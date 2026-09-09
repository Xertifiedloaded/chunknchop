import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, image: true, color: true },
    });

    const result = categories.map((c) => ({
      id: c.id,
      name: c.name,
      // Return slug without leading slash to match frontend expectations (e.g. "beef")
      slug: c.slug.replace(/^\//, ''),
      image: c.image,
      color: c.color,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Public categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
