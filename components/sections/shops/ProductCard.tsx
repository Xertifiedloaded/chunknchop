'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Star, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Product } from '@/lib/store/productStore';
import { formatNaira } from '@/lib/format';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';

function daysAgoLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function getProductBadge(product: Product) {
  if (product.isBestSeller) return { label: 'Best Seller', className: 'bg-brand' };
  if (product.isNewArrival) return { label: 'Fresh Today', className: 'bg-brand' };
  return null;
}

export default function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { user, accessToken } = useAuthStore();
  const { setItems: setCartItems } = useCartStore();

  const image = product.images?.[0];
  const badge = getProductBadge(product);

  const refreshCart = async () => {
    if (!accessToken || !user || user.role === 'SUPPLIER') return;

    try {
      const res = await fetch('/api/customer/cart', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });

      if (!res.ok) return;

      const data = await res.json();

      setCartItems(
        (data.cartItems || []).map((item: any) => ({
          ...item,
          selectedVariants: item.selectedVariants || [],
          selectedTier: item.selectedTier || undefined,
          product: {
            ...item.product,
            tiers: item.product.tiers || [],
            variants: item.product.variants || [],
          },
        }))
      );
    } catch (error) {
      console.error('failed to refresh cart:', error);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) return;

    if (!accessToken || !user) {
      toast.error('Please sign in to add items to your cart.');
      return;
    }

    if (user.role === 'SUPPLIER') {
      toast.error('Suppliers cannot add products to cart.');
      return;
    }

    try {
      setIsAdding(true);

      const res = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          selectedTier: null,
          selectedPreparation: product.preparations?.[0] || null,
          selectedVariants: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add product to cart');
      }

      await refreshCart();
      toast.success('Added to cart');
    } catch (error) {
      console.error('failed to add item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f3f3f3]">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink">No image</div>
        )}

        {badge && <span className={`absolute text-xs bg-sand text-brand  top-3 left-3 z-10 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wide  uppercase shadow-sm ${badge.className}`}>{badge.label}</span>}

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
          <Heart className={`h-4 w-4 transition-colors ${saved ? 'fill-ember-500 text-ember-500' : 'text-ink'}`} />
        </button>

        {product.preparations?.[0] && <span className="absolute bottom-3 left-3 z-10 rounded-full  px-3 py-1.5 text-[11px] font-medium bg-sand text-brand text-xs capitalize backdrop-blur">🔪 {product.preparations[0]}</span>}

        {!product.inStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/shop/${product.id}`}>
          <h3 className="line-clamp-1 text-sm capitalize font-sora font-semibold text-ink hover:underline">{product.name}</h3>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-ink">
          <Star className="h-3.5 w-3.5 fill-brand text-brand" />
          <span className="font-medium text-ink">{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
          <span className="mx-1 text-ink">·</span>
          <Clock className="h-3.5 w-3.5" />
          <span>{daysAgoLabel(product.createdAt)}</span>
        </div>

        <div className="text-xs mt-6 flex items-center justify-between ">
          <span className="text-lg font-sora  font-bold text-ink">{formatNaira(product.basePrice)}</span>

          <button
            type="button"
            disabled={!product.inStock || isAdding}
            onClick={handleAddToCart}
            className="inline-flex h-10 min-w-20 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-ink sm:h-11 sm:px-4"
          >
            {isAdding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}