import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ZodError } from 'zod';

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

const badge = z.preprocess(
  (v) => (v === undefined || (typeof v === 'string' && v.trim() === '') ? null : v),
  z.string().trim().max(40).nullable(),
);

const shape = {
  slug,
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  cut: z.string().trim().min(1).max(120),
  priceCents: z.coerce.number().int().min(1).max(MAX_PRICE_KOBO),
  unit: z.string().trim().min(1).max(40),
  imageUrl,
  badge,
  category: z.string().trim().min(1).max(50),
  productType: z.enum(['standard', 'meatbox']).default('standard'),
  bundleItems: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .max(30)
    .default([]),
  published: z.boolean(),
  discountPercent: z.coerce.number().int().min(0).max(100).default(0),
  discountStartsAt: z.coerce.date().nullable().optional().default(null),
  discountEndsAt: z.coerce.date().nullable().optional().default(null),
};

function validateDiscountDates(
  value: { discountStartsAt?: Date | null; discountEndsAt?: Date | null },
  ctx: z.RefinementCtx,
) {
  if (
    value.discountStartsAt &&
    value.discountEndsAt &&
    value.discountEndsAt <= value.discountStartsAt
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountEndsAt'],
      message: 'Discount end date must be after its start date',
    });
  }
}

export const productInputSchema = z
  .object({ ...shape, published: z.boolean().default(false) })
  .strict()
  .superRefine((value, ctx) => {
    validateDiscountDates(value, ctx);
    if (value.productType === 'meatbox' && !value.bundleItems?.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bundleItems'],
        message: 'Add at least one meatbox item',
      });
  });

export const productPatchSchema = z
  .object(shape)
  .partial()
  .strict()
  .superRefine(validateDiscountDates);

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
