'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ArrowLeft, Loader2 } from 'lucide-react';

import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedTier?: string | null;
  selectedPreparation?: string | null;
  selectedVariants?: string[] | null;

  product: {
    id: string;
    name: string;
    basePrice: number;
    images: string[];

    tiers?: Array<{
      id: string;
      name: string;
      price: number;
    }>;

    variants?: Array<{
      id: string;
      name: string;
      value: string;
      priceModifier: number;
    }>;
  };
}

export default function CheckoutPage() {
  const router = useRouter();

  const { user, accessToken } = useAuthStore();

  const { items, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getItemPrice = (item: CartItem) => {
    const selectedTier = item.product.tiers?.find((tier) => tier.name === item.selectedTier);

    return selectedTier?.price ?? item.product.basePrice ?? 0;
  };

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const itemPrice = getItemPrice(item);

    return sum + itemPrice * item.quantity;
  }, 0);

  const shipping = 0;

  const total = subtotal + shipping;

  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/checkout')}`);

      return;
    }

    setFormData((prev) => ({
      ...prev,
      email: user.email || '',
    }));
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F7F4EF] px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-[#231B16]">Your cart is empty</h1>

          <p className="mt-3 text-sm text-[#6F665D]">Add some products to your cart before proceeding to checkout.</p>

          <Link href="/shop" className="bg-brand mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B96A2F]">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');

      return;
    }

    if (!accessToken) {
      toast.error('Your session has expired. Please sign in again.');

      router.push(`/auth/login?redirect=${encodeURIComponent('/checkout')}`);

      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customer/orders', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',

          Authorization: `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
          items,

          shippingAddress: {
            fullName: formData.fullName,

            address: formData.address,

            city: formData.city,

            state: formData.state,

            zipCode: formData.zipCode,

            country: formData.country,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create order');
      }

      const { clientSecret } = data;

      if (!clientSecret) {
        throw new Error('Payment information was not returned.');
      }

      /*
       * Clear the cart after the order
       * has been successfully created.
       */
      clearCart();

      toast.success('Order created. Please complete payment.');

      router.push(`/payment?client_secret=${encodeURIComponent(clientSecret)}`);
    } catch (error) {
      console.error('Checkout error:', error);

      toast.error(error instanceof Error ? error.message : 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F4EF] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back to Cart */}
        <Link href="/cart" className="hover:text-brand mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#6F665D] transition">
          <ArrowLeft size={16} />
          Back to Cart
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h1 className="mb-8 text-3xl font-bold text-[#231B16]">Shipping Information</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>

                <Input value={formData.email} disabled className="bg-muted" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Full Name *</label>

                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" className={errors.fullName ? 'border-red-500' : ''} />

                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Address *</label>

                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main Street" className={errors.address ? 'border-red-500' : ''} />

                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">City *</label>

                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="Lagos" className={errors.city ? 'border-red-500' : ''} />

                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">State *</label>

                  <Input name="state" value={formData.state} onChange={handleInputChange} placeholder="Lagos" className={errors.state ? 'border-red-500' : ''} />

                  {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">ZIP Code *</label>

                  <Input name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="100001" className={errors.zipCode ? 'border-red-500' : ''} />

                  {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Country *</label>

                  <Input name="country" value={formData.country} onChange={handleInputChange} placeholder="Nigeria" className={errors.country ? 'border-red-500' : ''} />

                  {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
                </div>
              </div>

              <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 mt-8 w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-bold text-[#231B16]">Order Summary</h2>

            <div className="bg-muted space-y-4 rounded-lg p-6">
              {items.map((item: CartItem) => {
                const itemPrice = getItemPrice(item);

                return (
                  <div key={item.id} className="border-border flex items-start justify-between border-b pb-4">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>

                      {item.selectedTier && <p className="text-muted-foreground text-sm">Tier: {item.selectedTier}</p>}

                      {item.selectedPreparation && <p className="text-muted-foreground text-sm">Preparation: {item.selectedPreparation}</p>}

                      <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                    </div>

                    <p className="font-medium">${(itemPrice * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>

                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="text-muted-foreground flex justify-between">
                  <span>Shipping</span>

                  <span>Calculated at next step</span>
                </div>

                <div className="border-border flex justify-between border-t pt-4 text-lg font-bold">
                  <span>Total</span>

                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
