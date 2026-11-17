'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Pencil,
  ShieldCheck,
  Store,
  Truck,
  LoaderCircle,
  Tag,
  X,
} from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/catalog';

type CheckoutResponse = {
  orderNumber: string;
  authorizationUrl: string;
};

type CouponValidationResponse = {
  code: string;
  discountCents: number;
  message: string;
};

type DeliveryMethod = 'home' | 'pickup';

type Address = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
};

type AppliedCoupon = {
  code: string;
  discountCents: number;
};

const initialAddress: Address = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
};

const HOME_DELIVERY_FEE = 950;

const steps = [
  'Cart Review',
  'Delivery Method',
  'Delivery Address',
  'Delivery Schedule',
  'Review Order',
  'Payment',
];

const timeSlots = [
  { value: '8:00 AM – 10:00 AM', label: 'Early morning', fee: 0 },
  { value: '10:00 AM – 12:00 PM', label: 'Late morning', fee: 0 },
  { value: '12:00 PM – 2:00 PM', label: 'Midday', fee: 0 },
  { value: '2:00 PM – 4:00 PM', label: 'Afternoon', fee: 0 },
  { value: '4:00 PM – 6:00 PM', label: 'Early evening', fee: 250 },
  { value: '6:00 PM – 8:00 PM', label: 'Evening', fee: 400 },
];

const deliveryMethods = [
  {
    value: 'home' as const,
    title: 'Home delivery',
    price: formatPrice(HOME_DELIVERY_FEE * 100),
    description: 'Delivered by a ChunknChop rider and kept chilled until it reaches you.',
    note: 'Arrives in a 2-hour window',
    Icon: Truck,
  },
  {
    value: 'pickup' as const,
    title: 'Store pickup',
    price: 'Free',
    description: 'Collect from a ChunknChop counter. Kept fresh until you arrive.',
    note: 'Ready for collection',
    Icon: Store,
  },
];

const container = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8';

const card = 'border border-[#eae7e1] bg-white';

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 bg-brand px-5 py-2.5 text-[10px] font-bold tracking-[0.04em] text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-50';

const editLink =
  'cursor-pointer border-0 bg-transparent p-0 text-[10px] font-semibold text-brand hover:text-[#a9442c]';

const inputClass =
  'w-full min-w-0 border border-[#e9e6df] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-brand focus:ring-2 focus:ring-brand/10';

const labelClass = 'flex min-w-0 flex-col gap-1.5 text-[10px] font-semibold text-[#5c5851]';

const sectionLabel = 'mb-3 text-[9px] font-bold tracking-[0.13em] text-[#88847d]';

function getDateOptions() {
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      value: date.toLocaleDateString('en-CA'),
      day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      number: date.getDate(),
      month: date.toLocaleDateString('en-GB', { month: 'short' }),
    };
  });
}

function itemLabel(count: number) {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function FullPage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-5 text-[#24231f]">
      {children}
    </main>
  );
}

