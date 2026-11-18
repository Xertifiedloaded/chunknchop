'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  MapPin,
  Plus,
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
  id?: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  area?: string;
  city: string;
  region: string;
  postalCode: string;
  instructions?: string;
  isDefault?: boolean;
};

type ApiAddress = {
  id?: string;
  label?: string | null;
  fullName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  region?: string | null;
  postalCode?: string | null;
  instructions?: string | null;
  isDefault?: boolean;
};

type DeliveryZone = {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFeeCents: number;
  active: boolean;
};

type DeliverySchedule = {
  id: string;
  date: string;
  label?: string;
  startTime: string;
  endTime: string;
  available: boolean;
  remainingCapacity?: number;
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
  area: '',
  city: '',
  region: '',
  postalCode: '',
  instructions: '',
};

const steps = [
  'Cart Review',
  'Delivery Method',
  'Delivery Address',
  'Delivery Schedule',
  'Review Order',
  'Payment',
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

function itemLabel(count: number) {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function normalizeAddress(raw: ApiAddress): Address {
  return {
    ...initialAddress,
    id: raw.id,
    label: raw.label ?? '',
    fullName: raw.fullName ?? '',
    phone: raw.phone ?? '',
    addressLine1: raw.addressLine1 ?? '',
    addressLine2: raw.addressLine2 ?? '',
    area: raw.area ?? '',
    city: raw.city ?? '',
    region: raw.state ?? raw.region ?? '',
    postalCode: raw.postalCode ?? '',
    instructions: raw.instructions ?? '',
    isDefault: raw.isDefault,
  };
}

function firstDetail(details: unknown): string | undefined {
  if (!details || typeof details !== 'object') return undefined;

  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return `${key}: ${value[0]}`;
    }
  }

  return undefined;
}

function FullPage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-5 text-[#24231f]">
      {children}
    </main>
  );
}

