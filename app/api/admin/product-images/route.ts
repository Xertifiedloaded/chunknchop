import { NextResponse } from 'next/server';
import { hasSameOrigin, requireAdminApi } from '@/lib/admin-api';
import {
  CloudinaryConfigurationError,
  deleteCloudinaryProductImage,
  uploadCloudinaryProductImage,
} from '@/lib/cloudinary';
import { deleteMongoDocument } from '@/lib/mongo-collections';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_PATH = /^\/api\/product-images\/([a-f\d-]{36})$/i;

type ImageFormat = { contentType: 'image/jpeg' | 'image/png' | 'image/webp' };

function detectImageFormat(bytes: Buffer): ImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg' };
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { contentType: 'image/png' };
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { contentType: 'image/webp' };
  }
  return null;
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const access = await requireAdminApi();
  if (access.response) return access.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Choose an image to upload' }, { status: 400 });
  }
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Images must be 2 MB or smaller' }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const format = detectImageFormat(bytes);
  if (!format)
    return NextResponse.json({ error: 'Upload a valid JPEG, PNG, or WebP image' }, { status: 415 });

  try {
    const url = await uploadCloudinaryProductImage(file, format.contentType);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof CloudinaryConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to upload this image' },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const access = await requireAdminApi();
  if (access.response) return access.response;

  const url = new URL(request.url).searchParams.get('url') ?? '';
  const id = IMAGE_PATH.exec(url)?.[1];
  if (id) {
    await deleteMongoDocument('ProductImage', id);
    return new NextResponse(null, { status: 204 });
  }

  if (!url.includes('res.cloudinary.com'))
    return NextResponse.json({ error: 'Uploaded image not found' }, { status: 404 });
  try {
    await deleteCloudinaryProductImage(url);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CloudinaryConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Unable to remove this Cloudinary image' }, { status: 502 });
  }
}
