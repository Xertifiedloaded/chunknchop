import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { findMongoDocument, upsertMongoDocument } from '@/lib/mongo-collections';
import { toCatalogProduct } from '@/lib/products';

const cartInputSchema = z
  .object({
    items: z
      .array(
        z
          .object({ slug: z.string().min(2).max(80), quantity: z.number().int().min(1).max(99) })
          .strict(),
      )
      .max(50),
  })
  .strict();

type StoredCart = { items?: Array<{ slug?: unknown; quantity?: unknown }> };

async function getSignedInUser() {
  const session = await getSession(await headers());
  return session?.user ?? null;
}

async function getCartItems(userId: string) {
  const document = await findMongoDocument<StoredCart>('UserCart', userId);
  const storedItems = (document?.items ?? []).filter(
    (item): item is { slug: string; quantity: number } =>
      typeof item.slug === 'string' &&
      Number.isInteger(item.quantity) &&
      Number(item.quantity) >= 1 &&
      Number(item.quantity) <= 99,
  );
  const slugs = [...new Set(storedItems.map((item) => item.slug))];
  if (!slugs.length) return [];

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, published: true },
  });
  const productBySlug = new Map(
    products.map((product) => [product.slug, toCatalogProduct(product)]),
  );
  return storedItems.flatMap((item) => {
    const product = productBySlug.get(item.slug);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
}

export async function GET() {
  const user = await getSignedInUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in to access your saved bag' }, { status: 401 });

  const items = await getCartItems(user.id);
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const user = await getSignedInUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save your bag' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = cartInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Check the bag items and try again' }, { status: 400 });

  const slugs = parsed.data.items.map((item) => item.slug);
  if (new Set(slugs).size !== slugs.length) {
    return NextResponse.json(
      { error: 'Each product can appear only once in your bag' },
      { status: 400 },
    );
  }

  const products = slugs.length
    ? await prisma.product.findMany({ where: { slug: { in: slugs }, published: true } })
    : [];
  if (products.length !== slugs.length) {
    return NextResponse.json(
      { error: 'One or more products are no longer available' },
      { status: 409 },
    );
  }

  await upsertMongoDocument('UserCart', user.id, {
    items: parsed.data.items,
    updatedAt: new Date().toISOString(),
  });

  const productBySlug = new Map(
    products.map((product) => [product.slug, toCatalogProduct(product)]),
  );
  const items = parsed.data.items.flatMap((item) => {
    const product = productBySlug.get(item.slug);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
}
