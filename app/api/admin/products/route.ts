import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { uploadProductImage } from "@/lib/storage";
import { toMeatType } from "@/lib/utils/meat-type";
import { resolveCategory, resolveLocation } from "@/features/catalog/server/catalog";

const MAX_IMAGES = 8;


const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const flag = (formData: FormData, key: string) => formData.get(key) === "true";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

const badRequest = (error: string) => json({ error }, 400);

const isNonNegativeInt = (value: number) => Number.isInteger(value) && value >= 0;

const parseStringArray = (value: FormDataEntryValue | null): string[] => {
  const parsed = JSON.parse(String(value ?? "[]"));
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed.map((v) => String(v).trim()).filter(Boolean))];
};

const generateSku = (meatType: string) => {
  const prefix = meatType.replace(/_/g, "").slice(0, 3).padEnd(3, "X");
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${time}-${rand}`;
};

const duplicateMessage = (error: { meta?: { target?: unknown } }) => {
  const target = String(error.meta?.target ?? "").toLowerCase();

  if (target.includes("sku")) return "This SKU is already used by another product";
  if (target.includes("category") && target.includes("slug")) return "A category with a similar name already exists";
  if (target.includes("category")) return "A category with this name already exists";
  if (target.includes("storagelocation") || target.includes("location")) {
    return "A storage location with this name already exists";
  }
  if (target.includes("inventoryrecord")) return "This product already has stock in that location";
  return "A record with these details already exists";
};

const requireAdmin = (request: NextRequest) => {
  const user = getUserFromRequest(request);
  return user && user.role === "ADMIN" ? user : null;
};


export async function GET(request: NextRequest) {
  try {
    if (!requireAdmin(request)) return json({ error: "Unauthorized" }, 401);

    const { searchParams } = request.nextUrl;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const products = await prisma.product.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        meatType: true,
        images: true,
        basePrice: true,
        stock: true,
        inStock: true,
        rating: true,
        reviewCount: true,
        isNewArrival: true,
        isBestSeller: true,
        isActive: true,
        isArchived: true,
        category: true,
        categoryId: true,
        createdAt: true,
        categoryRef: { select: { id: true, name: true } },
        inventoryRecords: {
          select: {
            id: true,
            onHand: true,
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    return json(products);
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return json({ error: "Failed to fetch products" }, 500);
  }
}


export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const formData = await request.formData();


    const name = text(formData, "name");
    if (!name) return badRequest("Name is required");

    const basePrice = Number(formData.get("basePrice"));
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return badRequest("Base price must be a valid non-negative number");
    }

    const stock = Number(formData.get("stock"));
    if (!isNonNegativeInt(stock)) {
      return badRequest("Stock must be a valid non-negative whole number");
    }

    const reorderPoint = text(formData, "reorderPoint") === "" ? 0 : Number(formData.get("reorderPoint"));
    if (!isNonNegativeInt(reorderPoint)) {
      return badRequest("Reorder point must be a valid non-negative whole number");
    }

    const unit = text(formData, "unit") || "kg";

    let tags: string[];
    let preparations: string[];
    let existingImages: string[];
    try {
      tags = parseStringArray(formData.get("tags"));
      preparations = parseStringArray(formData.get("preparations"));
      existingImages = parseStringArray(formData.get("existingImages"));
    } catch {
      return badRequest("Malformed tags, preparations, or images data");
    }

    const imageFiles = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (existingImages.length + imageFiles.length > MAX_IMAGES) {
      return badRequest(`A product can have at most ${MAX_IMAGES} images`);
    }


    const [category, location] = await Promise.all([
      resolveCategory({
        id: text(formData, "categoryId"),
        newName: text(formData, "newCategoryName"),
        newColor: text(formData, "newCategoryColor"),
      }),
      resolveLocation({
        id: text(formData, "locationId"),
        newName: text(formData, "newLocationName"),
        newType: text(formData, "newLocationType"),
      }),
    ]);

    if (category.error) return badRequest(category.error);
    if (location.error) return badRequest(location.error);

    const categoryName = category.existing?.name ?? category.create?.name ?? "";
    if (!categoryName) return badRequest("Category is required");

    const meatType = toMeatType(categoryName);
    if (!meatType) return badRequest("Category name is invalid");


    let uploadedUrls: string[];
    try {
      uploadedUrls = await Promise.all(imageFiles.map((file) => uploadProductImage(file)));
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "Image upload failed");
    }


    const result = await prisma.$transaction(async (tx) => {
      const [resolvedCategory, resolvedLocation] = await Promise.all([
        category.existing ?? tx.category.create({ data: category.create! }),
        location.existing ?? tx.storageLocation.create({ data: location.create! }),
      ]);

      const product = await tx.product.create({
        data: {
          name,
          description: text(formData, "description"),
          meatType,
          sku: text(formData, "sku").toUpperCase() || generateSku(meatType),
          category: resolvedCategory.name,
          categoryId: resolvedCategory.id,
          basePrice,
          stock,
          inStock: stock > 0,
          unit,
          reorderPoint,
          tags,
          preparations,
          isNewArrival: flag(formData, "isNewArrival"),
          isBestSeller: flag(formData, "isBestSeller"),
          sameDayDelivery: flag(formData, "sameDayDelivery"),
          supplierId: user.id,
          images: [...existingImages, ...uploadedUrls],
        },
      });

      const record = await tx.inventoryRecord.create({
        data: {
          productId: product.id,
          locationId: resolvedLocation.id,
          onHand: stock,
          reorderPoint,
        },
      });

      if (stock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            productName: product.name,
            previousStock: 0,
            newStock: stock,
            changeReason: "RESTOCK",
            notes: "Initial stock on product creation",
            inventoryRecordId: record.id,
            performedById: user.id,
          },
        });
      }

      return {
        product,
        categoryCreated: !category.existing,
        locationCreated: !location.existing,
      };
    });

    return json(
      {
        ...result.product,
        categoryCreated: result.categoryCreated,
        locationCreated: result.locationCreated,
      },
      201,
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      console.error("Unique constraint failed:", (error as { meta?: unknown }).meta);
      return json({ error: duplicateMessage(error as { meta?: { target?: unknown } }) }, 409);
    }

    console.error("Error creating product:", error);
    return json({ error: "Internal server error" }, 500);
  }
}