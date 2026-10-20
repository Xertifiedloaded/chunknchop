
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isContentType, type ContentTypeKey } from "@/lib/cms/config";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const types = (sp.get("type") ?? "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(isContentType) as ContentTypeKey[];

  if (types.length === 0) {
    return NextResponse.json({ error: "Provide ?type=" }, { status: 400 });
  }

  const slug = sp.get("slug");

  try {
    const rows = await prisma.contentEntry.findMany({
      where: { type: { in: types }, status: "LIVE", ...(slug ? { slug } : {}) },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      select: { id: true, type: true, title: true, slug: true, sortOrder: true, data: true, publishedAt: true },
    });

    const now = Date.now();
    const content: Record<string, typeof rows> = Object.fromEntries(types.map((t) => [t, []]));

    for (const row of rows) {
      if (row.type === "BANNER") {
        const d = row.data as { startsAt?: string; endsAt?: string };
        if (d.startsAt && new Date(d.startsAt).getTime() > now) continue;
        if (d.endsAt && new Date(d.endsAt).getTime() < now) continue;
      }
      content[row.type].push(row);
    }

    if (slug && rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { content },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Public content failed:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}