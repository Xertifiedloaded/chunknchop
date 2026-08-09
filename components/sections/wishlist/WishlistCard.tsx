'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Heart, Loader2 } from 'lucide-react';

interface WishlistProductCardProps {
  productId: string;
  product: {
    id: string;
    name: string;
    images: string[];
    basePrice: number;
    meatType: string;
    rating: number;
    inStock: boolean;
    preparations?: string[];
  };
  isRemoving: boolean;
  isAdding: boolean;
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string) => void;
}

export default function WishlistProductCard({ productId, product, isRemoving, isAdding, onRemove, onAddToCart }: WishlistProductCardProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl">
      <div className="xs:h-48 relative h-40 overflow-hidden sm:h-56">
        <Image src={product.images?.[0] || '/placeholder.png'} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 hover:scale-105" />

        <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold shadow sm:top-3 sm:left-3 sm:px-3 sm:py-1 sm:text-xs">{product.meatType}</span>

        <button onClick={() => onRemove(productId)} disabled={isRemoving} className="bg-brand hover:bg-brand absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow sm:top-3 sm:right-3 sm:h-9 sm:w-9">
          {isRemoving ? <Loader2 className="h-4 w-4 animate-spin text-white sm:h-5 sm:w-5" /> : <Heart className="h-4 w-4 fill-white text-white sm:h-5 sm:w-5" />}
        </button>
      </div>

      <div className="space-y-1.5 p-3 sm:space-y-2 sm:p-5">
        <h3 className="font-sora line-clamp-1 text-sm font-semibold sm:text-base">{product.name}</h3>

        <div className="text-ink flex flex-wrap items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
          <span className="text-brand">★</span>
          {product.rating}
          <span>•</span>
          {product.inStock ? <span className="text-green-600">In stock</span> : <span className="text-red-500">Out of stock</span>}
        </div>

        <h2 className="font-sora text-brand text-lg font-bold sm:text-2xl">₦{product.basePrice.toLocaleString()}</h2>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button disabled={!product.inStock || isAdding} onClick={() => onAddToCart(productId)} className="bg-brand hover:bg-brand h-10 min-w-32 flex-1 rounded-xl text-xs">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : product.inStock ? 'Move to Cart' : 'Out of Stock'}
          </Button>

          <Button variant="outline" onClick={() => onRemove(productId)} className="h-10 w-10 shrink-0 rounded-lg border-[#E5E7EB] bg-white p-0">
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}
