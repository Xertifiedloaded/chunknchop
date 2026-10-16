"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Heart, Plus, Check, Star, Clock, Loader2 } from "lucide-react";

import type { Product } from "@/types";
import { formatNaira } from "@/lib/utils/format";
import { useCartStore } from "@/store/cartStore";
import { useShopActions } from "@/features/catalog/hooks/useShopActions";

const DAY_MS = 86_400_000;

const daysAgoLabel = (createdAt: string) => {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;
};

const badgeLabel = (p: Product) => (p.isBestSeller ? "Best Seller" : p.isNewArrival ? "Fresh Today" : null);

const swallow = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

export default function ProductCard({ product, isWishlisted = false }: { product: Product; isWishlisted?: boolean }) {
  const [saved, setSaved] = useState(isWishlisted);
  const [toggling, setToggling] = useState(false);

  const { addToCart, setWishlisted } = useShopActions();
  const inCart = useCartStore((s) => s.items.some((i) => ((i as any).product?.id ?? (i as any).productId) === product.id));

  const image = product.images?.[0];
  const badge = badgeLabel(product);
  const prep = product.preparations?.[0];

  useEffect(() => setSaved(isWishlisted), [isWishlisted]);

  const toggleWishlist = async (e: MouseEvent) => {
    swallow(e);
    if (toggling) return;

    const next = !saved;
    setSaved(next);
    setToggling(true);

    if (!(await setWishlisted(product.id, next))) setSaved(!next);
    setToggling(false);
  };

  const heartTone = saved ? "text-white" : "text-ink";

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/shop/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name} />

      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f3f3f3]">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink">No image</div>
        )}

        {badge && (
          <span className="pointer-events-none absolute top-2 left-2 z-10 rounded-full bg-brand px-2 py-1 text-[9px] font-bold tracking-wide text-white uppercase shadow-sm sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={toggling}
          aria-pressed={saved}
          aria-label={saved ? "Remove from favorites" : "Save to favorites"}
          className={`absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition disabled:opacity-70 sm:top-3 sm:right-3 sm:h-9 sm:w-9 ${saved ? "bg-brand" : "bg-white/90 hover:bg-white"}`}
        >
          {toggling ? (
            <Loader2 className={`h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4 ${heartTone}`} />
          ) : (
            <Heart className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${heartTone} ${saved ? "fill-white" : ""}`} />
          )}
        </button>

        {prep && (
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-sand px-2 py-1 text-[10px] font-medium text-brand capitalize backdrop-blur sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[11px]">
            🔪 {prep}
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
          <span className="font-medium">{(product.rating ?? 0).toFixed(1)}</span>
          <span>({product.reviewCount ?? 0})</span>
    
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 text-xs ">
          <span className="truncate font-sora text-base font-bold text-ink sm:text-lg">{formatNaira(product.basePrice)}</span>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={(e) => {
              swallow(e);
              addToCart(product);
            }}
            aria-label={inCart ? `${product.name} is in your cart` : `Add ${product.name} to cart`}
            className={`relative z-20 inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-white transition active:scale-95 disabled:cursor-not-allowed disabled:bg-ink sm:h-11 sm:min-w-20 sm:px-4 ${
              inCart ? "bg-[#0ca66a]" : "bg-brand hover:bg-orange-600"
            }`}
          >
            {inCart ? <Check className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" /> : <Plus className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
            <span className="hidden sm:inline">{inCart ? "In cart" : "Add"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}