import { prisma } from "@/lib/db";
import type { Category, ContentType } from "@prisma/client";

export const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export async function uniqueSlug(type: ContentType, base: string, excludeId?: string) {
  const root = base || "untitled";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await prisma.contentEntry.findFirst({
      where: { type, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${root}-${++n}`;
  }
  return slug;
}

export function categoryToEntry(c: Category & { sortOrder?: number | null }) {
  return {
    id: c.id,
    type: "CATEGORY" as const,
    title: c.name,
    slug: c.slug,
    status: c.isActive ? ("LIVE" as const) : ("DRAFT" as const),
    sortOrder: c.sortOrder ?? 0,
    data: { description: c.description ?? "", image: c.image ?? "" },
    views: 0,
    updatedAt: c.updatedAt,
  };
}