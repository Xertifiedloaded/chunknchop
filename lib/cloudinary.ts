import { createHash, randomUUID } from 'node:crypto';

const PRODUCT_FOLDER = 'field-fable/products';
const RIDER_FOLDER = 'field-fable/riders';

export class CloudinaryConfigurationError extends Error {
  constructor() {
    super(
      'Cloudinary is not configured. Add the Cloudinary project credentials to enable image uploads.',
    );
    this.name = 'CloudinaryConfigurationError';
  }
}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new CloudinaryConfigurationError();
  return { cloudName, apiKey, apiSecret };
}

function createSignature(values: Record<string, string>, secret: string) {
  const payload = Object.entries(values)
    .filter(([, value]) => value !== '')
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${payload}${secret}`).digest('hex');
}

async function uploadCloudinaryImage(file: File, contentType: string, folder: string) {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = randomUUID();
  const values = { folder, public_id: publicId, timestamp };
  const form = new FormData();
  form.set(
    'file',
    new Blob([await file.arrayBuffer()], { type: contentType }),
    file.name || 'image',
  );
  form.set('api_key', config.apiKey);
  form.set('folder', folder);
  form.set('public_id', publicId);
  form.set('timestamp', timestamp);
  form.set('signature', createSignature(values, config.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
    {
      method: 'POST',
      body: form,
      cache: 'no-store',
    },
  );
  const result = (await response.json().catch(() => null)) as { secure_url?: unknown } | null;
  if (!response.ok || typeof result?.secure_url !== 'string') {
    throw new Error(
      'Cloudinary could not store this image. Check the Cloudinary project configuration and try again.',
    );
  }
  return result.secure_url;
}

export function uploadCloudinaryProductImage(file: File, contentType: string) {
  return uploadCloudinaryImage(file, contentType, PRODUCT_FOLDER);
}

export function uploadCloudinaryRiderImage(file: File, contentType: string) {
  return uploadCloudinaryImage(file, contentType, RIDER_FOLDER);
}

function getCloudinaryPublicId(imageUrl: string, cloudName: string) {
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== 'res.cloudinary.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== 'image' || parts[2] !== 'upload') return null;
    const versionIndex = parts[3]?.match(/^v\d+$/) ? 4 : 3;
    const assetPath = parts.slice(versionIndex).join('/');
    if (!assetPath.startsWith(`${PRODUCT_FOLDER}/`)) return null;
    return decodeURIComponent(assetPath.replace(/\.[a-z\d]+$/i, ''));
  } catch {
    return null;
  }
}

export async function deleteCloudinaryProductImage(imageUrl: string) {
  const config = getCloudinaryConfig();
  const publicId = getCloudinaryPublicId(imageUrl, config.cloudName);
  if (!publicId) return;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const values = { public_id: publicId, timestamp };
  const form = new FormData();
  form.set('public_id', publicId);
  form.set('timestamp', timestamp);
  form.set('api_key', config.apiKey);
  form.set('signature', createSignature(values, config.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`,
    {
      method: 'POST',
      body: form,
      cache: 'no-store',
    },
  );
  if (!response.ok) throw new Error('Cloudinary could not delete this image');
}