function formatDate(date: string) {
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatSlot(slot: DeliverySchedule) {
  return `${slot.startTime} – ${slot.endTime}`;
}

export default function CheckoutPageClient() {
  const { user, isLoading: sessionPending } = useAuth();

  const { items, subtotalCents, cartCount, isLoading: cartLoading } = useCart();

  const [step, setStep] = useState(2);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');

  const [address, setAddress] = useState<Address>(initialAddress);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');

  const [schedules, setSchedules] = useState<DeliverySchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [editingAddress, setEditingAddress] = useState(true);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const checkoutRequestId = useRef<string | null>(null);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

  const selectedSchedule = schedules.find((schedule) => schedule.id === selectedScheduleId);

  const deliveryFeeCents = deliveryMethod === 'pickup' ? 0 : (selectedZone?.deliveryFeeCents ?? 0);

  const deliveryLabel =
    deliveryMethod === 'pickup'
      ? 'Free'
      : selectedZone
        ? formatPrice(deliveryFeeCents)
        : 'Select delivery area';

  const couponDiscountCents = appliedCoupon?.discountCents ?? 0;

  const totalCents = Math.max(0, subtotalCents - couponDiscountCents + deliveryFeeCents);

  const showAddress = deliveryMethod === 'home';

  const invalidateCheckoutRequest = useCallback(() => {
    checkoutRequestId.current = null;
  }, []);

  const updateAddress = useCallback(
    (field: keyof Address, value: string) => {
      setAddress((current) => ({
        ...current,
        [field]: value,
      }));

      invalidateCheckoutRequest();
    },
    [invalidateCheckoutRequest],
  );

  const goToStep = useCallback((nextStep: number) => {
    setError('');
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchAddresses = useCallback(async (preferId?: string) => {
    setLoadingAddresses(true);

    try {
      const response = await fetch('/api/account/addresses', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAddresses([]);
          return;
        }

        throw new Error('Unable to load saved addresses.');
      }

      const result = await response.json();

      const rawList: ApiAddress[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.addresses)
          ? result.addresses
          : [];

      const list = rawList.map(normalizeAddress);

      setAddresses(list);

      const chosen =
        (preferId ? list.find((item) => item.id === preferId) : undefined) ||
        list.find((item) => item.id && item.id === result?.defaultAddressId) ||
        list.find((item) => item.isDefault) ||
        list[0];

      if (chosen) {
        setAddress(chosen);
        setSelectedAddressId(chosen.id ?? '');
        setEditingAddress(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load saved addresses.');
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  const fetchZones = useCallback(async (city: string, state: string) => {
    if (!city.trim() || !state.trim()) {
      setZones([]);
      setSelectedZoneId('');
      return;
    }

    setLoadingZones(true);

    try {
      const params = new URLSearchParams({
        city: city.trim(),
        state: state.trim(),
      });

      const response = await fetch(`/api/delivery/checkout-options?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to load delivery areas.');
      }

      const list: DeliveryZone[] = Array.isArray(result?.zones)
        ? result.zones.filter((zone: DeliveryZone) => zone.active)
        : [];

      setZones(list);

      setSelectedZoneId((current) => (list.some((zone) => zone.id === current) ? current : ''));
    } catch (err) {
      setZones([]);
      setSelectedZoneId('');

      setError(err instanceof Error ? err.message : 'Unable to load delivery areas.');
    } finally {
      setLoadingZones(false);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    if (!selectedZoneId) {
      setSchedules([]);
      setSelectedScheduleId('');
      return;
    }

    setLoadingSchedules(true);

    try {
      const params = new URLSearchParams({
        zoneId: selectedZoneId,
      });

      const response = await fetch(`/api/delivery/checkout-options?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to load delivery schedules.');
      }

      const list: DeliverySchedule[] = Array.isArray(result?.schedules)
        ? result.schedules.filter(
            (slot: DeliverySchedule) =>
              slot.available &&
              (slot.remainingCapacity === undefined || slot.remainingCapacity > 0),
          )
        : [];

      setSchedules(list);

      setSelectedScheduleId((current) => (list.some((slot) => slot.id === current) ? current : ''));
    } catch (err) {
      setSchedules([]);
      setSelectedScheduleId('');

      setError(err instanceof Error ? err.message : 'Unable to load delivery schedules.');
    } finally {
      setLoadingSchedules(false);
    }
  }, [selectedZoneId]);

  useEffect(() => {
    if (user) {
      void fetchAddresses();
    }
  }, [user, fetchAddresses]);

  useEffect(() => {
    if (!showAddress) return;

    const timer = setTimeout(() => {
      void fetchZones(address.city, address.region);
    }, 400);

    return () => clearTimeout(timer);
  }, [showAddress, address.city, address.region, fetchZones]);

  useEffect(() => {
    if (showAddress && selectedZoneId) {
      void fetchSchedules();
    } else {
      setSchedules([]);
      setSelectedScheduleId('');
    }
  }, [showAddress, selectedZoneId, fetchSchedules]);

  useEffect(() => {
    if (!showAddress || selectedZoneId || zones.length === 0) return;

    const area = (address.area ?? '').trim().toLowerCase();

    const pick =
      zones.find((zone) => zone.name.trim().toLowerCase() === area) ??
      (zones.length === 1 ? zones[0] : undefined);

    if (pick) {
      setSelectedZoneId(pick.id);
      invalidateCheckoutRequest();
    }
  }, [zones, address.area, selectedZoneId, showAddress, invalidateCheckoutRequest]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  void selectedAddress;

  function chooseAddress(item: Address) {
    setAddress({
      ...initialAddress,
      ...item,
    });

    setSelectedAddressId(item.id ?? '');
    setEditingAddress(false);
    setSelectedZoneId('');
    setSelectedScheduleId('');
    invalidateCheckoutRequest();
  }

  function startNewAddress() {
    setAddress(initialAddress);
    setSelectedAddressId('');
    setEditingAddress(true);
    setSelectedZoneId('');
    setSelectedScheduleId('');
    invalidateCheckoutRequest();
  }

  async function saveAddress() {
    if (!validateAddress() || savingAddress) return;

    setSavingAddress(true);

    try {
      const payload = {
        label: address.label || 'Home',
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? '',
        area: address.area ?? '',
        city: address.city,
        state: address.region,
        postalCode: address.postalCode ?? '',
        instructions: address.instructions ?? '',
        isDefault: address.isDefault ?? addresses.length === 0,
      };

      const response = await fetch(
        selectedAddressId
          ? `/api/account/addresses/${selectedAddressId}`
          : '/api/account/addresses',
        {
          method: selectedAddressId ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to save your address.');
      }

      const saved = normalizeAddress((result?.address ?? result) as ApiAddress);

      setAddress(saved);
      setSelectedAddressId(saved.id ?? '');
      setEditingAddress(false);
      setError('');
      invalidateCheckoutRequest();

      await fetchAddresses(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your address.');
    } finally {
      setSavingAddress(false);
    }
  }

  function validateAddress() {
    const requiredFields: (keyof Address)[] = [
      'fullName',
      'phone',
      'addressLine1',
      'city',
      'region',
      'area',
    ];

    if (requiredFields.some((field) => !String(address[field] ?? '').trim())) {
      setError('Please complete your name, phone, street address, area, city and state.');

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

  function validateDelivery() {
    if (showAddress && !selectedZoneId) {
      setError('Please select an available delivery area.');
      return false;
    }

    if (showAddress && !selectedScheduleId) {
      setError('Please select an available delivery date and time.');
      return false;
    }

    return true;
  }

  function next() {
    if (step === 3 && showAddress) {
      if (!validateAddress()) return;

      if (!selectedZoneId) {
        setError(
          zones.length === 0
            ? 'We don’t deliver to this city and state yet. Check your address or contact ChunkNChop.'
            : 'Please select your delivery area from the list below.',
        );
        return;
      }
    }

    if (step === 4 && showAddress && !validateDelivery()) {
      return;
    }

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
        headers: {
          'Content-Type': 'application/json',
        },
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
      invalidateCheckoutRequest();
    } catch (err) {
      setAppliedCoupon(null);

      setCouponError(err instanceof Error ? err.message : 'Unable to apply this coupon.');

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

    if (showAddress && !validateDelivery()) {
      goToStep(4);
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setError('');

    checkoutRequestId.current ??= crypto.randomUUID();

    try {
      const base = {
        deliveryMethod,
        deliveryNotes: notes,
        couponCode: appliedCoupon?.code,
        checkoutRequestId: checkoutRequestId.current,
      };

      const body = showAddress
        ? {
            ...base,
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 ?? '',
            area: address.area ?? '',
            city: address.city,
            state: address.region,
            postalCode: address.postalCode ?? '',
            zoneId: selectedZoneId,
            deliverySlotId: selectedScheduleId,
          }
        : base;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = firstDetail(result?.details);
        const message = result?.error || 'We couldn’t place your order. Please try again.';

        throw new Error(detail ? `${message} (${detail})` : message);
      }

      const checkout = result as CheckoutResponse;

      if (!checkout.authorizationUrl) {
        throw new Error('Paystack did not return a checkout link.');
      }

      window.location.assign(checkout.authorizationUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'We couldn’t place your order. Please try again.',
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
        ? 'Select a saved address or add a new delivery address.'
        : 'No address is needed for store pickup.',
    },
    4: {
      title: showAddress ? 'Pick a delivery window' : 'Add a note',
      text: showAddress
        ? 'Choose an available date and time configured by ChunkNChop.'
        : 'Leave any instructions for our butchers.',
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
      field: 'area',
      label: 'Area / neighbourhood',
      autoComplete: 'address-level3',
      maxLength: 80,
      placeholder: 'e.g. Kuto, Ibara, Oke-Ilewo',
      full: true,
    },
    {
      field: 'city',
      label: 'City',
      autoComplete: 'address-level2',
      maxLength: 80,
      placeholder: 'Abeokuta',
    },
    {
      field: 'region',
      label: 'State / region',
      autoComplete: 'address-level1',
      maxLength: 80,
      placeholder: 'Ogun State',
    },
    {
      field: 'postalCode',
      label: 'Postal code',
      autoComplete: 'postal-code',
      maxLength: 20,
      placeholder: 'Postal code',
      full: true,
      optional: true,
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
                {[
                  {
                    value: 'home' as const,
                    title: 'Home delivery',
                    description: 'Delivered by a ChunkNChop rider to your selected address.',
                    note: 'Choose an admin-approved delivery schedule.',
                    Icon: Truck,
                  },
                  {
                    value: 'pickup' as const,
                    title: 'Store pickup',
                    description: 'Collect from a ChunkNChop counter. Kept fresh until you arrive.',
                    note: 'Collection details will be confirmed after ordering.',
                    Icon: Store,
                  },
                ].map(({ value, title, description, note, Icon }) => {
                  const selected = deliveryMethod === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setDeliveryMethod(value);
                        setSelectedZoneId('');
                        setSelectedScheduleId('');
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

                            <strong className="text-[11px] font-semibold">
                              {value === 'pickup' ? 'Free' : 'Zone-based pricing'}
                            </strong>
                          </span>

                          <span className="mt-1 block text-[10px] leading-5 text-[#77736d]">
                            {description}
                          </span>

                          <span className="mt-1.5 flex items-center gap-1 text-[9px] text-[#88847d]">
                            <Clock3 size={11} />
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
              <div className={`${card} p-4 sm:p-5`}>
                {showAddress ? (
                  <div className="space-y-4">
                    {loadingAddresses ? (
                      <div className="flex items-center gap-2 text-[11px] text-[#77736d]">
                        <LoaderCircle size={14} className="animate-spin" />
                        Loading saved addresses...
                      </div>
                    ) : (
                      <>
                        {addresses.length > 0 && !editingAddress && (
                          <div className="space-y-2">
                            <p className={sectionLabel}>SAVED ADDRESSES</p>

                            {addresses.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => chooseAddress(item)}
                                className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${
                                  selectedAddressId === item.id
                                    ? 'border-brand bg-[#fffaf7]'
                                    : 'border-[#e9e6df] hover:border-brand'
                                }`}
                              >
                                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />

                                <span className="min-w-0 flex-1">
                                  <strong className="block text-[10px] font-semibold">
                                    {item.label || 'Saved address'}
                                  </strong>

                                  <span className="mt-1 block text-[10px] leading-5 text-[#77736d]">
                                    {item.fullName} · {item.addressLine1}
                                    {item.area ? `, ${item.area}` : ''}, {item.city}, {item.region}
                                  </span>
                                </span>

                                {selectedAddressId === item.id && (
                                  <Check size={14} className="shrink-0 text-brand" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {!editingAddress && (
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={startNewAddress}
                              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand"
                            >
                              <Plus size={13} />
                              Add new address
                            </button>

                            {selectedAddressId && (
                              <button
                                type="button"
                                onClick={() => setEditingAddress(true)}
                                className={editLink}
                              >
                                Edit selected address
                              </button>
                            )}
                          </div>
                        )}

                        {editingAddress && (
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                              <p className={sectionLabel}>
                                {selectedAddressId ? 'EDIT ADDRESS' : 'NEW DELIVERY ADDRESS'}
                              </p>

                              {addresses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAddress(false);

                                    const original = addresses.find(
                                      (item) => item.id === selectedAddressId,
                                    );

                                    if (original) setAddress(original);
                                  }}
                                  className={editLink}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            <label className={labelClass}>
                              Address label
                              <select
                                className={inputClass}
                                value={address.label || 'Home'}
                                onChange={(event) => updateAddress('label', event.target.value)}
                              >
                                <option value="Home">Home</option>
                                <option value="Office">Office</option>
                                <option value="Other">Other</option>
                              </select>
                            </label>

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
                                        <span className="font-normal text-[#88847d]">
                                          {' '}
                                          (optional)
                                        </span>
                                      ) : (
                                        ' *'
                                      )}
                                    </span>

                                    <input
                                      className={inputClass}
                                      value={String(address[field] ?? '')}
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

                            <button
                              type="button"
                              disabled={savingAddress}
                              onClick={() => void saveAddress()}
                              className={primaryButton}
                            >
                              {savingAddress ? (
                                <LoaderCircle size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              Save address
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-[#e9e6df] pt-4">
                      <p className={sectionLabel}>DELIVERY AREA</p>

                      <p className="mb-2 text-[10px] leading-5 text-[#77736d]">
                        Available delivery zones and prices are managed by ChunkNChop.
                      </p>

                      {loadingZones ? (
                        <div className="flex items-center gap-2 text-[10px] text-[#77736d]">
                          <LoaderCircle size={13} className="animate-spin" />
                          Checking delivery zones...
                        </div>
                      ) : zones.length > 0 ? (
                        <select
                          className={inputClass}
                          value={selectedZoneId}
                          onChange={(event) => {
                            setSelectedZoneId(event.target.value);
                            setSelectedScheduleId('');
                            invalidateCheckoutRequest();
                          }}
                        >
                          <option value="">Select your delivery area</option>

                          {zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name} — {formatPrice(zone.deliveryFeeCents)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">
                          {address.city && address.region
                            ? 'No active delivery zone is available for this location. Please contact ChunkNChop.'
                            : 'Enter your city and state to check available delivery zones.'}
                        </p>
                      )}

                      {selectedZone && (
                        <p className="mt-2 text-[10px] text-[#77736d]">
                          Delivery to {selectedZone.name}:{' '}
                          <strong className="text-[#24231f]">
                            {formatPrice(selectedZone.deliveryFeeCents)}
                          </strong>
                        </p>
                      )}
                    </div>
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
                      <p className={sectionLabel}>AVAILABLE DELIVERY DATES</p>

                      {loadingSchedules ? (
                        <div className="flex items-center gap-2 text-[10px] text-[#77736d]">
                          <LoaderCircle size={13} className="animate-spin" />
                          Loading delivery dates...
                        </div>
                      ) : schedules.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {[
                            ...new Set(schedules.map((schedule) => schedule.date.slice(0, 10))),
                          ].map((date) => {
                            const selected = schedules.some(
                              (schedule) =>
                                schedule.id === selectedScheduleId &&
                                schedule.date.slice(0, 10) === date,
                            );

                            return (
                              <button
                                type="button"
                                key={date}
                                onClick={() => {
                                  const first = schedules.find(
                                    (schedule) => schedule.date.slice(0, 10) === date,
                                  );

                                  setSelectedScheduleId(first?.id ?? '');
                                  invalidateCheckoutRequest();
                                }}
                                aria-pressed={selected}
                                className={`border p-3 text-left transition-colors ${
                                  selected
                                    ? 'border-brand bg-brand text-white'
                                    : 'border-[#e9e6df] bg-white hover:border-brand'
                                }`}
                              >
                                <span className="block text-[9px]">
                                  {new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
                                    weekday: 'short',
                                  })}
                                </span>

                                <strong className="my-1 block text-[12px] font-semibold">
                                  {new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </strong>

                                <span className="text-[9px]">
                                  {
                                    schedules.filter(
                                      (schedule) => schedule.date.slice(0, 10) === date,
                                    ).length
                                  }{' '}
                                  available slots
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">
                          No delivery schedules are currently available for this zone. Please try
                          another area or contact us.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className={sectionLabel}>AVAILABLE TIME SLOTS</p>

                      {selectedSchedule ? (
                        <div className="space-y-2">
                          {schedules
                            .filter(
                              (schedule) =>
                                schedule.date.slice(0, 10) === selectedSchedule.date.slice(0, 10),
                            )
                            .map((schedule) => (
                              <button
                                type="button"
                                key={schedule.id}
                                onClick={() => {
                                  setSelectedScheduleId(schedule.id);
                                  invalidateCheckoutRequest();
                                }}
                                aria-pressed={selectedScheduleId === schedule.id}
                                className={`${card} flex w-full min-w-0 items-center justify-between gap-3 px-3 py-3 text-left transition-colors ${
                                  selectedScheduleId === schedule.id
                                    ? 'border-brand'
                                    : 'hover:border-brand'
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Clock3 size={14} className="shrink-0 text-brand" />

                                  <span className="min-w-0">
                                    <strong className="block text-[10px] font-semibold">
                                      {formatSlot(schedule)}
                                    </strong>

                                    <span className="mt-1 block text-[9px] text-[#88847d]">
                                      {schedule.label || 'Scheduled delivery'}
                                    </span>
                                  </span>
                                </span>

                                {selectedScheduleId === schedule.id ? (
                                  <Check size={14} className="shrink-0 text-brand" />
                                ) : (
                                  <span className="text-[9px] text-[#88847d]">Select</span>
                                )}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#88847d]">
                          Select a delivery date to view available times.
                        </p>
                      )}
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
                      <Pencil size={11} />
                      Edit bag
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
                    <div className="mb-2.5 flex items-center justify-between gap-3">
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
                          {address.area}, {address.city}, {address.region}
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

                    {selectedZone && (
                      <p className="mt-1 text-[9px] text-[#88847d]">{selectedZone.name}</p>
                    )}
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

                    {showAddress && selectedSchedule ? (
                      <>
                        <p className="m-0 text-[10px] font-medium">
                          {formatDate(selectedSchedule.date)}
                        </p>

                        <p className="mt-1 mb-0 text-[10px] text-[#77736d]">
                          {formatSlot(selectedSchedule)}
                        </p>
                      </>
                    ) : (
                      <p className="m-0 text-[10px] text-[#77736d]">
                        {showAddress
                          ? 'No delivery schedule selected.'
                          : 'Collection time will be confirmed after your order.'}
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
                  <ArrowLeft size={12} />
                  Back
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[10px] font-medium text-[#77736d] hover:text-brand"
                >
                  <ArrowLeft size={12} />
                  Back
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
                  disabled={submitting || (showAddress && (!selectedZoneId || !selectedScheduleId))}
                  onClick={() => void placeOrder()}
                  className={`${primaryButton} flex-1 sm:flex-none`}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={13} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Paystack
                      <ArrowRight size={12} />
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

              {selectedZone && (
                <div className="flex items-center justify-between gap-3 text-[9px] text-[#88847d]">
                  <span>Delivery zone</span>
                  <span>{selectedZone.name}</span>
                </div>
              )}
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
