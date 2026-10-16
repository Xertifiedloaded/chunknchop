"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, Star, Truck, PackageCheck, ShieldCheck, Heart, Share2, Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { fetchWithAuth } from "@/lib/http/fetchClient";
import { formatNaira } from "@/lib/utils/format";
import { useAuthStore } from "@/store/authStore";
import { useIsWishlisted } from "@/store/wishlistStore";
import { useShopActions, useInCart } from "@/features/catalog/hooks/useShopActions";

import ReviewsSection from "@/features/catalog/components/Rating";
import LoadingState from "@/components/feedback/LoadingState";

interface ProductTier {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  description: string;
  images: string[];
  basePrice: number;
  stock: number;
  category: string;
  rating: number;
  reviewCount: number;
  preparations: string[];
  tags: string[];
  tiers: ProductTier[];
  supplier: {
    id: string;
    supplierProfile?: {
      storeName: string;
      logo?: string;
      rating: number;
    };
  };
}

const fetcher = async (url: string): Promise<Product> => {
  const res = await fetchWithAuth(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);

    throw new Error(errorBody?.error || `Failed to fetch product (status ${res.status})`);
  }

  return res.json();
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const user = useAuthStore((s) => s.user);

  const { addToCart, buyNow, setWishlisted } = useShopActions();
  const inCart = useInCart(productId);
  const wishlisted = useIsWishlisted(productId);

  const {
    data: product,
    error,
    isLoading,
  } = useSWR<Product>(productId ? `/api/products/${productId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    keepPreviousData: false,
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedTier, setSelectedTier] = useState("");
  const [selectedPreparation, setSelectedPreparation] = useState("");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!product) {
      return;
    }

    setMainImageIndex(0);
    setQuantity(1);
    setSelectedTier("");

    setSelectedPreparation(product.preparations?.[0] || "");
  }, [product]);

  const isOutOfStock = !product || product.stock <= 0;

  const selectedTierData = selectedTier ? product?.tiers?.find((tier) => tier.id === selectedTier) : undefined;

  const currentPrice = selectedTierData?.price ?? product?.basePrice ?? 0;

  const total = currentPrice * quantity;

  const savings = product ? Math.max(0, product.basePrice - currentPrice) : 0;

  const options = {
    quantity,
    selectedTier: selectedTierData?.name ?? null,
    selectedPreparation: selectedPreparation || null,
  };

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) {
      return;
    }

    setIsAddingToCart(true);

    try {
      if (await addToCart(product, options)) {
        setQuantity(1);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || isOutOfStock) {
      return;
    }

    setIsBuyingNow(true);

    try {
      if (await buyNow(product, options)) {
        router.push("/checkout");
      }
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    if (isToggling) {
      return;
    }

    setIsToggling(true);

    await setWishlisted(productId, !wishlisted);

    setIsToggling(false);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !product) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-charcoal">Product not found</h1>

          <p className="mt-2 text-center text-sm text-ink">The product you are looking for does not exist or is no longer available.</p>

          <Link href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B96A2F]">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="mb-8 flex items-center gap-2 overflow-hidden text-xs text-ink">
          <Link href="/" className="shrink-0 hover:text-brand">
            Home
          </Link>

          <span className="text-[#C4B8A8]">›</span>

          <Link href="/shop" className="shrink-0 hover:text-brand">
            Shop
          </Link>

          <span className="text-[#C4B8A8]">›</span>

          <span className="shrink-0">{product.category}</span>

          <span className="text-[#C4B8A8]">›</span>

          <span className="truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-[#F7F4EF]">
              {product.images?.[mainImageIndex] ? (
                <img loading="eager" src={product.images[mainImageIndex]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-ink">No image available</div>
              )}

              <div className="absolute top-2 left-2 flex flex-wrap items-start gap-1">
                <span className="rounded-2xl bg-[#231B16] p-2 text-[8px] leading-tight font-medium tracking-normal text-white">{product.category.toUpperCase()}</span>

                {isOutOfStock ? (
                  <span className="rounded-full bg-[#7A2E1E] p-2 text-[8px] leading-tight font-medium tracking-normal text-white">OUT OF STOCK</span>
                ) : savings > 0 ? (
                  <span className="rounded-full bg-[#7A2E1E] p-2 text-[8px] leading-tight font-medium tracking-normal text-white">SAVE {formatNaira(savings)}</span>
                ) : null}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {product.images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setMainImageIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${mainImageIndex === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img loading="lazy" src={src} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide">
              <span className="text-brand">{product.category.toUpperCase()}</span>

              <span className="text-[#C4B8A8]">•</span>

              <span className="truncate text-ink">SKU {product.sku || product.id}</span>
            </div>

            <h1 className="mt-3 text-3xl leading-tight font-bold text-charcoal capitalize sm:text-4xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 text-brand">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <Star key={index} size={15} fill={index < Math.floor(product.rating) ? "currentColor" : "none"} strokeWidth={index < Math.floor(product.rating) ? 0 : 1.5} />
                ))}
              </div>

              <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>

              <span className="text-xs text-ink">• {product.reviewCount} reviews</span>

              <span className="flex items-center gap-1 rounded-full bg-sand px-2 py-1 text-[10px] font-medium text-brand">
                <ShieldCheck size={12} />
                Every Cut Certified
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm sm:gap-3 sm:p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-brand sm:h-9 sm:w-9">
                  <Truck size={15} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold tracking-wide text-ink">DELIVERY ETA</p>

                  <p className="truncate font-semibold text-charcoal">Tomorrow, before 12 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm sm:gap-3 sm:p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-brand sm:h-9 sm:w-9">
                  <PackageCheck size={15} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold tracking-wide text-ink">AVAILABILITY</p>

                  <p className="truncate font-semibold text-charcoal">{isOutOfStock ? "Out of stock" : product.stock > 10 ? "In stock" : `Only ${product.stock} left`}</p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 font-sora text-charcoal">
              <span className="text-3xl font-bold sm:text-5xl">{formatNaira(currentPrice)}</span>

              {product.basePrice !== currentPrice && (
                <>
                  <span className="text-base text-[#B0A292] line-through sm:text-lg">{formatNaira(product.basePrice)}</span>

                  {savings > 0 && <span className="rounded-md bg-[#3A2A20] px-2.5 py-1 text-xs font-semibold text-white">Save {formatNaira(savings)}</span>}
                </>
              )}
            </div>

            {product.tiers?.length > 0 && (
              <div className="mt-7">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Select Tier</p>

                  <p className="text-[9px] font-medium tracking-wide text-ink sm:text-[11px]">CHOOSE AN OPTION</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.tiers.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(tier.id)}
                      className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${selectedTier === tier.id ? "border-brand bg-sand text-brand" : "border-[#E5DDD2] text-[#231B16] hover:border-brand"}`}
                    >
                      {selectedTier === tier.id ? "✓ " : ""}
                      {tier.name} · {formatNaira(tier.price)}
                    </button>
                  ))}
                </div>

                {selectedTierData && selectedTierData.features?.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {selectedTierData.features.map((feature, index) => (
                      <li key={index} className="text-xs text-ink">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-5 space-y-5">
              {product.preparations?.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#231B16]">Preparation</p>

                    <p className="text-[9px] font-semibold tracking-wide text-[#9A9188] uppercase">Butchered to order</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.preparations.map((preparation) => (
                      <button
                        key={preparation}
                        type="button"
                        onClick={() => setSelectedPreparation(preparation)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium capitalize transition-colors ${selectedPreparation === preparation ? "border-brand bg-[#FFF7F0] text-brand" : "border-[#E5DDD2] bg-white text-[#231B16] hover:border-brand hover:text-brand"}`}
                      >
                        {selectedPreparation === preparation ? "✓ " : ""}
                        {preparation}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.tags?.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold text-[#231B16]">Tags</p>

                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-[#E5DDD2] bg-white px-4 py-2 text-xs font-medium text-[#231B16] capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-[#E5DDD2] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={isOutOfStock}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#231B16] transition-colors hover:bg-[#F7F4EF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={15} />
                </button>

                <input
                  type="number"
                  min="1"
                  max={product.stock || undefined}
                  value={quantity}
                  disabled={isOutOfStock}
                  onChange={(event) => {
                    const value = parseInt(event.target.value, 10) || 1;

                    const maxQuantity = product.stock > 0 ? product.stock : 1;

                    setQuantity(Math.min(maxQuantity, Math.max(1, value)));
                  }}
                  className="w-10 bg-transparent text-center text-sm font-semibold text-charcoal outline-none disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={isOutOfStock || quantity >= product.stock}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#231B16] transition-colors hover:bg-[#F7F4EF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>

              <p className="text-sm text-ink">
                {quantity} {quantity === 1 ? "item" : "items"}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {!user ? (
                <Link
                  href={`/auth/login?next=${encodeURIComponent(`/shop/${product.id}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-xs font-semibold text-white transition-colors hover:bg-[#B96A2F]"
                >
                  Login to Continue
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isAddingToCart || isBuyingNow}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-xs font-semibold text-white transition-colors hover:bg-[#B96A2F] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-[8]"
                  >
                    <ShoppingBag size={17} />

                    {isAddingToCart ? "Adding..." : `${inCart ? "Add more" : "Add to Cart"} · ${formatNaira(total)}`}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock || isAddingToCart || isBuyingNow}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal py-3 text-xs font-semibold text-white transition-colors hover:bg-[#B96A2F] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-2"
                  >
                    {isBuyingNow ? "Processing..." : "Buy Now"}
                  </button>
                </>
              )}
            </div>

            <div className="mt-3 flex gap-3 text-charcoal">
              <button
                type="button"
                onClick={handleWishlist}
                disabled={isToggling}
                aria-pressed={wishlisted}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5DDD2] bg-white py-3 text-xs font-medium transition-colors hover:border-brand disabled:opacity-70"
              >
                {isToggling ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} className={wishlisted ? "fill-brand text-brand" : ""} />}
                {wishlisted ? "Saved" : "Wishlist"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);

                    toast.success("Product link copied");
                  } catch {
                    toast.error("Unable to copy product link");
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5DDD2] bg-white py-3 text-xs font-medium transition-colors hover:border-brand"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 rounded-lg bg-white p-4 shadow">
          <div className="mb-10 rounded-lg border border-ink/30 px-3 py-6">
            <h3 className="font-worksans font-bold text-charcoal">Description</h3>

            <p className="mt-2 text-xs leading-relaxed text-ink">{product.description}</p>
          </div>

          <ReviewsSection productId={product.id} initialRating={product.rating} initialReviewCount={product.reviewCount} />
        </div>
      </div>
    </main>
  );
}