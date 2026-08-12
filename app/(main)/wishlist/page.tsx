'use client';

import { fetchWithAuth } from '@/lib/fetchClient';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import WishlistHeader from '@/components/sections/wishlist/WishlistHeader';
import WishlistProductCard from '@/components/sections/wishlist/WishlistCard';
import SimilarProducts from '@/components/sections/common/SimilarProducts';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';

interface WishlistItem {
  productId: string;
  product: {
    id: string;
    name: string;
    images: string[];
    basePrice: number;
    meatType: string;
    rating: number;
    inStock: boolean;
  };
}

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);

  if (!res.ok) {
    throw new Error('Failed to fetch wishlist');
  }

  return res.json();
};

export default function WishlistPage() {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isMovingAll, setIsMovingAll] = useState(false);

  const { user, accessToken } = useAuthStore();
  const { setItems: setCartItems } = useCartStore();

  const { data: wishlist = [], mutate, error } = useSWR<WishlistItem[]>(accessToken ? '/api/customer/wishlist' : null, fetcher);

  const refreshCart = async () => {
    if (!accessToken || !user || user.role === 'SUPPLIER') return;

    try {
      const res = await fetchWithAuth('/api/customer/cart', {
        method: 'GET',
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

  const handleRemove = async (productId: string) => {
    if (!accessToken) {
      toast.error('Please sign in.');
      return;
    }

    setIsRemoving(productId);

    try {
      const res = await fetchWithAuth(`/api/customer/wishlist/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success('Removed from wishlist');

      mutate();
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!accessToken || !user) {
      toast.error('Please sign in to add items to your cart.');
      return;
    }

    if (user.role === 'SUPPLIER') {
      toast.error('Suppliers cannot add products to cart.');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          selectedTier: null,
          selectedPreparation: null,
          selectedVariants: [],
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add to cart');
      }

      await refreshCart();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  const handleMoveAll = async () => {
    if (!accessToken || !user) {
      toast.error('Please sign in to move items to your cart.');
      return;
    }

    if (user.role === 'SUPPLIER') {
      toast.error('Suppliers cannot add products to cart.');
      return;
    }

    const available = wishlist.filter((item) => item.product.inStock);

    if (available.length === 0) {
      toast.error('No in-stock items to move.');
      return;
    }

    setIsMovingAll(true);

    try {
      const results = await Promise.allSettled(
        available.map((item) =>
          fetchWithAuth('/api/customer/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',

            },
            body: JSON.stringify({
              productId: item.productId,
              quantity: 1,
              selectedTier: null,
              selectedPreparation: null,
              selectedVariants: [],
            }),
          }).then((res) => {
            if (!res.ok) throw new Error(item.productId);
            return res;
          })
        )
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;

      await refreshCart();

      if (succeeded > 0) {
        toast.success(failed > 0 ? `Moved ${succeeded} item${succeeded === 1 ? '' : 's'} to cart, ${failed} failed` : 'All available items moved to cart');
      } else {
        toast.error('Failed to move items');
      }
    } catch {
      toast.error('Failed to move items');
    } finally {
      setIsMovingAll(false);
    }
  };

  if (error) {
    return <div className="p-10 text-center">Failed loading wishlist</div>;
  }

  if (!wishlist) {
    return <div className="p-10 text-center">Loading wishlist...</div>;
  }

  return (
    <div className="min-h-screen bg-[#faf8f6] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <WishlistHeader count={wishlist.length} onMoveAll={handleMoveAll} isMovingAll={isMovingAll} />

        {wishlist.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white py-20 text-center">
            <h3 className="text-xl font-semibold">Your wishlist is empty</h3>

            <p className="mt-2 text-gray-500">Save products you love to find them later.</p>

            <Link href="/">
              <Button className="bg-brand mt-6 rounded-xl hover:bg-orange-600">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wishlist.map((item) => (
              <WishlistProductCard key={item.productId} productId={item.productId} product={item.product} isRemoving={isRemoving === item.productId} onRemove={handleRemove} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}

        {wishlist.length > 0 && <SimilarProducts eyebrow="You might also love" heading="Similar cuts, hand-picked" items={wishlist.slice(0, 4).map((item) => item.product)} />}
      </div>
    </div>
  );
}