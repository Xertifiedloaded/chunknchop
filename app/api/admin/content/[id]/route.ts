import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { CONTENT_CONFIG, CONTENT_STATUSES, slugify, validateData } from "@/lib/cms/config";
import { isObjectId, uniqueSlug } from "@/lib/cms/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const existing = await prisma.contentEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const cfg = CONTENT_CONFIG[existing.type];
    const update: Record<string, unknown> = {};
    const fieldErrors: Record<string, string> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) fieldErrors.title = `${cfg.titleLabel} is required`;
      else update.title = title;
    }

    if (body.status !== undefined) {
      if (!CONTENT_STATUSES.includes(body.status)) fieldErrors.status = "Invalid status";
      else {
        update.status = body.status;
        if (body.status === "LIVE" && !existing.publishedAt) update.publishedAt = new Date();
      }
    }

    if (body.sortOrder !== undefined) {
      if (!Number.isInteger(body.sortOrder)) fieldErrors.sortOrder = "Must be a whole number";
      else update.sortOrder = body.sortOrder;
    }

    if (body.data !== undefined) {
      const merged = { ...(existing.data as object), ...body.data };
      const res = validateData(existing.type, merged);
      if (!res.ok) Object.assign(fieldErrors, res.errors);
      else update.data = res.data;
    }

    if (cfg.slugged && existing.type !== "SECTION" && body.slug !== undefined) {
      const base = slugify(String(body.slug));
      if (!base) fieldErrors.slug = "Slug is required";
      else update.slug = await uniqueSlug(existing.type, base, id);
    }

    if (Object.keys(fieldErrors).length) {
      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 422 });
    }

    const item = await prisma.contentEntry.update({ where: { id }, data: update });
    revalidatePath("/");
    return NextResponse.json({ item });
  } catch (error) {
    console.error("CMS update failed:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
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
    await prisma.contentEntry.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("CMS delete failed:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}