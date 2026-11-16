import { NextResponse } from 'next/server';
import { findMongoDocument } from '@/lib/mongo-collections';

type StoredImage = { data?: unknown; contentType?: unknown };
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^[a-f\d-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });

  const image = await findMongoDocument<StoredImage>('ProductImage', id);
  if (
    typeof image?.data !== 'string' ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(String(image.contentType))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = image.contentType as 'image/jpeg' | 'image/png' | 'image/webp';
  return new NextResponse(Buffer.from(image.data, 'base64'), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
