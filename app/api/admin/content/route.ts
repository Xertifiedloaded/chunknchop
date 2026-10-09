
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { CONTENT_CONFIG, CONTENT_STATUSES, SECTION_KEYS, isContentType, slugify, validateData } from "@/lib/cms/config";
import { uniqueSlug } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  if (type && !isContentType(type)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  try {
    const [items, grouped] = await Promise.all([
      type
        ? prisma.contentEntry.findMany({
            where: { type },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          })
        : Promise.resolve([]),
      prisma.contentEntry.groupBy({ by: ["type"], _count: { _all: true } }),
    ]);

    const counts: Record<string, number> = Object.fromEntries(grouped.map((g) => [g.type, g._count._all]));
    counts.CATEGORY = await prisma.category.count();
    return NextResponse.json({ items, counts });
  } catch (error) {
    console.error("CMS list failed:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !isContentType(body.type)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const type = body.type;
  const cfg = CONTENT_CONFIG[type];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const status = CONTENT_STATUSES.includes(body.status) ? body.status : "DRAFT";
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder : 0;

  const { data, errors } = validateData(type, body.data);
  if (!title) errors.title = `${cfg.titleLabel} is required`;

  let sectionKey = "";
  if (type === "SECTION") {
    sectionKey = slugify(String(body.slug ?? ""));
    if (!(SECTION_KEYS as readonly string[]).includes(sectionKey)) {
      errors.slug = `Slug must be one of: ${SECTION_KEYS.join(", ")}`;
    } else if (await prisma.contentEntry.findFirst({ where: { type, slug: sectionKey }, select: { id: true } })) {
      errors.slug = "This section already exists. Edit it instead.";
    }
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Validation failed", fieldErrors: errors }, { status: 422 });
  }

  try {
    const slug = type === "SECTION" ? sectionKey : cfg.slugged ? await uniqueSlug(type, slugify(body.slug || title)) : null;

    const entry = await prisma.contentEntry.create({
      data: { type, title, slug, status, sortOrder, data: data as object, publishedAt: status === "LIVE" ? new Date() : null },
    });

    revalidatePath("/");
    return NextResponse.json({ item: entry }, { status: 201 });
  } catch (error) {
    console.error("CMS create failed:", error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}