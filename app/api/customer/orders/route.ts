import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/request";
import { paystack } from "@/lib/paystack";

class CheckoutError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;
const UNAVAILABLE_PRODUCT_NAME = "Unavailable product";

const round2 = (value: number) => Math.round(value * 100) / 100;

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      items,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
    } = body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !items.every((id) => typeof id === "string")
    ) {
      throw new CheckoutError("No items in cart");
    }

    if (
      !shippingAddress ||
      !shippingCity ||
      !shippingState ||
      !shippingZip ||
      !shippingCountry
    ) {
      throw new CheckoutError("Missing shipping details");
    }

    const cartItemIds = [...new Set<string>(items)];

    const order = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { id: { in: cartItemIds }, userId: user.id },
        include: { product: { include: { tiers: true } } },
      });

      if (cartItems.length !== cartItemIds.length) {
        throw new CheckoutError("Cart item not found");
      }

      let subtotal = 0;
      const orderItems = [];

      for (const cartItem of cartItems) {
        const { product } = cartItem;

        if (!product.isActive || product.isArchived) {
          throw new CheckoutError(`${product.name} is no longer available`);
        }

        const stockUpdate = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: cartItem.quantity } },
          data: { stock: { decrement: cartItem.quantity } },
        });

        if (stockUpdate.count === 0) {
          throw new CheckoutError(`Not enough stock for ${product.name}`);
        }

        const tierPrice = cartItem.selectedTier
          ? product.tiers.find((tier) => tier.name === cartItem.selectedTier)
              ?.price
          : undefined;
        const pricePerUnit = tierPrice ?? product.basePrice;

        subtotal += pricePerUnit * cartItem.quantity;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] ?? null,
          productSku: product.sku ?? null,
          productCategoryId: product.categoryId ?? null,
          quantity: cartItem.quantity,
          pricePerUnit,
          tier: cartItem.selectedTier,
          variants: cartItem.selectedVariants ?? undefined,
        });
      }

      subtotal = round2(subtotal);
      const tax = round2(subtotal * TAX_RATE);
      const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const total = round2(subtotal + tax + shipping);

      const createdOrder = await tx.order.create({
        data: {
          customerId: user.id,
          subtotal,
          tax,
          shipping,
          total,
          status: "PENDING",
          paymentStatus: "PENDING",
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({
        where: { id: { in: cartItemIds }, userId: user.id },
      });

      return createdOrder;
    });

    const reference = `order_${order.id}`;

    try {
      const init = await paystack.initializeTransaction({
        email: user.email,
        amount: Math.round(order.total * 100),
        currency: "NGN",
        reference,
        callback_url: `${process.env.APP_URL}/checkout/callback`,
        metadata: { orderId: order.id, userId: user.id },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paystackReference: reference },
      });

      return NextResponse.json({
        order,
        authorizationUrl: init.data.authorization_url,
        reference,
      });
    } catch (paystackError) {
      console.error("Paystack init error:", paystackError);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        }),
        ...order.items
          .filter((item) => item.productId)
          .map((item) =>
            prisma.product.updateMany({
              where: { id: item.productId as string, isArchived: false },
              data: { stock: { increment: item.quantity }, inStock: true },
            }),
          ),
      ]);

      throw new CheckoutError(
        "Failed to initialize payment. Please try again.",
        502,
      );
    }
  } catch (error) {
    console.error("Checkout error:", error);

    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true, isArchived: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        productName:
          item.productName ?? item.product?.name ?? UNAVAILABLE_PRODUCT_NAME,
        productImage: item.productImage ?? item.product?.images?.[0] ?? null,
        productUnavailable: !item.product || item.product.isArchived,
      })),
    }));

    return NextResponse.json({ orders: formatted }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/customer/orders]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", orders: [] },
      { status: 500 },
    );
  }
}
