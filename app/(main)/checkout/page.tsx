'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CartItem, Address, DeliverySlot, DeliveryDate, DeliveryMethod } from '@/lib/types/checkoutType';
import { ArrowLeft, ArrowRight, Check, Clock3, CreditCard, Edit3, LockKeyhole, MapPin, Minus, Plus, ShoppingBag, Store, Trash2, Truck } from 'lucide-react';

import toast from 'react-hot-toast';

import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';

const STEPS = ['Cart Review', 'Delivery Method', 'Delivery Address', 'Delivery Schedule', 'Review Order', 'Payments'];

const deliverySlots: DeliverySlot[] = [
  {
    id: '8-10',
    label: '8:00 – 10:00 AM',
    subtitle: 'Early morning',
    price: 0,
  },
  {
    id: '10-12',
    label: '10:00 – 12:00 PM',
    subtitle: 'Late morning',
    price: 0,
  },
  {
    id: '12-2',
    label: '12:00 – 2:00 PM',
    subtitle: 'Midday',
    price: 0,
    disabled: true,
  },
  {
    id: '2-4',
    label: '2:00 – 4:00 PM',
    subtitle: 'Afternoon',
    price: 0,
  },
  {
    id: '4-6',
    label: '4:00 – 6:00 PM',
    subtitle: 'Early evening',
    price: 2.5,
  },
  {
    id: '6-8',
    label: '6:00 – 8:00 PM',
    subtitle: 'Evening',
    price: 4,
  },
];

