import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { deleteCloudinaryProductImage } from '@/lib/cloudinary';

type MongoCursor<T> = { cursor?: { firstBatch?: T[] } };

export async function findMongoDocument<T>(collection: string, id: string): Promise<T | null> {
  const result = await prisma.$runCommandRaw({ find: collection, filter: { _id: id }, limit: 1 });
  const documents = (result as unknown as MongoCursor<T>).cursor?.firstBatch ?? [];
  return documents[0] ?? null;
}

export async function findMongoDocuments<T>(
  collection: string,
  filter: Prisma.InputJsonObject,
  limit = 100,
  sort: Prisma.InputJsonObject = { createdAt: -1 },
): Promise<T[]> {
  const result = await prisma.$runCommandRaw({ find: collection, filter, sort, limit });
  return (result as unknown as MongoCursor<T>).cursor?.firstBatch ?? [];
}

export async function updateMongoDocument(
  collection: string,
  query: Prisma.InputJsonObject,
  update: Prisma.InputJsonObject,
) {
  return prisma.$runCommandRaw({
    update: collection,
    updates: [{ q: query, u: update, upsert: false, multi: false }],
  });
}

export async function upsertMongoDocument(
  collection: string,
  id: string,
  fields: Record<string, Prisma.InputJsonValue>,
) {
  return prisma.$runCommandRaw({
    update: collection,
    updates: [{ q: { _id: id }, u: { $set: fields }, upsert: true }],
  });
}

export async function deleteMongoDocument(collection: string, id: string) {
  return prisma.$runCommandRaw({ delete: collection, deletes: [{ q: { _id: id }, limit: 1 }] });
}

export async function deleteProductImageByUrl(imageUrl: string) {
  const id = /^\/api\/product-images\/([a-f\d-]{36})$/i.exec(imageUrl)?.[1];
  if (id) {
    await deleteMongoDocument('ProductImage', id);
    return;
  }

  if (imageUrl.includes('res.cloudinary.com')) {
    await deleteCloudinaryProductImage(imageUrl).catch(() => undefined);
  }
}
