'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Plus, Star, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import type { Product } from '@/lib/types';
import { formatNaira } from '@/lib/format';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { fetchWithAuth } from '@/lib/fetchClient';

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

export default function ProductCard({ product, isWishlisted = false }: { product: Product; isWishlisted?: boolean }) {
  const [saved, setSaved] = useState(isWishlisted);
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const { user, accessToken } = useAuthStore();
  const { setItems: setCartItems } = useCartStore();

  // keep in sync if the parent's wishlist data arrives/changes after mount
  useEffect(() => {
    setSaved(isWishlisted);
  }, [isWishlisted]);

  const image = product.images?.[0];
  const badge = getProductBadge(product);

  const refreshCart = async () => {
    if (!accessToken || !user || user.role === 'SUPPLIER') return;

    try {
      const res = await fetchWithAuth('/api/customer/cart', { method: 'GET', cache: 'no-store' });

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

      const res = await fetchWithAuth('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTogglingWishlist) return;

    if (!accessToken || !user) {
      toast.error('Please sign in to save favorites.');
      return;
    }

    if (user.role === 'SUPPLIER') {
      toast.error('Suppliers cannot save favorites.');
      return;
    }

    const wasSaved = saved;

    setSaved(!wasSaved);
    setIsTogglingWishlist(true);

    try {
      if (!wasSaved) {
        const res = await fetchWithAuth('/api/customer/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product.id }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 400 && data?.error === 'Already in wishlist') {
            toast.success('Already in favorites');
            return;
          }
          throw new Error(data?.error || 'Failed to add to favorites');
        }

        toast.success('Added to favorites');
      } else {
        const res = await fetchWithAuth(`/api/customer/wishlist/${product.id}`, {
          method: 'DELETE',
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to remove from favorites');
        }

        toast.success('Removed from favorites');
      }
    } catch (error) {
      setSaved(wasSaved);
      console.error('failed to toggle wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update favorites');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {/* Stretched link: makes the whole card clickable without nesting <button> inside <a> */}
      <Link href={`/shop/${product.id}`} className="absolute inset-0 z-0" aria-label={product.name} />

      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f3f3f3]">
        {image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="text-ink flex h-full w-full items-center justify-center text-sm">No image</div>}

        {badge && <span className={`bg-sand text-brand absolute top-2 left-2 z-10 rounded-full px-2 py-1 text-[9px] font-bold tracking-wide uppercase shadow-sm sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[10px] ${badge.className}`}>{badge.label}</span>}

        <button type="button" onClick={handleToggleWishlist} disabled={isTogglingWishlist} aria-pressed={saved} aria-label={saved ? 'Remove from favorites' : 'Save to favorites'} className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition disabled:opacity-70 sm:top-3 sm:right-3 sm:h-9 sm:w-9 ${saved ? 'bg-brand' : 'bg-white/90 hover:bg-white'}`}>
          {isTogglingWishlist ? <Loader2 className={`h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4 ${saved ? 'text-white' : 'text-ink'}`} /> : <Heart className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${saved ? 'fill-white text-white' : 'text-ink'}`} />}
        </button>

        {product.preparations?.[0] && <span className="bg-sand text-brand absolute bottom-2 left-2 z-10 rounded-full px-2 py-1 text-[10px] font-medium capitalize backdrop-blur sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-[11px]">🔪 {product.preparations[0]}</span>}

        {!product.inStock && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="text-ink rounded-full bg-white px-4 py-2 text-xs font-semibold">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <h3 className="font-sora text-ink line-clamp-1 text-sm font-semibold capitalize">{product.name}</h3>

        <div className="text-ink flex items-center gap-1 text-[11px] sm:gap-1.5 sm:text-xs">
          <Star className="fill-brand text-brand h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="text-ink font-medium">{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
          <span className="text-ink mx-0.5 sm:mx-1">·</span>
          <Clock className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span>{daysAgoLabel(product.createdAt)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs sm:mt-6">
          <span className="font-sora text-ink truncate text-base font-bold sm:text-lg">{formatNaira(product.basePrice)}</span>

          <button type="button" disabled={!product.inStock || isAdding} onClick={handleAddToCart} aria-label="Add to cart" className="bg-brand disabled:bg-ink relative z-10 inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed sm:h-11 sm:min-w-20 sm:px-4">
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
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
