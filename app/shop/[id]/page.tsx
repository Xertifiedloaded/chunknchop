'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Star, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  basePrice: number;
  stock: number;
  inStock: boolean;
  category: string;
  meatType: string;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  sameDayDelivery: boolean;
  preparations: string[];
  tiers: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    features: string[];
  }>;
  variants: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  supplier: {
    id: string;
    name: string;
    supplierProfile?: {
      storeName: string;
      logo?: string;
      rating: number;
      totalReviews: number;
    };
  };
  ratings: any[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { addItem, setItems, items } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const productId = params.id as string;

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error('[v0] Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      setIsAddingToCart(true);

      const res = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId,
          quantity,
          selectedTier: selectedTier || undefined,
          selectedVariants: Object.values(selectedVariants),
        }),
      });

      if (!res.ok) throw new Error('Failed to add to cart');

      const cartItem = await res.json();
      addItem(cartItem);
      toast.success('Added to cart!');
      setQuantity(1);
      setSelectedTier('');
      setSelectedVariants({});
    } catch (error) {
      console.error('[v0] Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold">Product not found</p>
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedTier
    ? product.tiers.find((t) => t.id === selectedTier)?.price || product.basePrice
    : product.basePrice;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 border-b backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="hover:text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="bg-muted mb-4 overflow-hidden rounded-lg">
              {product.images[mainImageIndex] ? (
                <img
                  src={product.images[mainImageIndex]}
                  alt={product.name}
                  className="h-96 w-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex h-96 w-full items-center justify-center">
                  No image available
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImageIndex(idx)}
                    className={`overflow-hidden rounded-lg border-2 transition-colors ${
                      idx === mainImageIndex ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Breadcrumb */}
            <p className="text-muted-foreground mb-2 text-sm">{product.category}</p>

            {/* Title */}
            <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>

            {/* Supplier */}
            <Link
              href={`/supplier/${product.supplier.id}`}
              className="bg-muted hover:bg-muted/80 mb-4 inline-flex items-center gap-2 rounded-lg p-3 transition-colors"
            >
              {product.supplier.supplierProfile?.logo && (
                <img
                  src={product.supplier.supplierProfile.logo}
                  alt={product.supplier.supplierProfile.storeName}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {product.supplier.supplierProfile?.storeName || product.supplier.name}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="fill-primary text-primary h-3 w-3" />
                  <span className="text-xs">
                    {product.supplier.supplierProfile?.rating.toFixed(1)} (
                    {product.supplier.supplierProfile?.totalReviews})
                  </span>
                </div>
              </div>
            </Link>

            {/* Rating */}
            <div className="mb-6 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">
                ({product.reviews?.length || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="bg-muted mb-6 rounded-lg p-4">
              <p className="text-muted-foreground mb-1 text-sm">Price</p>
              <p className="text-primary text-4xl font-bold">${currentPrice}</p>
              {product.basePrice !== currentPrice && (
                <p className="text-muted-foreground mt-1 text-sm">Base: ${product.basePrice}</p>
              )}
            </div>

            {/* Stock Status */}
            {product.stock > 0 ? (
              <p className="mb-6 text-sm font-semibold text-green-600">
                {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
              </p>
            ) : (
              <p className="text-destructive mb-6 text-sm font-semibold">Out of Stock</p>
            )}

            {/* Description */}
            <p className="text-muted-foreground mb-6">{product.description}</p>

            {/* Tiers */}
            {product.tiers.length > 0 && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold">Select Tier</label>
                <div className="grid grid-cols-1 gap-2">
                  {product.tiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`rounded-lg border-2 p-3 text-left transition-colors ${
                        selectedTier === tier.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{tier.name}</p>
                          {tier.description && (
                            <p className="text-muted-foreground mt-1 text-xs">{tier.description}</p>
                          )}
                        </div>
                        <span className="font-semibold">${tier.price}</span>
                      </div>
                      {tier.features.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {tier.features.map((feature, idx) => (
                            <li key={idx} className="text-muted-foreground text-xs">
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border-border hover:bg-muted h-10 w-10 rounded-lg border transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="border-border h-10 w-16 rounded-lg border bg-transparent text-center outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="border-border hover:bg-muted h-10 w-10 rounded-lg border transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAddingToCart}
              className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
