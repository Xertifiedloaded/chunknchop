import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();


    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
