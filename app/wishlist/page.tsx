'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

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

export default function WishlistPage() {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const { data: wishlist, mutate } = useSWR('/api/customer/wishlist');

  const handleRemove = async (productId: string) => {
    setIsRemoving(productId);
    try {
      const res = await fetch(`/api/customer/wishlist/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Removed from wishlist');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        toast.success('Added to cart!');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (!wishlist) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-foreground mb-8 text-3xl font-bold">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {wishlist.map((item: WishlistItem) => (
            <div
              key={item.productId}
              className="border-border overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
            >
              <div className="bg-muted relative aspect-square">
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-foreground truncate font-semibold">{item.product.name}</h3>
                <p className="text-muted-foreground mb-2 text-sm">{item.product.meatType}</p>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-foreground font-bold">${item.product.basePrice}</p>
                  <div className="flex items-center gap-1">
                    <span>⭐</span>
                    <span className="text-muted-foreground text-sm">{item.product.rating}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleAddToCart(item.productId)}
                    className="w-full"
                    disabled={!item.product.inStock}
                  >
                    {item.product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRemove(item.productId)}
                    disabled={isRemoving === item.productId}
                    className="w-full"
                  >
                    {isRemoving === item.productId ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
