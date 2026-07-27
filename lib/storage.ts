import { createClient } from '@supabase/supabase-js';

const STORAGE_BUCKET = 'product-images';
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" isn't an image file.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is over the 20MB limit.`);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Could not upload "${file.name}": ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
