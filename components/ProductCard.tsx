'use client';

import { useState } from 'react';
import { Heart, Plus, Star, Clock } from 'lucide-react';
import { Product, formatNaira } from '@/lib/products';

export default function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  const dateLabel =
    product.addedDaysAgo === 0
      ? 'Today'
      : product.addedDaysAgo === 1
        ? 'Yesterday'
        : `${product.addedDaysAgo}d ago`;

  return (
    <div className="group hover:shadow-cardHover flex flex-col overflow-hidden rounded-2xl border border-white bg-white shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div
        className={`relative aspect-4/3 w-full bg-linear-to-br ${product.gradient} overflow-hidden`}
      >
        {product.isNew && (
          <span className="bg-ink-900 absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
            New
          </span>
        )}

        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
          className="text-ink-700 absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${saved ? 'fill-ember-500 text-ember-500' : 'text-ink-500'}`}
          />
        </button>

        <div className="flex h-full w-full items-center justify-center text-6xl">
          <span
            aria-hidden="true"
            className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
          >
            {product.emoji}
          </span>
        </div>

        <span className="bg-ink-900/80 absolute bottom-3 left-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-medium text-white capitalize">
          {product.preparation}
        </span>
        <span className="text-ink-700 absolute right-3 bottom-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold">
          {product.weight}
        </span>

        {!product.inStock && (
          <div className="bg-ink-900/50 absolute inset-0 z-20 flex items-center justify-center">
            <span className="text-ink-900 rounded-full bg-white px-3 py-1 text-xs font-semibold">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-ink-900 line-clamp-1 font-semibold">{product.name}</h3>

        <div className="text-ink-500 flex items-center gap-1.5 text-sm">
          <Star className="fill-ember-500 text-ember-500 h-3.5 w-3.5" />
          <span className="text-ink-700 font-medium">{product.rating}</span>
          <span>({product.reviews})</span>
          <span className="text-ink-300 mx-1">·</span>
          <Clock className="h-3.5 w-3.5" />
          <span>{dateLabel}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-ink-900 text-lg font-bold">{formatNaira(product.price)}</span>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => setAdded(true)}
            className="bg-ember-500 hover:bg-ember-600 disabled:bg-ink-300 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {added ? 'Added' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
