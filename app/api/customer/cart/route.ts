import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/http/request";

const cartItemInclude = {
  product: {
    include: {
      tiers: true,
      variants: true,
      supplier: {
        select: {
          id: true,
          supplierProfile: {
            select: {
              storeName: true,
            },
          },
        },
      },
    },
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: cartItemInclude,
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ cartItems }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[cart GET] Failed:", error);

    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const productId: string | undefined = body?.productId;
    const quantity = Number(body?.quantity);
    const selectedTier: string | null = body?.selectedTier || null;
    const selectedPreparation: string | null = body?.selectedPreparation || null;
    const selectedVariants = Array.isArray(body?.selectedVariants) ? body.selectedVariants : [];

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const [product, existing] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true },
      }),
      prisma.cartItem.findUnique({
        where: { userId_productId: { userId: user.id, productId } },
        select: { quantity: true },
      }),
    ]);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (nextQuantity > product.stock) {
      return NextResponse.json({ error: `Only ${product.stock} items available` }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: {
        userId: user.id,
        productId,
        quantity,
        selectedTier,
        selectedPreparation,
        selectedVariants,
      },
      update: {
        quantity: nextQuantity,
        selectedTier,
        selectedPreparation,
        selectedVariants,
      },
      include: cartItemInclude,
    });

    return NextResponse.json(cartItem, { status: 200 });
  } catch (error) {
    console.error("[cart POST] Failed:", error);

    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
