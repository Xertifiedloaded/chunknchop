import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { pusher } from "@/lib/realtime/pusher";

export async function POST(req: NextRequest) {
  try {
    const current = getUserFromRequest(req);
    if (!current || current.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds } = body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "orderIds required" }, { status: 400 });
    }

    const staff = await prisma.user.findMany({
      where: { role: "STAFF" },
      select: { id: true, email: true, name: true },
    });

    const updated = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "PROCESSING" },
    });

    const payload = {
      orderIds,
      timestamp: new Date().toISOString(),
      adminId: current.id,
    };

    if (staff.length > 0) {
      await pusher.trigger("private-staff-assignments", "orders-assigned", {
        ...payload,
        staff,
      });
      return NextResponse.json({
        success: true,
        assignedToStaff: true,
        staffCount: staff.length,
      });
    } else {
      await pusher.trigger("private-packing", "packing-required", payload);
      return NextResponse.json({ success: true, assignedToPacking: true });
    }
  } catch (error) {
    console.error("Auto-assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
