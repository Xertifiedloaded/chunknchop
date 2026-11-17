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
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/lib/catalog';

type CheckoutResponse = {
  orderNumber: string;
  authorizationUrl: string;
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

const container = 'mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12';
const card = 'border border-[#e6e4de] bg-white';
const primaryButton =
  'inline-flex items-center justify-center gap-2 bg-brand px-6 py-3.5 text-xs font-bold tracking-[0.08em] text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-60';
const editLink = 'cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-brand';
const inputClass =
  'w-full border border-[#e6e4de] bg-white px-4 py-3 text-base text-[#24231f] outline-none transition placeholder:text-[#b0aca4] focus:border-brand focus:ring-2 focus:ring-brand/10 sm:text-sm';
const labelClass = 'flex flex-col gap-2 text-xs font-semibold text-[#5c5851]';
const sectionLabel = 'mb-3 mt-0 text-[11px] font-bold tracking-[0.14em] text-[#88847d]';

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
  const checkoutRequestId = useRef<string | null>(null);

  const selectedTimeSlot = timeSlots.find((slot) => slot.value === selectedSlot);

  const deliveryFee =
    deliveryMethod === 'pickup' ? 0 : HOME_DELIVERY_FEE + (selectedTimeSlot?.fee ?? 0);

  const deliveryLabel = deliveryFee ? formatPrice(deliveryFee * 100) : 'Free';
  const totalCents = subtotalCents + deliveryFee * 100;
  const showAddress = deliveryMethod === 'home';

  function updateAddress(field: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    checkoutRequestId.current = null;
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

    const missing = requiredFields.some((field) => !address[field].trim());

    if (missing) {
      setError('Please complete all required delivery address fields.');
      return false;
    }

    return true;
  }

  function next() {
    if (step === 3 && showAddress && !validateAddress()) return;
    goToStep(step + 1);
  }

  async function placeOrder() {
    if (showAddress && !validateAddress()) {
      goToStep(3);
      return;
    }

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
        <div className="flex items-center gap-3 text-sm text-[#77736d]">
          <LoaderCircle size={20} className="animate-spin text-brand" />
          Loading your checkout…
        </div>
      </FullPage>
    );
  }

  if (!user) {
    return (
      <FullPage>
        <div className="max-w-md text-center">
          <p className="mb-3 font-worksans text-[11px] font-bold tracking-[0.15em] text-brand">
            SIGN IN REQUIRED
          </p>
          <h1 className="m-0 font-heading text-3xl font-semibold">Sign in to check out.</h1>
          <p className="mt-3 text-sm leading-6 text-[#77736d]">
            Your bag is saved to your account. Sign in to continue with your ChunknChop order.
          </p>
          <Link href="/sign-in?returnTo=/checkout" className={`${primaryButton} mt-6`}>
            Sign in to continue
            <ArrowRight size={16} />
          </Link>
        </div>
      </FullPage>
    );
  }

  if (items.length === 0) {
    return (
      <FullPage>
        <div className="max-w-md text-center">
          <h1 className="m-0 font-heading text-3xl font-semibold">Your bag is empty.</h1>
          <p className="mt-3 text-sm text-[#77736d]">Add some cuts before starting checkout.</p>
          <Link href="/shop" className={`${primaryButton} mt-6`}>
            Explore the cuts
            <ArrowRight size={16} />
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
          text: 'Leave any instructions for our butchers. We’ll confirm your collection time after you order.',
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
    { field: 'fullName', label: 'Full name', autoComplete: 'name', maxLength: 100, placeholder: 'Your full name' },
    { field: 'phone', label: 'Phone number', autoComplete: 'tel', maxLength: 32, placeholder: '+234…', type: 'tel' },
    { field: 'addressLine1', label: 'Address line 1', autoComplete: 'address-line1', maxLength: 160, placeholder: 'Street address and house number', full: true },
    { field: 'addressLine2', label: 'Address line 2', autoComplete: 'address-line2', maxLength: 160, placeholder: 'Apartment, suite, landmark…', full: true, optional: true },
    { field: 'city', label: 'City', autoComplete: 'address-level2', maxLength: 80, placeholder: 'City' },
    { field: 'region', label: 'State / region', autoComplete: 'address-level1', maxLength: 80, placeholder: 'State' },
    { field: 'postalCode', label: 'Postal code', autoComplete: 'postal-code', maxLength: 20, placeholder: 'Postal code', full: true },
  ];

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <header className="border-b border-[#e6e4de]">
        <div className={`${container} grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:min-h-[72px]`}>
          <Link
            href="/cart"
            aria-label="Back to your bag"
            className="inline-flex items-center gap-2 justify-self-start text-xs font-medium text-[#77736d] transition-colors hover:text-brand"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Your bag</span>
          </Link>

          <Link href="/" className="font-heading text-lg font-bold tracking-wide sm:text-xl">
            ChunknChop
          </Link>

          <span className="justify-self-end text-xs font-medium text-[#77736d]">
            {itemLabel(cartCount)}
          </span>
        </div>
      </header>

      <div className={`${container} pt-8 pb-16 sm:pt-10 lg:pb-20`}>
        <ol className="relative m-0 mb-10 grid list-none grid-cols-6 p-0" aria-label="Checkout progress">
          <span className="absolute top-[13px] right-[8.33%] left-[8.33%] h-px bg-[#e6e4de]" />

          {steps.map((label, index) => {
            const number = index + 1;
            const completed = number < step;
            const active = number === step;

            return (
              <li
                key={label}
                aria-current={active ? 'step' : undefined}
                className="relative flex min-w-0 flex-col items-center gap-2"
              >
                <span
                  className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    completed
                      ? 'border-brand bg-brand text-white'
                      : active
                        ? 'border-brand bg-white text-brand'
                        : 'border-[#e6e4de] bg-white text-[#a8a49c]'
                  }`}
                >
                  {completed ? <Check size={14} /> : number}
                </span>
                <span
                  className={`hidden px-1 text-center text-[11px] leading-tight md:block ${
                    active ? 'font-semibold text-[#24231f]' : 'text-[#88847d]'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
          <section className="min-w-0">
            <div className="mb-7">
              <p className="mb-2 flex items-center gap-2.5 font-worksans text-[11px] font-bold tracking-[0.15em] text-[#77736d]">
                <span className="h-px w-5 bg-brand" />
                STEP {step} OF 6 · {steps[step - 1].toUpperCase()}
              </p>

              <h1 className="m-0 font-heading text-[clamp(28px,4vw,40px)] leading-[1.1] font-semibold tracking-tight">
                {stepContent[step].title}
              </h1>

              <p className="mt-2 mb-0 max-w-xl text-sm leading-6 text-[#77736d]">
                {stepContent[step].text}
              </p>
            </div>

            {error && (
              <p role="alert" className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {step === 2 && (
              <div className="space-y-4" role="radiogroup" aria-label="Delivery method">
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
                        checkoutRequestId.current = null;
                      }}
                      className={`${card} w-full cursor-pointer p-4 text-left transition sm:p-5 ${
                        selected
                          ? 'border-brand shadow-[0_5px_18px_rgba(45,35,24,0.07)]'
                          : 'hover:border-[#c9c5bc]'
                      }`}
                    >
                      <span className="flex items-start gap-3 sm:gap-4">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-brand' : 'border-[#d6d2c9]'
                          }`}
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                        </span>

                        <span className="hidden h-10 w-10 shrink-0 items-center justify-center bg-[#fff2eb] text-brand sm:flex">
                          <Icon size={19} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <strong className="text-sm font-semibold">{title}</strong>
                            <strong className="shrink-0 text-sm">{price}</strong>
                          </span>
                          <span className="mt-2 block text-xs leading-5 text-[#77736d]">
                            {description}
                          </span>
                          <span className="mt-2 flex items-center gap-1.5 text-[11px] text-[#88847d]">
                            <Clock3 size={13} />
                            {note}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className={`${card} p-5 sm:p-6`}>
                {showAddress ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {textFields.map(
                      ({ field, label, autoComplete, maxLength, placeholder, type, full, optional }) => (
                        <label key={field} className={`${labelClass} ${full ? 'sm:col-span-2' : ''}`}>
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fff2eb] text-brand">
                      <Store size={18} />
                    </span>
                    <div>
                      <h2 className="m-0 text-sm font-semibold">Store pickup</h2>
                      <p className="mt-1 mb-0 text-xs leading-5 text-[#77736d]">
                        You selected store pickup, so no delivery address is required.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                {showAddress && (
                  <>
                    <div>
                      <p className={sectionLabel}>DATE</p>

                      <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                        {dates.map((date) => (
                          <button
                            type="button"
                            key={date.value}
                            onClick={() => setSelectedDate(date.value)}
                            aria-pressed={selectedDate === date.value}
                            className={`flex min-h-20 cursor-pointer flex-col items-center justify-center border transition ${
                              selectedDate === date.value
                                ? 'border-brand bg-brand text-white shadow-md'
                                : 'border-[#e6e4de] bg-white text-[#514f49] hover:border-brand'
                            }`}
                          >
                            <span className="text-[11px]">{date.day}</span>
                            <strong className="my-0.5 text-lg">{date.number}</strong>
                            <span className="text-[11px]">{date.month}</span>
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
                            onClick={() => setSelectedSlot(slot.value)}
                            aria-pressed={selectedSlot === slot.value}
                            className={`${card} flex cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left transition ${
                              selectedSlot === slot.value
                                ? 'border-brand shadow-[0_4px_14px_rgba(45,35,24,0.06)]'
                                : 'hover:border-brand'
                            }`}
                          >
                            <span>
                              <strong className="block text-xs font-semibold">{slot.value}</strong>
                              <span className="mt-1 block text-[11px] text-[#88847d]">{slot.label}</span>
                            </span>
                            <span className="shrink-0 text-[11px] font-medium text-brand">
                              {slot.fee ? `+${formatPrice(slot.fee * 100)}` : 'Free'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <label className={labelClass}>
                  {showAddress ? 'Notes for the butcher or driver (optional)' : 'Notes for the butcher (optional)'}
                  <textarea
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      checkoutRequestId.current = null;
                    }}
                    rows={3}
                    maxLength={500}
                    placeholder="Any special instructions for your order…"
                    className={`${inputClass} resize-y`}
                  />
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <section className={`${card} p-5 sm:p-6`}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="m-0 text-sm font-semibold">Your cuts</h2>
                    <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                      <Pencil size={13} />
                      Edit bag
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {items.map(({ product, quantity }) => (
                      <div key={product.slug} className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 shrink-0 bg-[#f4f1ec] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-xs font-medium">{product.name}</p>
                          <p className="mt-1 mb-0 text-[11px] text-[#88847d]">
                            {quantity} × {formatPrice(product.priceCents)}
                          </p>
                        </div>
                        <strong className="shrink-0 text-xs">
                          {formatPrice(product.priceCents * quantity)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <section className={`${card} p-5`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="m-0 text-[11px] font-bold tracking-[0.1em] text-[#88847d]">
                        DELIVERY ADDRESS
                      </h2>
                      <button type="button" onClick={() => goToStep(3)} className={editLink}>
                        Edit
                      </button>
                    </div>
                    {showAddress ? (
                      <div className="text-xs leading-5 break-words text-[#77736d]">
                        <p className="m-0 font-semibold text-[#24231f]">{address.fullName}</p>
                        <p className="m-0">{address.addressLine1}</p>
                        {address.addressLine2 && <p className="m-0">{address.addressLine2}</p>}
                        <p className="m-0">
                          {address.city}, {address.region} {address.postalCode}
                        </p>
                        <p className="m-0">{address.phone}</p>
                      </div>
                    ) : (
                      <p className="m-0 text-xs text-[#77736d]">Store pickup</p>
                    )}
                  </section>

                  <section className={`${card} p-5`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="m-0 text-[11px] font-bold tracking-[0.1em] text-[#88847d]">
                        DELIVERY METHOD
                      </h2>
                      <button type="button" onClick={() => goToStep(2)} className={editLink}>
                        Edit
                      </button>
                    </div>
                    <p className="m-0 text-sm font-medium">
                      {showAddress ? 'Home delivery' : 'Store pickup'}
                    </p>
                    <p className="mt-1 mb-0 text-xs text-[#77736d]">{deliveryLabel}</p>
                  </section>

                  <section className={`${card} p-5 sm:col-span-2`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="m-0 text-[11px] font-bold tracking-[0.1em] text-[#88847d]">
                        SCHEDULE
                      </h2>
                      <button type="button" onClick={() => goToStep(4)} className={editLink}>
                        Edit
                      </button>
                    </div>
                    {showAddress ? (
                      <>
                        <p className="m-0 text-sm font-medium">
                          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="mt-1 mb-0 text-xs text-[#77736d]">{selectedSlot}</p>
                      </>
                    ) : (
                      <p className="m-0 text-xs text-[#77736d]">
                        We’ll confirm your collection time after you order.
                      </p>
                    )}
                    {notes && (
                      <p className="mt-3 mb-0 border-t border-[#e6e4de] pt-3 text-xs leading-5 break-words text-[#77736d]">
                        Note: {notes}
                      </p>
                    )}
                  </section>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className={`${card} p-5 sm:p-8`}>
                <div className="flex h-14 w-14 items-center justify-center bg-[#fff2eb] text-brand">
                  <ShieldCheck size={26} />
                </div>

                <h2 className="mt-5 mb-0 font-heading text-xl font-semibold">
                  Secure payment with Paystack
                </h2>

                <p className="mt-2 mb-0 max-w-lg text-sm leading-6 text-[#77736d]">
                  When you continue, you’ll be redirected to Paystack to pay securely in Nigerian
                  naira.
                </p>

                <div className="mt-6 space-y-3 bg-[#f8f8f6] p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#77736d]">Order items</span>
                    <span>{cartCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#77736d]">Subtotal</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#77736d]">Delivery</span>
                    <span>{deliveryLabel}</span>
                  </div>
                  <div className="border-t border-[#e6e4de]" />
                  <div className="flex items-center justify-between gap-4">
                    <strong>Total</strong>
                    <strong className="font-heading text-2xl">{formatPrice(totalCents)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#e6e4de] pt-5">
              {step === 2 ? (
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#77736d] transition-colors hover:text-brand"
                >
                  <ArrowLeft size={15} />
                  Back
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-xs font-medium text-[#77736d] transition-colors hover:text-brand"
                >
                  <ArrowLeft size={15} />
                  Back
                </button>
              )}

              {step < 6 ? (
                <button
                  type="button"
                  onClick={next}
                  className={`${primaryButton} flex-1 border-0 sm:flex-none`}
                >
                  {step === 5 ? 'Continue to payment' : 'Continue'}
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={placeOrder}
                  className={`${primaryButton} flex-1 border-0 sm:flex-none`}
                >
                  {submitting ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <>
                      Proceed to Paystack
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          <aside
            className={`${card} p-5 shadow-[0_8px_24px_rgba(45,35,24,0.06)] sm:p-6 lg:sticky lg:top-6`}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="m-0 font-heading text-lg font-semibold">Order summary</h2>
              <span className="text-[11px] text-[#88847d]">{itemLabel(cartCount)}</span>
            </div>

            <div className="space-y-3.5">
              {items.map(({ product, quantity }) => (
                <div key={product.slug} className="flex items-center gap-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-11 w-11 shrink-0 bg-[#f4f1ec] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-xs font-medium">{product.name}</p>
                    <p className="mt-0.5 mb-0 text-[11px] text-[#88847d]">
                      {quantity} × {formatPrice(product.priceCents)}
                    </p>
                  </div>
                  <strong className="shrink-0 text-xs font-medium">
                    {formatPrice(product.priceCents * quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-[#e6e4de]" />

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#77736d]">Products</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#77736d]">Delivery</span>
                <span>{deliveryLabel}</span>
              </div>
            </div>

            <div className="my-5 border-t border-[#e6e4de]" />

            <div className="flex items-center justify-between gap-4">
              <strong className="text-sm">Total</strong>
              <strong className="font-heading text-2xl font-bold">{formatPrice(totalCents)}</strong>
            </div>

            <p className="mt-5 mb-0 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-[#88847d]">
              <ShieldCheck size={13} />
              Encrypted payment. Secure checkout.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}