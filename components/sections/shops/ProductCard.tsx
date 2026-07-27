'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Star, Clock } from 'lucide-react';

import { Product } from '@/lib/store/productStore';
import { formatNaira } from '@/lib/format';

function daysAgoLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';

  return `${days}d ago`;
}

function getProductBadge(product: Product) {
  if (product.isBestSeller) {
    return {
      label: 'Best Seller',
      className: 'bg-orange-500',
    };
  }

  if (product.isNewArrival) {
    return {
      label: 'Fresh Today',
      className: 'bg-orange-500',
    };
  }

  return null;
}

export default function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  const image = product.images?.[0];
  const badge = getProductBadge(product);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {/* IMAGE */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f3f3f3]">
        {image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image</div>}

        {/* AUTOMATIC PRODUCT BADGE */}
        {badge && <span className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm ${badge.className}`}>{badge.label}</span>}

        {/* FAVORITE */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Heart className={`h-4 w-4 transition-colors ${saved ? 'fill-ember-500 text-ember-500' : 'text-gray-500'}`} />
        </button>

        {/* PREPARATION */}
        {product.preparations?.[0] && <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white capitalize backdrop-blur">🔪 {product.preparations[0]}</span>}

        {/* OUT OF STOCK */}
        {!product.inStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900">Out of stock</span>
          </div>
        )}
      </div>

      {/* PRODUCT INFO */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/shop/${product.id}`}>
          <h3 className="line-clamp-1 font-semibold text-gray-900 hover:underline">{product.name}</h3>
        </Link>

        {/* RATING */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />

          <span className="font-medium text-gray-700">{product.rating.toFixed(1)}</span>

          <span>({product.reviewCount})</span>

          <span className="mx-1 text-gray-300">·</span>

          <Clock className="h-3.5 w-3.5" />

          <span>{daysAgoLabel(product.createdAt)}</span>
        </div>

        {/* PRICE + ADD */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-gray-900">{formatNaira(product.basePrice)}</span>

          <button type="button" disabled={!product.inStock} onClick={() => setAdded(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