export default function CheckoutPageClient() {
  const { user, isLoading: sessionPending } = useAuth();

  const { items, subtotalCents, cartCount, isLoading: cartLoading } = useCart();

  const dates = useMemo(() => getDateOptions(), []);

  const [step, setStep] = useState(2);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [address, setAddress] = useState<Address>(initialAddress);
  const [selectedDate, setSelectedDate] = useState(() => dates[0].value);
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[1].value);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const checkoutRequestId = useRef<string | null>(null);

  const selectedTimeSlot = timeSlots.find((slot) => slot.value === selectedSlot);

  const deliveryFee =
    deliveryMethod === 'pickup' ? 0 : HOME_DELIVERY_FEE + (selectedTimeSlot?.fee ?? 0);

  const deliveryLabel = deliveryFee ? formatPrice(deliveryFee * 100) : 'Free';

  const couponDiscountCents = appliedCoupon?.discountCents ?? 0;

  const totalCents = Math.max(0, subtotalCents - couponDiscountCents + deliveryFee * 100);

  const showAddress = deliveryMethod === 'home';

  function invalidateCheckoutRequest() {
    checkoutRequestId.current = null;
  }

  function updateAddress(field: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    invalidateCheckoutRequest();
  }

  function goToStep(nextStep: number) {
    setError('');
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateAddress() {
    const requiredFields: (keyof Address)[] = [
      'fullName',
      'phone',
      'addressLine1',
      'city',
      'region',
      'postalCode',
    ];

    if (requiredFields.some((field) => !address[field].trim())) {
      setError('Please complete all required delivery address fields.');
      return false;
    }

    if (address.fullName.trim().length < 2) {
      setError('Please enter a valid full name.');
      return false;
    }

    if (address.phone.trim().length < 7) {
      setError('Please enter a valid phone number.');
      return false;
    }

    if (address.addressLine1.trim().length < 4) {
      setError('Please enter a valid delivery address.');
      return false;
    }

    return true;
  }

  function next() {
    if (step === 3 && showAddress && !validateAddress()) return;
    goToStep(step + 1);
  }

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = (await response.json().catch(() => null)) as
        CouponValidationResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(
          result && 'error' in result && result.error
            ? result.error
            : 'Unable to apply this coupon.',
        );
      }

      if (
        !result ||
        !('code' in result) ||
        typeof result.discountCents !== 'number' ||
        result.discountCents <= 0
      ) {
        throw new Error('The coupon response was invalid.');
      }

      setAppliedCoupon({
        code: result.code,
        discountCents: result.discountCents,
      });

      setCouponInput(result.code);
      setCouponError('');
      invalidateCheckoutRequest();
    } catch (couponRequestError) {
      setAppliedCoupon(null);
      setCouponError(
        couponRequestError instanceof Error
          ? couponRequestError.message
          : 'Unable to apply this coupon.',
      );
      invalidateCheckoutRequest();
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    invalidateCheckoutRequest();
  }

  async function placeOrder() {
    if (showAddress && !validateAddress()) {
      goToStep(3);
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setError('');
    checkoutRequestId.current ??= crypto.randomUUID();

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...address,
          deliveryMethod,
          deliveryDate: selectedDate,
          deliveryWindow: selectedSlot,
          deliveryNotes: notes,
          couponCode: appliedCoupon?.code,
          checkoutRequestId: checkoutRequestId.current,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'We couldn’t place your order. Please try again.');
      }

      const checkout = result as CheckoutResponse;

      if (!checkout.authorizationUrl) {
        throw new Error('Paystack did not return a checkout link.');
      }

      window.location.assign(checkout.authorizationUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We couldn’t place your order. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionPending || cartLoading) {
    return (
      <FullPage>
        <div className="flex items-center gap-2.5 text-[11px] text-[#77736d]">
          <LoaderCircle size={16} className="animate-spin text-brand" />
          Loading your checkout…
        </div>
      </FullPage>
    );
  }

  if (!user) {
    return (
      <FullPage>
        <div className="w-full max-w-md text-center">
          <p className="mb-2 text-[9px] font-bold tracking-[0.15em] text-brand">SIGN IN REQUIRED</p>
          <h1 className="m-0 font-heading text-2xl font-semibold">Sign in to check out.</h1>
          <p className="mt-3 text-[12px] leading-6 text-[#77736d]">
            Your bag is saved to your account. Sign in to continue with your order.
          </p>
          <Link href="/sign-in?returnTo=/checkout" className={`${primaryButton} mt-5`}>
            Sign in to continue <ArrowRight size={13} />
          </Link>
        </div>
      </FullPage>
    );
  }

  if (items.length === 0) {
    return (
      <FullPage>
        <div className="w-full max-w-md text-center">
          <h1 className="m-0 font-heading text-2xl font-semibold">Your bag is empty.</h1>
          <p className="mt-2 text-[12px] text-[#77736d]">Add some cuts before starting checkout.</p>
          <Link href="/shop" className={`${primaryButton} mt-5`}>
            Explore the cuts <ArrowRight size={13} />
          </Link>
        </div>
      </FullPage>
    );
  }

  const stepContent: Record<number, { title: string; text: string }> = {
    2: {
      title: 'How would you like it?',
      text: 'Choose home delivery or collect your order from our counter.',
    },
    3: {
      title: showAddress ? 'Where should we deliver?' : 'Your pickup details',
      text: showAddress
        ? 'Add the address where you would like your order delivered.'
        : 'No address is needed for store pickup.',
    },
    4: showAddress
      ? {
          title: 'Pick a delivery window',
          text: 'Choose your preferred day and two-hour delivery window.',
        }
      : {
          title: 'Add a note',
          text: 'Leave any instructions for our butchers.',
        },
    5: {
      title: 'One last look',
      text: 'Confirm your order details before you pay.',
    },
    6: {
      title: 'Ready to pay',
      text: 'Continue to Paystack to complete your payment securely.',
    },
  };

  const textFields: {
    field: keyof Address;
    label: string;
    autoComplete: string;
    maxLength: number;
    placeholder: string;
    type?: string;
    full?: boolean;
    optional?: boolean;
  }[] = [
    {
      field: 'fullName',
      label: 'Full name',
      autoComplete: 'name',
      maxLength: 100,
      placeholder: 'Your full name',
    },
    {
      field: 'phone',
      label: 'Phone number',
      autoComplete: 'tel',
      maxLength: 32,
      placeholder: '+234…',
      type: 'tel',
    },
    {
      field: 'addressLine1',
      label: 'Address line 1',
      autoComplete: 'address-line1',
      maxLength: 160,
      placeholder: 'Street address and house number',
      full: true,
    },
    {
      field: 'addressLine2',
      label: 'Address line 2',
      autoComplete: 'address-line2',
      maxLength: 160,
      placeholder: 'Apartment, suite, landmark…',
      full: true,
      optional: true,
    },
    {
      field: 'city',
      label: 'City',
      autoComplete: 'address-level2',
      maxLength: 80,
      placeholder: 'City',
    },
    {
      field: 'region',
      label: 'State / region',
      autoComplete: 'address-level1',
      maxLength: 80,
      placeholder: 'State',
    },
    {
      field: 'postalCode',
      label: 'Postal code',
      autoComplete: 'postal-code',
      maxLength: 20,
      placeholder: 'Postal code',
      full: true,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <div className={`${container} py-6 sm:py-8 lg:py-10`}>
        <ol
          className="relative mb-7 grid list-none grid-cols-6 p-0 sm:mb-9"
          aria-label="Checkout progress"
        >
          <span className="absolute top-3 right-[8.33%] left-[8.33%] h-px bg-[#e9e6df]" />
          {steps.map((label, index) => {
            const number = index + 1;
            const completed = number < step;
            const active = number === step;

            return (
              <li
                key={label}
                aria-current={active ? 'step' : undefined}
                className="relative flex min-w-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-semibold ${
                    completed
                      ? 'border-brand bg-brand text-white'
                      : active
                        ? 'border-brand bg-white text-brand'
                        : 'border-[#e9e6df] bg-white text-[#aaa69e]'
                  }`}
                >
                  {completed ? <Check size={11} /> : number}
                </span>
                <span
                  className={`hidden max-w-full px-1 text-center text-[9px] leading-tight md:block ${
                    active ? 'font-semibold text-[#24231f]' : 'text-[#88847d]'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] lg:gap-7">
          <section className="min-w-0">
            <div className="mb-5">
              <p className="mb-1.5 flex items-center gap-2 text-[9px] font-bold tracking-[0.13em] text-[#77736d]">
                <span className="h-px w-4 bg-brand" />
                STEP {step} OF 6 · {steps[step - 1].toUpperCase()}
              </p>
              <h1 className="m-0 font-heading text-[23px] leading-tight font-semibold tracking-tight sm:text-[27px]">
                {stepContent[step].title}
              </h1>
              <p className="mt-1.5 mb-0 max-w-xl text-[11px] leading-5 text-[#77736d]">
                {stepContent[step].text}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-4 border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700"
              >
                {error}
              </p>
            )}

            {step === 2 && (
              <div className="space-y-2.5" role="radiogroup" aria-label="Delivery method">
                {deliveryMethods.map(({ value, title, price, description, note, Icon }) => {
                  const selected = deliveryMethod === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setDeliveryMethod(value);
                        invalidateCheckoutRequest();
                      }}
                      className={`${card} w-full cursor-pointer p-3.5 text-left transition-colors sm:p-4 ${
                        selected ? 'border-brand shadow-sm' : 'hover:border-[#c9c5bc]'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-brand' : 'border-[#d6d2c9]'
                          }`}
                        >
                          {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#fff2eb] text-brand">
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-[11px] font-semibold">{title}</strong>
                            <strong className="text-[11px] font-semibold">{price}</strong>
                          </span>
                          <span className="mt-1 block text-[10px] leading-5 text-[#77736d]">
                            {description}
                          </span>
                          <span className="mt-1.5 flex items-center gap-1 text-[9px] text-[#88847d]">
                            <Clock3 size={11} /> {note}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className={`${card} p-4 sm:p-5`}>
                {showAddress ? (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {textFields.map(
                      ({
                        field,
                        label,
                        autoComplete,
                        maxLength,
                        placeholder,
                        type,
                        full,
                        optional,
                      }) => (
                        <label
                          key={field}
                          className={`${labelClass} ${full ? 'sm:col-span-2' : ''}`}
                        >
                          <span>
                            {label}
                            {optional ? (
                              <span className="font-normal text-[#88847d]"> (optional)</span>
                            ) : (
                              ' *'
                            )}
                          </span>
                          <input
                            className={inputClass}
                            value={address[field]}
                            onChange={(event) => updateAddress(field, event.target.value)}
                            type={type ?? 'text'}
                            autoComplete={autoComplete}
                            maxLength={maxLength}
                            placeholder={placeholder}
                          />
                        </label>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#fff2eb] text-brand">
                      <Store size={16} />
                    </span>
                    <div>
                      <h2 className="m-0 text-[11px] font-semibold">Store pickup</h2>
                      <p className="mt-1 mb-0 text-[10px] leading-5 text-[#77736d]">
                        No delivery address is needed for store pickup.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                {showAddress && (
                  <>
                    <div>
                      <p className={sectionLabel}>DATE</p>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {dates.map((date) => (
                          <button
                            type="button"
                            key={date.value}
                            onClick={() => {
                              setSelectedDate(date.value);
                              invalidateCheckoutRequest();
                            }}
                            aria-pressed={selectedDate === date.value}
                            className={`flex min-h-[66px] cursor-pointer flex-col items-center justify-center border transition-colors ${
                              selectedDate === date.value
                                ? 'border-brand bg-brand text-white'
                                : 'border-[#e9e6df] bg-white text-[#514f49] hover:border-brand'
                            }`}
                          >
                            <span className="text-[9px]">{date.day}</span>
                            <strong className="my-0.5 text-sm font-semibold">{date.number}</strong>
                            <span className="text-[9px]">{date.month}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className={sectionLabel}>TIME SLOT</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {timeSlots.map((slot) => (
                          <button
                            type="button"
                            key={slot.value}
                            onClick={() => {
                              setSelectedSlot(slot.value);
                              invalidateCheckoutRequest();
                            }}
                            aria-pressed={selectedSlot === slot.value}
                            className={`${card} flex min-w-0 cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition-colors ${
                              selectedSlot === slot.value ? 'border-brand' : 'hover:border-brand'
                            }`}
                          >
                            <span className="min-w-0">
                              <strong className="block text-[10px] font-semibold">
                                {slot.value}
                              </strong>
                              <span className="mt-1 block text-[9px] text-[#88847d]">
                                {slot.label}
                              </span>
                            </span>
                            <span className="shrink-0 text-[9px] font-semibold text-brand">
                              {slot.fee ? `+${formatPrice(slot.fee * 100)}` : 'Free'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <label className={labelClass}>
                  {showAddress
                    ? 'Notes for the butcher or driver (optional)'
                    : 'Notes for the butcher (optional)'}
                  <textarea
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      invalidateCheckoutRequest();
                    }}
                    rows={3}
                    maxLength={500}
                    placeholder="Any special instructions for your order…"
                    className={`${inputClass} min-h-[85px] resize-y`}
                  />
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <section className={`${card} p-4`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="m-0 text-[11px] font-semibold">Your cuts</h2>
                    <Link
                      href="/cart"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand"
                    >
                      <Pencil size={11} /> Edit bag
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {items.map(({ product, quantity }) => (
                      <div key={product.slug} className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 border border-[#f0eee9] bg-[#f4f1ec] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-[10px] font-medium">{product.name}</p>
                          <p className="mt-0.5 mb-0 text-[9px] text-[#88847d]">
                            {quantity} × {formatPrice(product.priceCents)}
                          </p>
                        </div>
                        <strong className="shrink-0 text-[10px] font-semibold">
                          {formatPrice(product.priceCents * quantity)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <section className={`${card} min-w-0 p-3.5`}>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <h2 className="m-0 text-[9px] font-bold tracking-[0.1em] text-[#88847d]">
                        {showAddress ? 'DELIVERY ADDRESS' : 'COLLECTION'}
                      </h2>
                      <button type="button" onClick={() => goToStep(3)} className={editLink}>
                        Edit
                      </button>
                    </div>
                    {showAddress ? (
                      <div className="break-words text-[10px] leading-[1.8] text-[#77736d]">
                        <p className="m-0 font-semibold text-[#24231f]">{address.fullName}</p>
                        <p className="m-0">{address.addressLine1}</p>
                        {address.addressLine2 && <p className="m-0">{address.addressLine2}</p>}
                        <p className="m-0">
                          {address.city}, {address.region} {address.postalCode}
                        </p>
                        <p className="m-0">{address.phone}</p>
                      </div>
                    ) : (
                      <p className="m-0 text-[10px] text-[#77736d]">Store pickup</p>
                    )}
                  </section>

                  <section className={`${card} min-w-0 p-3.5`}>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <h2 className="m-0 text-[9px] font-bold tracking-[0.1em] text-[#88847d]">
                        DELIVERY METHOD
                      </h2>
                      <button type="button" onClick={() => goToStep(2)} className={editLink}>
                        Edit
                      </button>
                    </div>
                    <p className="m-0 text-[10px] font-medium">
                      {showAddress ? 'Home delivery' : 'Store pickup'}
                    </p>
                    <p className="mt-1 mb-0 text-[10px] text-[#77736d]">{deliveryLabel}</p>
                  </section>

                  <section className={`${card} min-w-0 p-3.5 sm:col-span-2`}>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <h2 className="m-0 text-[9px] font-bold tracking-[0.1em] text-[#88847d]">
                        SCHEDULE
                      </h2>
                      <button type="button" onClick={() => goToStep(4)} className={editLink}>
                        Edit
                      </button>
                    </div>
                    {showAddress ? (
                      <>
                        <p className="m-0 text-[10px] font-medium">
                          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="mt-1 mb-0 text-[10px] text-[#77736d]">{selectedSlot}</p>
                      </>
                    ) : (
                      <p className="m-0 text-[10px] text-[#77736d]">
                        We’ll confirm your collection time after you order.
                      </p>
                    )}
                    {notes && (
                      <p className="mt-2.5 mb-0 break-words border-t border-[#e9e6df] pt-2.5 text-[10px] leading-5 text-[#77736d]">
                        Note: {notes}
                      </p>
                    )}
                  </section>

                  {appliedCoupon && (
                    <section className={`${card} p-3.5 sm:col-span-2`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Tag size={13} className="shrink-0 text-green-700" />
                          <div className="min-w-0">
                            <p className="m-0 text-[10px] font-semibold text-green-800">
                              {appliedCoupon.code}
                            </p>
                            <p className="mt-0.5 mb-0 text-[9px] text-[#77736d]">
                              Coupon discount applied
                            </p>
                          </div>
                        </div>
                        <strong className="shrink-0 text-[10px] text-green-700">
                          -{formatPrice(appliedCoupon.discountCents)}
                        </strong>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className={`${card} p-4 sm:p-5`}>
                <div className="flex h-10 w-10 items-center justify-center bg-[#fff2eb] text-brand">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="mt-3 mb-0 font-heading text-base font-semibold">
                  Secure payment with Paystack
                </h2>
                <p className="mt-1.5 mb-0 max-w-lg text-[11px] leading-5 text-[#77736d]">
                  You’ll be redirected to Paystack to pay securely in Nigerian naira.
                </p>

                <div className="mt-4 space-y-2.5 bg-[#f8f8f6] p-3.5 text-[10px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#77736d]">Order items</span>
                    <span>{cartCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#77736d]">Subtotal</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between gap-3 text-green-700">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>-{formatPrice(appliedCoupon.discountCents)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#77736d]">Delivery</span>
                    <span>{deliveryLabel}</span>
                  </div>
                  <div className="border-t border-[#e9e6df]" />
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-[11px]">Total</strong>
                    <strong className="font-heading text-lg font-bold">
                      {formatPrice(totalCents)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e9e6df] pt-4">
              {step === 2 ? (
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#77736d] hover:text-brand"
                >
                  <ArrowLeft size={12} /> Back
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[10px] font-medium text-[#77736d] hover:text-brand"
                >
                  <ArrowLeft size={12} /> Back
                </button>
              )}

              {step < 6 ? (
                <button
                  type="button"
                  onClick={next}
                  className={`${primaryButton} flex-1 sm:flex-none`}
                >
                  {step === 5 ? 'Continue to payment' : 'Continue'}
                  <ArrowRight size={12} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={placeOrder}
                  className={`${primaryButton} flex-1 sm:flex-none`}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={13} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Paystack <ArrowRight size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          <aside className={`${card} min-w-0 p-3.5 sm:p-4 lg:p-4`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="m-0 font-heading text-sm font-semibold">Order summary</h2>
              <span className="text-[9px] text-[#88847d]">{itemLabel(cartCount)}</span>
            </div>

            <div className="space-y-2.5">
              {items.map(({ product, quantity }) => (
                <div key={product.slug} className="flex min-w-0 items-center gap-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-9 w-9 shrink-0 border border-[#f0eee9] bg-[#f4f1ec] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[10px] font-medium">{product.name}</p>
                    <p className="mt-0.5 mb-0 text-[9px] text-[#88847d]">
                      {quantity} × {formatPrice(product.priceCents)}
                    </p>
                  </div>
                  <strong className="shrink-0 text-[10px] font-medium">
                    {formatPrice(product.priceCents * quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="my-3.5 border-t border-[#e9e6df]" />

            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Tag size={12} className="text-brand" />
                <h3 className="m-0 text-[10px] font-semibold">Have a coupon code?</h3>
              </div>

              {appliedCoupon ? (
                <div className="flex min-w-0 items-center justify-between gap-2 border border-green-200 bg-green-50 p-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Check size={13} className="shrink-0 text-green-700" />
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[10px] font-semibold text-green-800">
                        {appliedCoupon.code}
                      </p>
                      <p className="mt-0.5 mb-0 text-[9px] text-green-700">
                        Saved {formatPrice(appliedCoupon.discountCents)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-red-600 hover:bg-red-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 gap-1.5">
                  <input
                    id="checkout-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(event.target.value);
                      setCouponError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    placeholder="Enter coupon code"
                    maxLength={32}
                    autoComplete="off"
                    className="min-w-0 flex-1 border border-[#e9e6df] bg-white px-2.5 py-2 text-[10px] uppercase outline-none placeholder:normal-case placeholder:text-[#aaa69e] focus:border-brand"
                  />
                  <button
                    type="button"
                    disabled={couponLoading || !couponInput.trim()}
                    onClick={() => void applyCoupon()}
                    className="shrink-0 cursor-pointer border-0 bg-[#24231f] px-3 py-2 text-[9px] font-bold text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading ? <LoaderCircle size={12} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}

              {couponError && (
                <p role="alert" className="m-0 text-[9px] leading-4 text-red-600">
                  {couponError}
                </p>
              )}
            </div>

            <div className="my-3.5 border-t border-[#e9e6df]" />

            <div className="space-y-2.5 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#77736d]">Products</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between gap-3 text-green-700">
                  <span className="min-w-0 truncate">Coupon ({appliedCoupon.code})</span>
                  <span className="shrink-0">-{formatPrice(appliedCoupon.discountCents)}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-[#77736d]">Delivery</span>
                <span>{deliveryLabel}</span>
              </div>
            </div>

            <div className="my-3.5 border-t border-[#e9e6df]" />

            <div className="flex items-center justify-between gap-2">
              <strong className="text-[11px]">Total</strong>
              <strong className="font-heading text-lg font-bold">{formatPrice(totalCents)}</strong>
            </div>

            <p className="mt-3 mb-0 flex items-center justify-center gap-1 text-center text-[9px] leading-4 text-[#88847d]">
              <ShieldCheck size={11} />
              Encrypted payment. Secure checkout.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
