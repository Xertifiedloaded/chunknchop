import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { CloudinaryConfigurationError, uploadCloudinaryRiderImage } from '@/lib/cloudinary';

const MAX_BYTES = 5 * 1024 * 1024;

function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'image/webp';
  return null;
}

export async function POST(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File))
    return NextResponse.json({ error: 'Choose an image to upload' }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Image must be smaller than 5 MB' }, { status: 400 });

  const type = sniff(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!type)
    return NextResponse.json(
      { error: 'Only JPG, PNG or WebP images are allowed' },
      { status: 400 },
    );

  try {
    const url = await uploadCloudinaryRiderImage(file, type);
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    const status = e instanceof CloudinaryConfigurationError ? 503 : 502;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status },
    );
  }
}
