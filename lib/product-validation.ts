import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ZodError } from 'zod';
import { productCategories } from '@/lib/catalog';

const MAX_PRICE_KOBO = 1_000_000_000;

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

const imageUrl = z
  .string()
  .trim()
  .min(1, 'Upload an image first')
  .max(4096)
  .refine((value) => {
    if (/^\/api\/product-images\/[a-f\d-]{36}$/i.test(value)) return true;
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use an uploaded image or a secure HTTPS image URL');

// "" / undefined -> null
const badge = z.preprocess(
  (v) => (v === undefined || (typeof v === 'string' && v.trim() === '') ? null : v),
  z.string().trim().max(40).nullable(),
);

const shape = {
  slug,
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  cut: z.string().trim().min(1).max(120),
  priceCents: z.coerce.number().int().min(1).max(MAX_PRICE_KOBO), // kobo
  unit: z.string().trim().min(1).max(40),
  imageUrl,
  badge,
  category: z.enum(productCategories),
  published: z.boolean(),
};

export const productInputSchema = z
  .object({ ...shape, published: z.boolean().default(false) })
  .strict();

export const productPatchSchema = z.object(shape).partial().strict();

export function validationErrorResponse(error: ZodError) {
  const { fieldErrors, formErrors } = error.flatten();
  console.error('Product validation failed:', JSON.stringify({ fieldErrors, formErrors }, null, 2));
  return NextResponse.json(
    {
      error: 'Check the product fields and try again',
      ...(process.env.NODE_ENV !== 'production' && { details: { fieldErrors, formErrors } }),
    },
    { status: 400 },
  );
}