function getDeliveryDates(): DeliveryDate[] {
  const dates: DeliveryDate[] = [];

  const today = new Date();

  for (let i = 1; i <= 9; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() + i);

    dates.push({
      value: date.toISOString().split('T')[0],

      day: date.toLocaleDateString('en-US', {
        weekday: 'short',
      }),

      date: date.toLocaleDateString('en-US', {
        day: 'numeric',
      }),

      month: date.toLocaleDateString('en-US', {
        month: 'short',
      }),
    });
  }

  return dates;
}
const money = (value: number) => `$${value.toFixed(2)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [dateOptions] = useState<DeliveryDate[]>(getDeliveryDates);
  const [selectedDate, setSelectedDate] = useState(() => getDeliveryDates()[0]?.value ?? '');
  const [selectedSlot, setSelectedSlot] = useState('10-12');
  const [notes, setNotes] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    phone: '',
    isDefault: false,
  });

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

  const subtotal = useMemo(() => {
    return items.reduce((sum: number, item: CartItem) => {
      return sum + getItemPrice(item) * item.quantity;
    }, 0);
  }, [items]);

  const selectedSlotData = deliverySlots.find((slot) => slot.id === selectedSlot) ?? deliverySlots[1];
  const deliveryFee = deliveryMethod === 'home' ? 9.5 + selectedSlotData.price : 0;
  const discount = subtotal * 0.1;
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxes = taxableAmount * 0.087;
  const total = subtotal + deliveryFee - discount + taxes;
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;

  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }
    setFormData((previous) => ({
      ...previous,
      email: user.email || '',
    }));
  }, [user, router]);

  useEffect(() => {
    if (!accessToken) return;
    const loadAddresses = async () => {
      try {
        setAddressesLoading(true);
        const response = await fetch('/api/customer/addresses', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load addresses');
        }
        const loadedAddresses: Address[] = data.addresses ?? [];
        setAddresses(loadedAddresses);
        const defaultAddress = loadedAddresses.find((address) => address.isDefault) ?? loadedAddresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);

          setFormData({
            email: user?.email || '',
            fullName: defaultAddress.fullName,
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode,
            country: defaultAddress.country,
          });

          setShowNewAddressForm(false);
        } else {
          setShowNewAddressForm(true);
        }
      } catch (error) {
        console.error('Address loading error:', error);
        setAddresses([]);

        setShowNewAddressForm(true);

        toast.error(error instanceof Error ? error.message : 'Could not load your saved addresses. Please enter your delivery address below.');
      } finally {
        setAddressesLoading(false);
      }
    };

    loadAddresses();
  }, [accessToken, user?.email]);

  useEffect(() => {
    if (!selectedAddress) return;

    setFormData((previous) => ({
      ...previous,
      fullName: selectedAddress.fullName,
      address: selectedAddress.address,
      city: selectedAddress.city,
      state: selectedAddress.state,
      zipCode: selectedAddress.zipCode,
      country: selectedAddress.country,
    }));
  }, [selectedAddressId]);

  if (!user) {
    return null;
  }
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <ShoppingBag className="text-brand mx-auto mb-5 h-12 w-12" />
          <h1 className="text-3xl font-bold text-[#2A2521]">Your cart is empty</h1>
          <p className="mt-3 text-sm text-[#7E746A]">Add some cuts to your cart before proceeding to checkout.</p>
          <Link href="/shop" className="bg-brand mt-8 inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const validateAddress = () => {
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: '',
      }));
    }
  };

  const createAddress = async () => {
    if (!accessToken) {
      toast.error('Your session has expired.');

      return;
    }

    if (!newAddress.fullName.trim() || !newAddress.address.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.zipCode.trim() || !newAddress.country.trim() || !newAddress.phone.trim()) {
      toast.error('Please complete all address fields.');

      return;
    }

    try {
      setAddressSaving(true);

      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          Authorization: `Bearer ${accessToken}`,
        },

        body: JSON.stringify(newAddress),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create address');
      }

      const createdAddress: Address = data.address;
      setAddresses((previous) => [createdAddress, ...previous.filter((address) => address.id !== createdAddress.id)]);
      setSelectedAddressId(createdAddress.id);
      setShowNewAddressForm(false);
      toast.success('Address saved');
    } catch (error) {
      console.error('Create address error:', error);

      toast.error(error instanceof Error ? error.message : 'Failed to create address');
    } finally {
      setAddressSaving(false);
    }
  };
  const handleSubmit = async () => {
    if (!validateAddress()) {
      setStep(3);

      toast.error('Please complete your delivery address');

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
          items: items.map((item: CartItem) => item.id),

          shippingAddress: `${formData.fullName}, ${formData.address}`,

          shippingCity: formData.city,

          shippingState: formData.state,

          shippingZip: formData.zipCode,

          shippingCountry: formData.country,

          deliveryMethod,

          deliveryDate: selectedDate,

          deliverySlot: selectedSlot,

          deliveryNotes: notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create order');
      }

      const { authorizationUrl } = data;

      if (!authorizationUrl) {
        throw new Error('Payment link was not returned.');
      }

      clearCart();

      toast.success('Order created. Redirecting to Paystack...');

      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Checkout error:', error);

      toast.error(error instanceof Error ? error.message : 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 3) {
      if (!validateAddress()) {
        toast.error('Please complete your delivery address');

        return;
      }
    }

    setStep((current) => Math.min(6, current + 1));
  };

  const previousStep = () => {
    setStep((current) => Math.max(1, current - 1));
  };

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-8 text-[#2A2521] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-280">
        <CheckoutProgress step={step} />

        <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_292px]">
          <section>
            {step === 1 && <CartReview items={items as CartItem[]} getItemPrice={getItemPrice} />}

            {step === 2 && <DeliveryMethodStep value={deliveryMethod} onChange={setDeliveryMethod} />}

            {step === 3 && <DeliveryAddressStep addresses={addresses} loading={addressesLoading} selectedAddressId={selectedAddressId} onSelect={setSelectedAddressId} showNewAddressForm={showNewAddressForm} onShowNewAddressForm={() => setShowNewAddressForm(true)} newAddress={newAddress} setNewAddress={setNewAddress} onCreateAddress={createAddress} addressSaving={addressSaving} />}

            {step === 4 && <DeliveryScheduleStep dates={dateOptions} selectedDate={selectedDate} selectedSlot={selectedSlot} notes={notes} onDateChange={setSelectedDate} onSlotChange={setSelectedSlot} onNotesChange={setNotes} />}

            {step === 5 && <ReviewOrder items={items as CartItem[]} getItemPrice={getItemPrice} address={selectedAddress} deliveryMethod={deliveryMethod} slot={selectedSlotData} selectedDate={selectedDate} onEdit={setStep} />}

            {step === 6 && <PaymentStep total={total} email={formData.email} loading={loading} onPay={handleSubmit} />}

            <div className="mt-7 flex items-center justify-between border-t border-[#E7DED3] pt-5">
              <button type="button" onClick={previousStep} disabled={step === 1 || loading} className="inline-flex items-center gap-2 text-xs font-medium text-[#776E65] disabled:invisible">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <span className="text-ink text-[10px]">Step {step} of 6</span>

              {step < 5 && (
                <button type="button" onClick={nextStep} className="bg-brand inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {step === 5 && (
                <button type="button" onClick={nextStep} className="bg-brand inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white">
                  Continue to Payment
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {step === 6 && <span className="w-28" />}
            </div>
          </section>

          <OrderSummary
            items={items as CartItem[]}
            getItemPrice={getItemPrice}
            subtotal={subtotal}
            delivery={deliveryFee}
            discount={discount}
            taxes={taxes}
            total={total}
            step={step}
            loading={loading}
            onContinue={() => {
              if (step < 6) {
                nextStep();
              } else {
                handleSubmit();
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
function CheckoutProgress({ step }: { step: number }) {
  return (
    <div className="mx-auto max-w-190">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-2.75 right-5.5 left-5.5 h-px bg-[#E6DDD2]" />

        {STEPS.map((label, index) => {
          const number = index + 1;

          const completed = number < step;

          const active = number === step;

          return (
            <div key={label} className="relative z-10 flex w-23 flex-col items-center gap-2">
              <div className={['flex h-5.5 w-5.5 items-center justify-center rounded-full border text-[9px] font-medium', completed ? 'border-brand bg-brand text-white' : active ? 'border-brand text-brand bg-[#FFF9F5]' : 'border-[#E7DED3] bg-[#FCFBF8] text-[#B7ADA2]'].join(' ')}>{completed ? <Check className="h-3 w-3" /> : number}</div>

              <span className={['text-[9px] whitespace-nowrap', active || completed ? 'font-medium text-[#403832]' : 'text-[#AAA096]'].join(' ')}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function DeliveryAddressStep({
  addresses,
  loading,
  selectedAddressId,
  onSelect,
  showNewAddressForm,
  onShowNewAddressForm,
  newAddress,
  setNewAddress,
  onCreateAddress,
  addressSaving,
}: {
  addresses: Address[];
  loading: boolean;
  selectedAddressId: string;
  onSelect: (id: string) => void;
  showNewAddressForm: boolean;
  onShowNewAddressForm: () => void;
  newAddress: Omit<Address, 'id' | 'isDefault'> & {
    isDefault: boolean;
  };
  setNewAddress: React.Dispatch<
    React.SetStateAction<
      Omit<Address, 'id' | 'isDefault'> & {
        isDefault: boolean;
      }
    >
  >;
  onCreateAddress: () => void;
  addressSaving: boolean;
}) {
  return (
    <>
      <PageHeading eyebrow="Step 3 of 6" title="Where should we deliver?" description="Pick a saved address or add a new one. We'll text you when the driver is 15 minutes away." />

      {loading ? (
        <div className="rounded-xl border border-[#E7DED3] bg-white p-8 text-center text-xs text-[#8B8177]">Loading your saved addresses…</div>
      ) : (
        <>
          {addresses.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {addresses.map((address) => {
                const selected = selectedAddressId === address.id;

                return (
                  <button key={address.id} type="button" onClick={() => onSelect(address.id)} className={['rounded-xl border bg-white p-4 text-left transition', selected ? 'border-brand shadow-[0_8px_24px_rgba(62,43,30,0.05)]' : 'border-[#E7DED3]'].join(' ')}>
                    <div className="flex gap-3">
                      <span className={['mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', selected ? 'border-brand bg-brand' : 'border-[#E2D8CD]'].join(' ')}>{selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>

                      <span>
                        <span className="flex items-center gap-2 text-[11px] font-bold">
                          {address.label}

                          {address.isDefault && <span className="rounded bg-[#F3EEE8] px-1.5 py-0.5 text-[7px] font-medium text-[#8C8177]">Default</span>}
                        </span>

                        <span className="mt-2 block text-[9px] leading-4 text-[#857B71]">
                          {address.fullName}
                          <br />
                          {address.address}
                          <br />
                          {address.city}, {address.state} {address.zipCode}
                          <br />
                          {address.phone}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!showNewAddressForm && (
            <button type="button" onClick={onShowNewAddressForm} className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#E7DED3] bg-white p-4 text-left">
              <span className="bg-brand flex h-7 w-7 items-center justify-center rounded-full text-white">+</span>

              <span>
                <span className="block text-[11px] font-bold">Add a new address</span>

                <span className="text-ink block text-[8px]">Deliver this order somewhere else</span>
              </span>
            </button>
          )}

          {showNewAddressForm && (
            <div className="mt-3 rounded-xl border border-[#E7DED3] bg-white p-4">
              <div className="mb-4">
                <h3 className="text-[12px] font-bold">Add a new address</h3>

                <p className="text-ink mt-1 text-[8px]">This address will be saved to your account.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['label', 'Label'],
                  ['fullName', 'Full name'],
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['state', 'State'],
                  ['zipCode', 'ZIP code'],
                  ['country', 'Country'],
                  ['phone', 'Phone'],
                ].map(([name, label]) => (
                  <label key={name} className="block">
                    <span className="mb-1.5 block text-[9px] font-medium text-[#655C54]">{label}</span>

                    <input
                      value={newAddress[name as keyof typeof newAddress] as string}
                      onChange={(event) =>
                        setNewAddress((previous) => ({
                          ...previous,

                          [name]: event.target.value,
                        }))
                      }
                      className="focus:border-brand h-9 w-full rounded-lg border border-[#E6DDD2] bg-[#FCFBF9] px-3 text-[10px] outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {addresses.length > 0 && (
                  <button type="button" onClick={() => onShowNewAddressForm()} className="rounded-lg border border-[#E7DED3] px-4 py-2 text-[9px] font-medium">
                    Cancel
                  </button>
                )}

                <button type="button" onClick={onCreateAddress} disabled={addressSaving} className="bg-brand rounded-lg px-4 py-2 text-[9px] font-semibold text-white disabled:opacity-60">
                  {addressSaving ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
function DeliveryScheduleStep({ dates, selectedDate, selectedSlot, notes, onDateChange, onSlotChange, onNotesChange }: { dates: DeliveryDate[]; selectedDate: string; selectedSlot: string; notes: string; onDateChange: (value: string) => void; onSlotChange: (value: string) => void; onNotesChange: (value: string) => void }) {
  return (
    <>
      <PageHeading eyebrow="Step 4 of 6" title="Pick a delivery window" description="Choose the day and two-hour window that suits you. You can reschedule up to 12 hours before." />

      <p className="text-ink mb-2 text-[8px] font-semibold tracking-[0.18em] uppercase">Date</p>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
        {dates.map((date) => {
          const selected = selectedDate === date.value;

          return (
            <button key={date.value} type="button" onClick={() => onDateChange(date.value)} className={['rounded-xl border px-2 py-2.5 text-center transition', selected ? 'border-brand bg-brand text-white' : 'border-[#E7DED3] bg-white text-[#4A423B]'].join(' ')}>
              <span className="block text-[8px]">{date.day}</span>

              <strong className="mt-0.5 block text-[14px] leading-none">{date.date}</strong>

              <span className="mt-1 block text-[7px]">{date.month}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-ink mb-2 text-[8px] font-semibold tracking-[0.18em] uppercase">Time slot</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {deliverySlots.map((slot) => {
            const selected = selectedSlot === slot.id;

            return (
              <button key={slot.id} type="button" disabled={slot.disabled} onClick={() => onSlotChange(slot.id)} className={['flex min-h-[51px] items-center justify-between rounded-xl border px-3 text-left', slot.disabled ? 'cursor-not-allowed border-[#EEE8E0] bg-[#FAF8F5] text-[#B8AEA4]' : selected ? 'border-brand bg-white' : 'border-[#E7DED3] bg-white'].join(' ')}>
                <span>
                  <span className="block text-[10px] font-semibold">{slot.label}</span>

                  <span className="text-ink mt-0.5 block text-[8px]">{slot.subtitle}</span>
                </span>

                <span className="text-brand text-[8px] font-semibold">{slot.disabled ? 'Fully booked' : slot.price ? `+$${slot.price.toFixed(2)}` : 'Free'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-ink mb-2 flex items-center gap-1.5 text-[8px] font-semibold tracking-[0.14em] uppercase">
          <Clock3 className="text-brand h-3 w-3" />
          Notes for the butcher or driver
        </span>

        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={3} className="focus:border-brand w-full resize-none rounded-xl border border-[#E7DED3] bg-white px-3 py-3 text-[10px] outline-none" placeholder="Leave with the concierge, chuck it on the..." />
      </label>
    </>
  );
}
function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-7">
      <p className="text-brand mb-1.5 text-[9px] font-bold tracking-[0.18em] uppercase">{eyebrow}</p>

      <h1 className="text-[25px] leading-tight font-bold tracking-[-0.03em]">{title}</h1>

      <p className="mt-2 max-w-155 text-[11px] leading-5 text-[#857B71]">{description}</p>
    </header>
  );
}
function ProductImage({ item, small = false }: { item: CartItem; small?: boolean }) {
  return (
    <div className={['shrink-0 overflow-hidden rounded-xl border border-[#E9E0D7] bg-[#F2ECE5]', small ? 'h-9 w-9' : 'h-14 w-14'].join(' ')}>
      {item.product.images?.[0] ? (
        <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ShoppingBag className="h-4 w-4 text-[#B0A59A]" />
        </div>
      )}
    </div>
  );
}
function CartReview({ items, getItemPrice }: { items: CartItem[]; getItemPrice: (item: CartItem) => number }) {
  return (
    <>
      <PageHeading eyebrow="Step 1 of 6" title="Review your cuts" description="Everything is butchered to order the morning of delivery. Adjust quantities before you continue." />

      <div className="overflow-hidden rounded-2xl border border-[#E7DED3] bg-white">
        {items.map((item, index) => (
          <div key={item.id} className={['flex min-h-22 items-center gap-4 px-4 py-3.5 sm:px-5', index < items.length - 1 ? 'border-b border-[#EEE7DE]' : ''].join(' ')}>
            <ProductImage item={item} />

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[11px] font-bold">{item.product.name}</h3>

              <p className="text-ink mt-1 text-[9px]">
                {item.selectedPreparation}
                {item.selectedTier ? ` · ${item.selectedTier}` : ''}
              </p>

              <p className="mt-2 text-[9px] text-[#6E655C]">{money(getItemPrice(item))}</p>
            </div>

            <div className="hidden items-center rounded-full border border-[#E8DED4] bg-[#FCFAF7] sm:flex">
              <button type="button" className="flex h-7 w-7 items-center justify-center">
                <Minus className="h-3 w-3" />
              </button>

              <span className="w-6 text-center text-[10px]">{item.quantity}</span>

              <button type="button" className="flex h-7 w-7 items-center justify-center">
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="text-brand w-18.75 text-right text-[11px] font-bold">{money(getItemPrice(item) * item.quantity)}</div>

            <Trash2 className="text-brand h-4 w-4" />
          </div>
        ))}
      </div>
    </>
  );
}
function DeliveryMethodStep({ value, onChange }: { value: DeliveryMethod; onChange: (value: DeliveryMethod) => void }) {
  return (
    <>
      <PageHeading eyebrow="Step 2 of 6" title="How would you like it?" description="Both options keep your order under 4°C from our counter to your kitchen." />

      <div className="space-y-3">
        {[
          {
            id: 'home' as const,
            title: 'Home Delivery',
            icon: Truck,
            price: '$9.50',
            description: 'Collect from a ChunkNChop rider. Kept chilled until you pickup.',
            meta: 'Arrives in a 2-hour window',
          },
          {
            id: 'pickup' as const,
            title: 'Store Pickup',
            icon: Store,
            price: 'Free',
            description: 'Collect from a ChunkNChop counter. Kept fresh until you arrive.',
            meta: 'Ready the same day',
          },
        ].map((method) => {
          const selected = value === method.id;

          const Icon = method.icon;

          return (
            <button key={method.id} type="button" onClick={() => onChange(method.id)} className={['block w-full rounded-xl border bg-white p-4 text-left', selected ? 'border-brand' : 'border-[#E7DED3]'].join(' ')}>
              <div className="flex gap-3">
                <span className={['mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-brand bg-brand' : 'border-[#E3D9CE]'].join(' ')}>{selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>

                <span className="text-brand flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF0E9]">
                  <Icon className="h-4 w-4" />
                </span>

                <span className="flex-1">
                  <span className="flex justify-between">
                    <span className="text-[11px] font-bold">{method.title}</span>

                    <span className="text-[10px] font-bold">{method.price}</span>
                  </span>

                  <span className="mt-2 block text-[9px] text-[#8B8177]">{method.description}</span>

                  <span className="text-ink mt-1.5 flex items-center gap-1 text-[8px]">
                    <Clock3 className="h-2.5 w-2.5" />
                    {method.meta}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
function PaymentStep({ total, email, loading, onPay }: { total: number; email: string; loading: boolean; onPay: () => void }) {
  return (
    <>
      <PageHeading eyebrow="Step 6 of 6" title="Ready to pay?" description="You'll be securely redirected to Paystack to choose your preferred payment method." />

      <div className="rounded-2xl border border-[#E7DED3] bg-white p-6">
        <div className="mx-auto max-w-md text-center">
          <div className="text-brand mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0E9]">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-[17px] font-bold">Secure payment</h2>

          <p className="mt-2 text-[10px] leading-5 text-[#857B71]">Your payment details are entered directly on Paystack&apos;s secure checkout.</p>

          <div className="mt-6 rounded-xl bg-[#FCFAF7] p-4 text-left">
            <div className="flex justify-between text-[9px]">
              <span className="text-[#857B71]">Email</span>

              <span>{email}</span>
            </div>

            <div className="mt-3 flex justify-between border-t border-[#EAE2D8] pt-3">
              <span className="text-[10px] font-semibold">Amount due</span>

              <span className="text-[17px] font-bold">{money(total)}</span>
            </div>
          </div>

          <button type="button" onClick={onPay} disabled={loading} className="bg-brand mt-5 h-11 w-full rounded-xl text-[11px] font-bold text-white disabled:opacity-60">
            {loading ? 'Creating order…' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </>
  );
}
function ReviewOrder({ items, getItemPrice, address, deliveryMethod, slot, selectedDate, onEdit }: { items: CartItem[]; getItemPrice: (item: CartItem) => number; address: Address | null; deliveryMethod: DeliveryMethod; slot: DeliverySlot; selectedDate: string; onEdit: (step: number) => void }) {
  const date = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;

  const formattedDate = date?.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <PageHeading eyebrow="Step 5 of 6" title="One last look" description="Confirm the details below, then place your order. You'll get a receipt and live tracking by text." />

      <div className="rounded-xl border border-[#E7DED3] bg-white p-5">
        <div className="mb-4 flex justify-between">
          <span className="text-ink text-[8px] font-semibold tracking-[0.18em] uppercase">Your cuts</span>

          <button type="button" onClick={() => onEdit(1)} className="text-brand flex items-center gap-1 text-[9px]">
            <Edit3 className="h-3 w-3" />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <ProductImage item={item} small />

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium">{item.product.name}</p>

                <p className="text-[8px] text-[#958B80]">{item.quantity} × per pack</p>
              </div>

              <span className="text-brand text-[10px] font-bold">{money(getItemPrice(item) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E7DED3] bg-white p-4">
          <div className="mb-3 flex justify-between">
            <span className="text-ink text-[8px] font-semibold tracking-[0.16em] uppercase">Delivery address</span>

            <button type="button" onClick={() => onEdit(3)} className="text-brand text-[9px]">
              Edit
            </button>
          </div>

          {address ? (
            <div className="text-[9px] leading-4 text-[#786F66]">
              <p>{address.fullName}</p>

              <p>{address.address}</p>

              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
            </div>
          ) : (
            <p className="text-[9px] text-red-500">No address selected</p>
          )}
        </div>

        <div className="rounded-xl border border-[#E7DED3] bg-white p-4">
          <div className="mb-3 flex justify-between">
            <span className="text-ink text-[8px] font-semibold tracking-[0.16em] uppercase">Delivery method</span>

            <button type="button" onClick={() => onEdit(2)} className="text-brand text-[9px]">
              Edit
            </button>
          </div>

          <p className="text-[9px] font-medium">{deliveryMethod === 'home' ? 'Home Delivery' : 'Store Pickup'}</p>

          <p className="mt-1 text-[9px] text-[#786F66]">{deliveryMethod === 'home' ? '$9.50 delivery' : 'Free pickup'}</p>
        </div>

        <div className="rounded-xl border border-[#E7DED3] bg-white p-4">
          <div className="mb-3 flex justify-between">
            <span className="text-ink text-[8px] font-semibold tracking-[0.16em] uppercase">Schedule</span>

            <button type="button" onClick={() => onEdit(4)} className="text-brand text-[9px]">
              Edit
            </button>
          </div>

          <p className="text-[9px] font-medium">{formattedDate}</p>

          <p className="mt-1 text-[9px] text-[#786F66]">{slot.label}</p>
        </div>

        <div className="rounded-xl border border-[#E7DED3] bg-white p-4">
          <div className="mb-3 flex justify-between">
            <span className="text-ink text-[8px] font-semibold tracking-[0.16em] uppercase">Payment</span>

            <button type="button" onClick={() => onEdit(6)} className="text-brand text-[9px]">
              Edit
            </button>
          </div>

          <p className="text-[9px] font-medium">Paystack</p>

          <p className="mt-1 text-[9px] text-[#786F66]">Card, bank transfer, USSD & more</p>
        </div>
      </div>
    </>
  );
}
function OrderSummary({ items, getItemPrice, subtotal, delivery, discount, taxes, total, step, onContinue, loading }: { items: CartItem[]; getItemPrice: (item: CartItem) => number; subtotal: number; delivery: number; discount: number; taxes: number; total: number; step: number; onContinue: () => void; loading: boolean }) {
  return (
    <aside className="rounded-xl border border-[#E7DED3] bg-white p-4 shadow-[0_8px_28px_rgba(61,45,31,0.08)] sm:p-5">
      <div className="mb-4 flex justify-between">
        <h2 className="text-[15px] font-bold">Order Summary</h2>

        <span className="text-ink text-[8px]">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <ProductImage item={item} small />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-medium">{item.product.name}</p>

              <p className="text-ink mt-0.5 text-[7px]">{item.quantity} × per pack</p>
            </div>

            <span className="text-[9px]">{money(getItemPrice(item) * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-[#EEE7DE]" />

      <div className="space-y-2.5 text-[9px]">
        <div className="flex justify-between">
          <span className="text-[#857B71]">Products</span>
          <span>{money(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#857B71]">Delivery</span>
          <span>{money(delivery)}</span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-[#857B71]">
            Discount
            <span className="text-brand rounded-full bg-[#FFF0E9] px-1.5 py-0.5 text-[7px] font-bold">CHOP10</span>
          </span>

          <span className="text-brand">− {money(discount)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#857B71]">Taxes</span>

          <span>{money(taxes)}</span>
        </div>
      </div>

      <div className="my-4 border-t border-[#EEE7DE]" />

      <div className="flex items-end justify-between">
        <span className="text-[10px] font-bold">Total</span>

        <span className="text-[20px] font-bold">{money(total)}</span>
      </div>

      <button type="button" onClick={onContinue} disabled={loading} className="bg-brand mt-4 h-10 w-full rounded-xl text-[10px] font-bold text-white disabled:opacity-60">
        {loading ? 'Processing…' : step >= 6 ? 'Proceed to Payment' : 'Continue'}
      </button>

      <div className="text-ink mt-3 flex items-center justify-center gap-1.5 text-center text-[7px]">
        <LockKeyhole className="h-2.5 w-2.5" />
        Encrypted payment · Free returns on quality issues
      </div>
    </aside>
  );
}
