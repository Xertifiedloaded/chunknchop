import { v2 as cloudinary } from 'cloudinary';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" isn't an image file.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is over the 20MB limit.`);
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not set in environment variables');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString('base64')}`;

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'product-images';

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  if (!result || !result.secure_url) {
    throw new Error('Image upload failed');
  }

  return result.secure_url;
}
