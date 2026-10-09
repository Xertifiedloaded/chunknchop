"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Heart, Plus, Check, Star, Clock, Loader2 } from "lucide-react";

import type { Product } from "@/types";
import { formatNaira } from "@/lib/utils/format";
import { useCartStore } from "@/store/cartStore";
import { useShopActions } from "@/features/catalog/hooks/useShopActions";

function daysAgoLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function getProductBadge(product: Product) {
  if (product.isBestSeller) return { label: "Best Seller", className: "bg-brand" };
  if (product.isNewArrival) return { label: "Fresh Today", className: "bg-brand" };
  return null;
}

export default function ProductCard({ product, isWishlisted = false }: { product: Product; isWishlisted?: boolean }) {
  const [saved, setSaved] = useState(isWishlisted);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const { addToCart, setWishlisted } = useShopActions();

  const inCart = useCartStore((s) => s.items.some((i) => ((i as any).product?.id ?? (i as any).productId) === product.id));

  const image = product.images?.[0];
  const badge = getProductBadge(product);

  useEffect(() => {
    setSaved(isWishlisted);
  }, [isWishlisted]);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleToggleWishlist = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTogglingWishlist) return;

    const next = !saved;
    setSaved(next);
    setIsTogglingWishlist(true);

    const ok = await setWishlisted(product.id, next);
    if (!ok) setSaved(!next);

    setIsTogglingWishlist(false);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/shop/${product.id}`} className="absolute inset-0 z-0" aria-label={product.name} />

      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f3f3f3]">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink">No image</div>
        )}

        {badge && (
          <span
            className={`absolute top-2 left-2 z-10 rounded-full bg-sand px-2 py-1 text-[9px] font-bold tracking-wide text-brand uppercase shadow-sm sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[10px] ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isTogglingWishlist}
          aria-pressed={saved}
          aria-label={saved ? "Remove from favorites" : "Save to favorites"}
          className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition disabled:opacity-70 sm:top-3 sm:right-3 sm:h-9 sm:w-9 ${saved ? "bg-brand" : "bg-white/90 hover:bg-white"}`}
        >
          {isTogglingWishlist ? (
            <Loader2 className={`h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4 ${saved ? "text-white" : "text-ink"}`} />
          ) : (
            <Heart className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${saved ? "fill-white text-white" : "text-ink"}`} />
          )}
        </button>

        {product.preparations?.[0] && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-sand px-2 py-1 text-[10px] font-medium text-brand capitalize backdrop-blur sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[11px]">
            🔪 {product.preparations[0]}
          </span>
        )}

        {!product.inStock && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <h3 className="line-clamp-1 font-sora text-sm font-semibold text-ink capitalize">{product.name}</h3>

        <div className="flex items-center gap-1 text-[11px] text-ink sm:gap-1.5 sm:text-xs">
          <Star className="h-3 w-3 shrink-0 fill-brand text-brand sm:h-3.5 sm:w-3.5" />
          <span className="font-medium text-ink">{(product.rating ?? 0).toFixed(1)}</span>
          <span>({product.reviewCount ?? 0})</span>
          <span className="mx-0.5 text-ink sm:mx-1">·</span>
          <Clock className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span>{daysAgoLabel(product.createdAt)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs sm:mt-6">
          <span className="truncate font-sora text-base font-bold text-ink sm:text-lg">{formatNaira(product.basePrice)}</span>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={handleAddToCart}
            aria-label={inCart ? `${product.name} is in your cart` : `Add ${product.name} to cart`}
            className={`relative z-10 inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-white transition active:scale-95 disabled:cursor-not-allowed disabled:bg-ink sm:h-11 sm:min-w-20 sm:px-4 ${
              inCart ? "bg-[#0ca66a]" : "bg-brand hover:bg-orange-600"
            }`}
          >
            {inCart ? (
              <>
                <Check className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">In cart</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
