"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatNaira } from "@/lib/utils/format";
import { isTempItem, maxQuantityFor, useCartActions } from "@/features/cart/hooks/useCartActions";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  hideBar?: boolean;
}

const round = "flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-ink transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50";
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function CartDropdown({ isOpen, onOpen, onClose, hideBar }: Props) {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const items = useCartStore((s) => s.items);
  const setItems = useCartStore((s) => s.setItems);
  const loading = useCartStore((s) => s.isLoading);
  const setLoading = useCartStore((s) => s.setLoading);
  const total = useCartStore((s) => s.getTotalPrice());
  const { setQuantity, removeItem, clearAll } = useCartActions();
  const [confirmClear, setConfirmClear] = useState(false);

  const active = isHydrated && !!user && user.role !== "SUPPLIER";
  const count = items.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    if (!active) return void setItems([]);

    (async () => {
      if (!useCartStore.getState().items.length) setLoading(true);

      try {
        const res = await fetchWithAuth("/api/customer/cart", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (data?.code === "TOKEN_EXPIRED" || data?.code === "NO_TOKEN") {
            useAuthStore.getState().logout();
            toast.error("Your session expired — please sign in again");
            return setItems([]);
          }
          throw new Error(data?.error || "Failed to fetch cart");
        }
        setItems(data.cartItems ?? []);
      } catch (e) {
        console.error("[cart] failed to fetch cart:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [active, setItems, setLoading]);

  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 767px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = prev);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !items.length) setConfirmClear(false);
  }, [isOpen, items.length]);

  if (!active) return null;

  return (
    <>
      {count > 0 && !isOpen && !hideBar && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open cart, ${plural(count, "item", "items")}`}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-full bg-[#141a2c] p-2.5 pr-4 text-left text-white shadow-2xl md:hidden"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500">
            <ShoppingBag size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold tracking-widest text-orange-400 uppercase">{plural(items.length, "pack", "packs")} in cart</span>
            <span className="block truncate text-sm font-bold">{plural(count, "item", "items")} selected</span>
          </span>
          <span className="text-right">
            <span className="block text-[10px] tracking-widest text-neutral-400 uppercase">Total</span>
            <span className="block text-lg leading-tight font-extrabold">{formatNaira(total)}</span>
          </span>
          <ChevronUp size={18} className="text-neutral-400" />
        </button>
      )}

      <div onClick={onClose} aria-hidden className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:bg-transparent ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />

      <div
        role="dialog"
        aria-label="Your cart"
        aria-hidden={!isOpen}
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white shadow-2xl transition-all duration-300 ease-out md:top-13 md:bottom-auto md:rounded-none ${
          isOpen ? "translate-y-0 opacity-100" : "invisible translate-y-full opacity-0 md:-translate-y-2"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:py-5 lg:px-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-brand-foreground">Your order ({plural(count, "item", "items")})</p>

            <div className="flex items-center gap-4">
              {items.length > 0 &&
                (confirmClear ? (
                  <span className="flex items-center gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        clearAll();
                        setConfirmClear(false);
                      }}
                      className="text-red-500"
                    >
                      Yes, clear all
                    </button>
                    <button type="button" onClick={() => setConfirmClear(false)} className="text-neutral-400">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmClear(true)} className="text-xs font-semibold text-neutral-400 transition hover:text-red-500">
                    Clear all
                  </button>
                ))}

              <button type="button" onClick={onClose} aria-label="Close cart" className="text-neutral-400 transition hover:text-neutral-700">
                <ChevronDown size={22} className="md:hidden" />
                <X size={16} className="hidden md:block" />
              </button>
            </div>
          </div>

          {loading && !items.length ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : !items.length ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-400">Your cart is empty.</p>
              <Link href="/shop" onClick={onClose} className="mt-4 inline-block rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 flex max-h-[55dvh] flex-col gap-3 overflow-y-auto overscroll-contain md:max-h-96">
                {items.map((item) => {
                  const { product, selectedTier, selectedPreparation, quantity, id } = item;
                  const price = product.tiers.find((t) => t.name === selectedTier)?.price ?? product.basePrice;
                  const temp = isTempItem(id);

                  return (
                    <div key={id} className="flex items-center gap-3 rounded-xl bg-[#F7F5F4] p-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-[#E8A68A]" />
                      )}

                      <div className="min-w-0 flex-1 text-xs text-neutral-400">
                        <p className="truncate text-sm font-semibold text-black capitalize">{product.name}</p>
                        {selectedTier && <p className="truncate">{selectedTier}</p>}
                        {selectedPreparation && <p className="truncate">{selectedPreparation}</p>}
                        <p>{formatNaira(price)}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-brand-foreground">
                        <button
                          type="button"
                          disabled={temp}
                          onClick={() => (quantity <= 1 ? removeItem(id) : setQuantity(id, quantity - 1))}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className={round}
                        >
                          <Minus size={12} />
                        </button>

                        <span className="w-4 text-center text-xs font-semibold text-black">{temp ? <Loader2 size={12} className="mx-auto animate-spin" /> : quantity}</span>

                        <button
                          type="button"
                          disabled={temp || quantity >= maxQuantityFor(product?.stock)}
                          onClick={() => setQuantity(id, quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className={round}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button type="button" disabled={temp} onClick={() => removeItem(id)} aria-label={`Remove ${product.name} from cart`} className="text-brand-foreground transition hover:text-red-500 disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                <div>
                  <span className="text-sm text-neutral-500">Subtotal</span>
                  <p className="text-base font-bold text-brand-foreground">{formatNaira(total)}</p>
                </div>
                <Link href="/checkout" onClick={onClose} className="rounded-md bg-brand px-8 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}