import { NextRequest, NextResponse } from "next/server";
import { MeatType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/request";
import { uploadProductImage } from "@/lib/storage";
import { resolveCategory, resolveLocation } from "@/lib/catalog";
import { ACTIVE_PRODUCT_FILTER, isValidObjectId } from "@/lib/products";

type RouteContext = { params: Promise<{ id: string }> };

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const parseJsonArray = (value: FormDataEntryValue | null): string[] => {
  const parsed = JSON.parse(String(value ?? "[]"));
  return Array.isArray(parsed) ? parsed.map(String) : [];
};

const isNonNegativeInt = (value: number) =>
  Number.isInteger(value) && value >= 0;

const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

const toMeatType = (name: string): MeatType | null => {
  const key = name
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return key in MeatType ? MeatType[key as keyof typeof MeatType] : null;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id, ...ACTIVE_PRODUCT_FILTER },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        basePrice: true,
        stock: true,
        unit: true,
        reorderPoint: true,
        inStock: true,
        category: true,
        categoryId: true,
        categoryRef: {
          select: { id: true, name: true, slug: true, color: true },
        },
        meatType: true,
        tags: true,
        preparations: true,
        isNewArrival: true,
        isBestSeller: true,
        sameDayDelivery: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        tiers: true,
        variants: true,
        inventoryRecords: {
          select: {
            id: true,
            onHand: true,
            reorderPoint: true,
            location: { select: { id: true, name: true } },
          },
        },
        supplier: {
          select: { id: true, name: true, supplierProfile: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const current = await prisma.product.findFirst({
      where: { id, isArchived: false },
      select: {
        id: true,
        name: true,
        stock: true,
        reorderPoint: true,
        images: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const data: Prisma.ProductUncheckedUpdateInput = {};

    if (formData.has("name")) {
      const name = text(formData, "name");
      if (!name) return badRequest("Name cannot be empty");
      data.name = name;
    }

    if (formData.has("description"))
      data.description = text(formData, "description");
    if (formData.has("unit")) data.unit = text(formData, "unit") || "kg";

    if (formData.has("basePrice")) {
      const basePrice = Number(formData.get("basePrice"));
      if (!Number.isFinite(basePrice) || basePrice < 0) {
        return badRequest("Base price must be a valid non-negative number");
      }
      data.basePrice = basePrice;
    }

    let nextStock = current.stock;
    if (formData.has("stock")) {
      const stock = Number(formData.get("stock"));
      if (!isNonNegativeInt(stock))
        return badRequest("Stock must be a valid non-negative whole number");
      nextStock = stock;
      data.stock = stock;
      data.inStock = stock > 0;
    }

    let nextReorderPoint = current.reorderPoint ?? 0;
    if (formData.has("reorderPoint")) {
      const reorderPoint =
        text(formData, "reorderPoint") === ""
          ? 0
          : Number(formData.get("reorderPoint"));
      if (!isNonNegativeInt(reorderPoint))
        return badRequest(
          "Reorder point must be a valid non-negative whole number",
        );
      nextReorderPoint = reorderPoint;
      data.reorderPoint = reorderPoint;
    }

    for (const flag of [
      "isNewArrival",
      "isBestSeller",
      "sameDayDelivery",
    ] as const) {
      if (formData.has(flag)) data[flag] = formData.get(flag) === "true";
    }

    let existingImages: string[] | null = null;

    try {
      if (formData.has("tags"))
        data.tags = parseJsonArray(formData.get("tags"));
      if (formData.has("preparations"))
        data.preparations = parseJsonArray(formData.get("preparations"));
      if (formData.has("existingImages"))
        existingImages = parseJsonArray(formData.get("existingImages"));
    } catch {
      return badRequest("Malformed tags, preparations, or images data");
    }

    const categoryInput = {
      id: text(formData, "categoryId"),
      newName: text(formData, "newCategoryName"),
      newColor: text(formData, "newCategoryColor"),
    };
    const wantsCategory = Boolean(categoryInput.id || categoryInput.newName);

    let category: Awaited<ReturnType<typeof resolveCategory>> | null = null;
    let meatType: MeatType | null = null;

    if (wantsCategory) {
      category = await resolveCategory(categoryInput);
      if (category.error) return badRequest(category.error);

      const categoryName =
        category.existing?.name ?? category.create?.name ?? "";
      meatType = toMeatType(categoryName);
      if (!meatType) {
        return badRequest(
          `Category "${categoryName}" does not map to a supported meat type`,
        );
      }
    }

    const locationInput = {
      id: text(formData, "locationId"),
      newName: text(formData, "newLocationName"),
      newType: text(formData, "newLocationType"),
    };
    const wantsLocation = Boolean(locationInput.id || locationInput.newName);

    let location: Awaited<ReturnType<typeof resolveLocation>> | null = null;

    if (wantsLocation) {
      location = await resolveLocation(locationInput);
      if (location.error) return badRequest(location.error);
    }

    const imageFiles = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File);

    if (existingImages !== null || imageFiles.length > 0) {
      let uploadedUrls: string[];

      try {
        uploadedUrls = await Promise.all(
          imageFiles.map((file) => uploadProductImage(file)),
        );
      } catch (error) {
        return badRequest(
          error instanceof Error ? error.message : "Image upload failed",
        );
      }

      data.images = [...(existingImages ?? current.images), ...uploadedUrls];
    }

    const result = await prisma.$transaction(async (tx) => {
      let categoryCreated = false;
      let locationCreated = false;

      if (category && meatType) {
        const resolvedCategory =
          category.existing ??
          (await tx.category.create({ data: category.create }));
        categoryCreated = !category.existing;

        data.categoryId = resolvedCategory.id;
        data.category = resolvedCategory.name;
        data.meatType = meatType;
      }

      let resolvedLocationId: string | null = null;
      if (location) {
        const resolvedLocation =
          location.existing ??
          (await tx.storageLocation.create({ data: location.create }));
        locationCreated = !location.existing;
        resolvedLocationId = resolvedLocation.id;
      }

      const product = await tx.product.update({ where: { id }, data });

      const inventoryChanged =
        formData.has("stock") ||
        formData.has("reorderPoint") ||
        resolvedLocationId !== null;

      if (inventoryChanged) {
        const record = await tx.inventoryRecord.findFirst({
          where: { productId: id },
        });
        const targetLocationId =
          resolvedLocationId ?? record?.locationId ?? null;

        let recordId: string | null = null;
        let previousOnHand = record?.onHand ?? 0;

        if (record) {
          await tx.inventoryRecord.update({
            where: { id: record.id },
            data: {
              onHand: nextStock,
              reorderPoint: nextReorderPoint,
              locationId: targetLocationId ?? record.locationId,
            },
          });
          recordId = record.id;
        } else if (targetLocationId) {
          const created = await tx.inventoryRecord.create({
            data: {
              productId: id,
              locationId: targetLocationId,
              onHand: nextStock,
              reorderPoint: nextReorderPoint,
            },
          });
          recordId = created.id;
          previousOnHand = 0;
        }

        if (recordId && previousOnHand !== nextStock) {
          await tx.inventoryLog.create({
            data: {
              productId: id,
              productName: product.name,
              previousStock: previousOnHand,
              newStock: nextStock,
              // NOTE: confirm this value exists in your changeReason enum.
              changeReason:
                nextStock > previousOnHand ? "RESTOCK" : "ADJUSTMENT",
              notes: "Stock updated via product edit",
              inventoryRecordId: recordId,
              performedById: user.id,
            },
          });
        }
      }

      return { product, categoryCreated, locationCreated };
    });

    return NextResponse.json({
      ...result.product,
      categoryCreated: result.categoryCreated,
      locationCreated: result.locationCreated,
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A category, location or product with these details already exists",
        },
        { status: 409 },
      );
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, isArchived: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.isArchived) {
      return NextResponse.json({
        success: true,
        mode: "archived",
        message: `"${product.name}" is already deleted.`,
      });
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          isArchived: true,
          inStock: false,
          stock: 0,
          sku: null,
          deletedAt: new Date(),
        },
      }),

      prisma.inventoryRecord.updateMany({
        where: { productId: id },
        data: { onHand: 0 },
      }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      mode: "archived",
      message: `"${product.name}" was deleted. Existing order history is preserved.`,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
