
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { slugify, validateData } from "@/lib/cms/config";
import { categoryToEntry } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

const refresh = () => ["/", "/shop", "/categories"].forEach((p) => revalidatePath(p));

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.category.findMany();
    rows.sort((a: any, b: any) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.createdAt.getTime() - b.createdAt.getTime());
    return NextResponse.json({ items: rows.map(categoryToEntry) });
  } catch (error) {
    console.error("Category list failed:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = typeof body.title === "string" ? body.title.trim() : "";
  const { data, errors } = validateData("CATEGORY", body.data);
  const slug = slugify(String(body.slug || name));

  if (!name) errors.title = "Category name is required";
  if (!slug) errors.slug = "Slug is required";

  try {
    if (name && (await prisma.category.findFirst({ where: { name }, select: { id: true } }))) errors.title = "A category with this name already exists";
    if (slug && (await prisma.category.findUnique({ where: { slug }, select: { id: true } }))) errors.slug = "This slug is already used";

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: "Validation failed", fieldErrors: errors }, { status: 422 });
    }

    const created = await prisma.category.create({
      data: {
        name,
        slug,
        description: (data.description as string) || null,
        image: (data.image as string) || null,
        isActive: body.status === "LIVE",
        sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
      } as any,
    });

    refresh();
    return NextResponse.json({ item: categoryToEntry(created as any) }, { status: 201 });
  } catch (error) {
    console.error("Category create failed:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}