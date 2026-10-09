import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { LOCATION_TYPES, findLocationByName, isLocationType } from "@/features/catalog/server/catalog";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

    const locations = await prisma.storageLocation.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, isActive: true },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!isLocationType(body?.type)) {
      return NextResponse.json({ error: `type must be one of: ${LOCATION_TYPES.join(", ")}` }, { status: 400 });
    }

    const existing = await findLocationByName(name);

    if (existing) {
      return NextResponse.json(
        {
          error: "A location with this name already exists",
          location: { id: existing.id, name: existing.name },
        },
        { status: 409 },
      );
    }

    const location = await prisma.storageLocation.create({
      data: { name, type: body.type },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A location with this name already exists" }, { status: 409 });
    }

    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
