import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils/slug";
import { findCategoryByName, normalizeColor } from "@/features/catalog/server/catalog";

const cleanSlug = (slug: string) => slug.replace(/^\//, "");

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    const categories = await prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        color: true,
        isActive: true,
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });

    return NextResponse.json(
      categories.map(({ _count, slug, ...category }) => ({
        ...category,
        slug: cleanSlug(slug),
        productCount: _count.products,
      })),
    );
  } catch (error) {
    console.error("Error fetching admin categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const image = typeof body?.image === "string" ? body.image.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    if (!slug) {
      return NextResponse.json(
        { error: "Could not derive a valid slug from the category name" },
        { status: 400 },
      );
    }

    const existing = await findCategoryByName(name);

    if (existing) {
      return NextResponse.json(
        {
          error: "A category with this name already exists",
          category: { id: existing.id, name: existing.name },
        },
        { status: 409 },
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        color: normalizeColor(body?.color),
        ...(image ? { image } : {}),
      },
    });

    return NextResponse.json(
      { ...category, slug: cleanSlug(category.slug), productCount: 0 },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 },
      );
    }

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
