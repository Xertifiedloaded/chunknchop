"use client";

import { memo, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useShopActions } from "@/lib/hooks/useShopActions";

const formatPrice = (price: number | string) =>
  typeof price === "number" ? `₦${price.toLocaleString("en-NG")}` : price;

function BestSellerCard({
  product,
  isWishlisted,
}: {
  product: any;
  isWishlisted: boolean;
}) {
  const { addToCart, setWishlisted } = useShopActions();
  const [saved, setSaved] = useState(isWishlisted);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setSaved(isWishlisted), [isWishlisted]);

  async function handleAdd() {
    if (isAdding) return;
    setIsAdding(true);
    await addToCart(product);
    setIsAdding(false);
  }

  async function handleWishlist() {
    if (isSaving) return;
    const next = !saved;
    setSaved(next);
    setIsSaving(true);
    const ok = await setWishlisted(product.id, next);
    if (!ok) setSaved(!next);
    setIsSaving(false);
  }

  return (
    <article className="bg-white">
      <div
        className="relative h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${product.images?.[0]})` }}
      >
        <button
          type="button"
          onClick={handleWishlist}
          disabled={isSaving}
          aria-label={saved ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={saved}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105 disabled:opacity-60"
        >
          <Heart
            size={16}
            className={saved ? "fill-brand text-brand" : "text-[#665950]"}
          />
        </button>
      </div>

      <div className="p-3">
        <span className="text-xs font-black tracking-[1px] text-brand">
          {product.category}
        </span>
        <h3 className="mt-1 font-impact text-[15px] capitalize">
          {product.name}
        </h3>

        <p className="mt-1 line-clamp-2 min-h-8.5 text-xs leading-relaxed text-[#75675e]">
          {product.description}
        </p>

        <strong className="mt-2 block font-impact text-[16px]">
          {formatPrice(product.basePrice)}
        </strong>

        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={!product.inStock}
          className="mt-3 w-full bg-brand py-3 text-xs font-black text-white transition hover:bg-[#a91f1b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {product.inStock ? "ADD TO CART" : "SOLD OUT"}
        </button>
      </div>
    </article>
  );
}

export default memo(BestSellerCard);
