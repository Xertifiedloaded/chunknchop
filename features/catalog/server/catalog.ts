import { LocationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils/slug";
import { isValidObjectId } from "@/features/catalog/server/products";

export const DEFAULT_CATEGORY_COLOR = "#f45d27";
export const LOCATION_TYPES: LocationType[] = Object.values(LocationType);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const isLocationType = (value: unknown): value is LocationType =>
  typeof value === "string" && (LOCATION_TYPES as string[]).includes(value);

export const normalizeColor = (value: unknown): string => {
  const color = typeof value === "string" ? value.trim() : "";
  return HEX_COLOR.test(color) ? color : DEFAULT_CATEGORY_COLOR;
};

/** Categories may be stored as "beef" or "/beef", so match both. */
export function findCategoryByName(name: string) {
  const slug = slugify(name);

  return prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        ...(slug ? [{ slug: { in: [slug, `/${slug}`] } }] : []),
      ],
    },
  });
}

export function findLocationByName(name: string) {
  return prisma.storageLocation.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
}

type Failure = { error: string };

export type CategoryResolution =
  | Failure
  | {
      error?: undefined;
      existing: NonNullable<Awaited<ReturnType<typeof findCategoryByName>>>;
      create?: undefined;
    }
  | {
      error?: undefined;
      existing?: undefined;
      create: { name: string; slug: string; color: string };
    };

export type LocationResolution =
  | Failure
  | {
      error?: undefined;
      existing: NonNullable<Awaited<ReturnType<typeof findLocationByName>>>;
      create?: undefined;
    }
  | {
      error?: undefined;
      existing?: undefined;
      create: { name: string; type: LocationType };
    };

/**
 * Either picks an existing category (by id), reuses one that matches the typed
 * name, or returns the data needed to create it inside the caller's transaction.
 */
export async function resolveCategory(input: {
  id: string;
  newName: string;
  newColor: string;
}): Promise<CategoryResolution> {
  if (input.id) {
    if (!isValidObjectId(input.id))
      return { error: "Selected category is invalid" };

    const existing = await prisma.category.findUnique({
      where: { id: input.id },
    });
    if (!existing) return { error: "Selected category does not exist" };
    if (!existing.isActive)
      return { error: "Selected category is not visible" };

    return { existing };
  }

  if (!input.newName) return { error: "A category is required" };

  const slug = slugify(input.newName);
  if (!slug)
    return { error: "Could not derive a valid slug from the category name" };

  const existing = await findCategoryByName(input.newName);
  if (existing) {
    if (!existing.isActive)
      return { error: `Category "${existing.name}" exists but is hidden` };
    return { existing };
  }

  return {
    create: {
      name: input.newName,
      slug,
      color: normalizeColor(input.newColor),
    },
  };
}

/**
 * Same idea for storage locations: pick by id, reuse a name match, or return
 * the data needed to create one.
 */
export async function resolveLocation(input: {
  id: string;
  newName: string;
  newType: string;
}): Promise<LocationResolution> {
  if (input.id) {
    if (!isValidObjectId(input.id))
      return { error: "A storage location is required to stock this product" };

    const existing = await prisma.storageLocation.findUnique({
      where: { id: input.id },
    });
    if (!existing || !existing.isActive)
      return { error: "Selected storage location is invalid or inactive" };

    return { existing };
  }

  if (!input.newName)
    return { error: "A storage location is required to stock this product" };

  const existing = await findLocationByName(input.newName);
  if (existing) {
    if (!existing.isActive)
      return { error: `Location "${existing.name}" exists but is inactive` };
    return { existing };
  }

  if (!isLocationType(input.newType)) {
    return {
      error: `Location type must be one of: ${LOCATION_TYPES.join(", ")}`,
    };
  }

  return { create: { name: input.newName, type: input.newType } };
}
