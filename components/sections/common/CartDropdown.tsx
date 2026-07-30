'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Minus, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { formatNaira } from '@/lib/format';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const { user, accessToken } = useAuthStore();

  const { items: cartItems, setItems: setCartItems, getTotalPrice, setLoading: setCartLoading, isLoading: cartLoading } = useCartStore();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isSupplier = user?.role === 'SUPPLIER';

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = getTotalPrice();

  const fetchCart = useCallback(async () => {
    if (!accessToken || !user || isSupplier) {
      setCartItems([]);
      return;
    }

    try {
      setCartLoading(true);

      const res = await fetch('/api/customer/cart', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        if (error?.code === 'TOKEN_EXPIRED' || error?.code === 'NO_TOKEN') {
          useAuthStore.getState().logout();
          toast.error('Your session expired — please sign in again');
          setCartItems([]);
          return;
        }

        throw new Error(error?.error || 'Failed to fetch cart');
      }

      const data = await res.json();

      setCartItems(data.cartItems || []);
    } catch (error) {
      console.error('[cart] failed to fetch cart:', error);
    } finally {
      setCartLoading(false);
    }
  }, [accessToken, user, isSupplier, setCartItems, setCartLoading]);

  useEffect(() => {
    if (user && accessToken && !isSupplier) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user, accessToken, isSupplier, fetchCart, setCartItems]);

  async function handleRemoveItem(cartItemId: string) {
    if (!accessToken) {
      toast.error('Please sign in to manage your cart');
      return;
    }

    const previousItems = cartItems;

    setCartItems(cartItems.filter((item) => item.id !== cartItemId));
    setRemovingId(cartItemId);
    try {
      const res = await fetch(`/api/customer/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        throw new Error(error?.error || 'Failed to remove item');
      }

      toast.success('Item removed');
    } catch (error) {
      console.error('[cart] remove error:', error);

      setCartItems(previousItems);

      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleUpdateQuantity(cartItemId: string, newQuantity: number) {
    const item = cartItems.find((cartItem) => cartItem.id === cartItemId);

    if (!item) {
      return;
    }

    if (newQuantity < 1) {
      await handleRemoveItem(cartItemId);
      return;
    }

    if (!accessToken) {
      toast.error('Please sign in to manage your cart');
      return;
    }

    const previousItems = cartItems;

    setCartItems(
      cartItems.map((cartItem) =>
        cartItem.id === cartItemId
          ? {
              ...cartItem,
              quantity: newQuantity,
            }
          : cartItem
      )
    );

    setUpdatingId(cartItemId);

    try {
      const res = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: newQuantity,
          selectedTier: item.selectedTier,
          selectedPreparation: item.selectedPreparation,
          selectedVariants: item.selectedVariants || [],
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        throw new Error(error?.error || 'Failed to update quantity');
      }

      await fetchCart();
    } catch (error) {
      console.error('[cart] update quantity error:', error);
      setCartItems(previousItems);

      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  }

  if (isSupplier) {
    return null;
  }

  return (
    <div className={`overflow-hidden border-t border-neutral-100 shadow-lg transition-all duration-300 ${isOpen ? 'max-h-175 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="mx-auto max-w-7xl px-6 py-5 lg:px-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#2D2D2D]">
            Your order ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </p>

          <button type="button" onClick={onClose} aria-label="Close cart" className="text-neutral-400 transition hover:text-neutral-700">
            <X size={16} />
          </button>
        </div>

        {cartLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-neutral-400">Your cart is empty.</p>

            <Link href="/shop" onClick={onClose} className="bg-brand mt-4 inline-block rounded-md px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex max-h-96 flex-col gap-3 overflow-y-auto">
            {cartItems.map((item) => {
              const tierPrice = item.selectedTier ? item.product.tiers.find((tier) => tier.name === item.selectedTier)?.price : undefined;

              const itemPrice = tierPrice ?? item.product.basePrice;

              const isUpdating = updatingId === item.id;

              const isRemoving = removingId === item.id;

              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#F7F5F4] p-3">
                  {item.product.images?.[0] ? <img src={item.product.images[0]} alt={item.product.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-[#E8A68A]" />}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#2D2D2D]">{item.product.name}</p>

                    {item.selectedTier && <p className="truncate text-xs text-neutral-400">{item.selectedTier}</p>}

                    {item.selectedPreparation && <p className="truncate text-xs text-neutral-400">{item.selectedPreparation}</p>}

                    <p className="text-xs text-neutral-400">{formatNaira(itemPrice)}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#2D2D2D]">
                    <button type="button" disabled={isUpdating || isRemoving} onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease quantity of ${item.product.name}`} className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                      <Minus size={12} />
                    </button>

                    <span className="w-4 text-center text-xs font-semibold">{isUpdating ? <Loader2 size={12} className="mx-auto animate-spin" /> : item.quantity}</span>

                    <button type="button" disabled={isUpdating || isRemoving} onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.product.name}`} className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                      <Plus size={12} />
                    </button>
                  </div>

                  <button type="button" disabled={isRemoving} onClick={() => handleRemoveItem(item.id)} aria-label={`Remove ${item.product.name} from cart`} className="text-[#2D2D2D] transition hover:text-red-500 disabled:opacity-50">
                    {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!cartLoading && cartItems.length > 0 && (
          <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
            <div>
              <span className="text-sm text-neutral-500">Subtotal</span>

              <p className="text-base font-bold text-[#2D2D2D]">{formatNaira(cartTotal)}</p>
            </div>

            <Link href="/checkout" onClick={onClose} className="bg-brand rounded-md px-8 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
