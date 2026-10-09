import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { validateData } from "@/lib/cms/config";
import { categoryToEntry, isObjectId } from "@/lib/cms/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const refresh = () => ["/", "/shop", "/categories"].forEach((p) => revalidatePath(p));

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const update: Record<string, unknown> = {};
    const fieldErrors: Record<string, string> = {};

    if (body.title !== undefined) {
      const name = typeof body.title === "string" ? body.title.trim() : "";
      if (!name) fieldErrors.title = "Category name is required";
      else if (name !== existing.name && (await prisma.category.findFirst({ where: { name, NOT: { id } }, select: { id: true } }))) {
        fieldErrors.title = "A category with this name already exists";
      } else update.name = name;
    }

    if (body.status !== undefined) {
      if (body.status !== "LIVE" && body.status !== "DRAFT") fieldErrors.status = "Invalid status";
      else update.isActive = body.status === "LIVE";
    }

    if (body.sortOrder !== undefined) {
      if (!Number.isInteger(body.sortOrder)) fieldErrors.sortOrder = "Must be a whole number";
      else update.sortOrder = body.sortOrder;
    }

    if (body.data !== undefined) {
      const merged = { description: existing.description ?? "", image: existing.image ?? "", ...body.data };
      const res = validateData("CATEGORY", merged);
      if (!res.ok) Object.assign(fieldErrors, res.errors);
      else {
        update.description = (res.data.description as string) || null;
        update.image = (res.data.image as string) || null;
      }
    }

    if (Object.keys(fieldErrors).length) {
      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 422 });
    }

    const item = await prisma.category.update({ where: { id }, data: update as any });
    refresh();
    return NextResponse.json({ item: categoryToEntry(item as any) });
  } catch (error) {
    console.error("Category update failed:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const inUse = await prisma.product.count({ where: { categoryId: id } });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `${inUse} product${inUse === 1 ? "" : "s"} still use this category. Unpublish it (set to Draft) instead of deleting.` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });
    refresh();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Category delete failed:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}