import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const ratings = await prisma.rating.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { score, title, comment } = await request.json();

    if (!score || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be between 1 and 5' }, { status: 400 });
    }

    const existingRating = await prisma.rating.findUnique({
      where: {
        productId_userId: {
          productId: id,
          userId: user.id,
        },
      },
    });

    let rating;
    if (existingRating) {
      rating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          score,
          title,
          comment,
        },
      });
    } else {
      rating = await prisma.rating.create({
        data: {
          productId: id,
          userId: user.id,
          score,
          title,
          comment,
        },
      });
    }

    // Update product rating average
    const allRatings = await prisma.rating.findMany({
      where: { productId: id },
      select: { score: true },
    });

    const averageRating = allRatings.length > 0 ? allRatings.reduce((acc, r) => acc + r.score, 0) / allRatings.length : 5.0;

    await prisma.product.update({
      where: { id },
      data: {
        rating: averageRating,
        reviewCount: allRatings.length,
      },
    });

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error posting rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
