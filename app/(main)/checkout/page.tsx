"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Edit3,
  LockKeyhole,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from "lucide-react";

import type {
  Address,
  CartItem,
  DeliveryDate,
  DeliveryMethod,
  DeliverySlot,
} from "@/lib/types";
import { fetchWithAuth } from "@/lib/fetchClient";
import { formatNaira } from "@/lib/format";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import {
  isTempItem,
  maxQuantityFor,
  useCartActions,
} from "@/lib/hooks/useCartActions";

const STEPS = [
  "Cart Review",
  "Delivery Method",
  "Delivery Address",
  "Delivery Schedule",
  "Review Order",
  "Payments",
];

const LAST_STEP = STEPS.length;

const HOME_DELIVERY_FEE = 9.5;
const DISCOUNT_RATE = 0.1;
const TAX_RATE = 0.087;
const DISCOUNT_CODE = "CHOP10";

const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: "8-10", label: "8:00 – 10:00 AM", subtitle: "Early morning", price: 0 },
  { id: "10-12", label: "10:00 – 12:00 PM", subtitle: "Late morning", price: 0 },
  {
    id: "12-2",
    label: "12:00 – 2:00 PM",
    subtitle: "Midday",
    price: 0,
    disabled: true,
  },
  { id: "2-4", label: "2:00 – 4:00 PM", subtitle: "Afternoon", price: 0 },
  { id: "4-6", label: "4:00 – 6:00 PM", subtitle: "Early evening", price: 2.5 },
  { id: "6-8", label: "6:00 – 8:00 PM", subtitle: "Evening", price: 4 },
];

const DELIVERY_METHODS = [
  {
    id: "home" as const,
    title: "Home Delivery",
    icon: Truck,
    price: formatNaira(HOME_DELIVERY_FEE),
    description:
      "Collect from a ChunkNChop rider. Kept chilled until you pickup.",
    meta: "Arrives in a 2-hour window",
  },
  {
    id: "pickup" as const,
    title: "Store Pickup",
    icon: Store,
    price: "Free",
    description:
      "Collect from a ChunkNChop counter. Kept fresh until you arrive.",
    meta: "Ready the same day",
  },
];

const ADDRESS_FIELDS = [
  ["label", "Label"],
  ["fullName", "Full name"],
  ["address", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["zipCode", "ZIP code"],
  ["country", "Country"],
  ["phone", "Phone"],
] as const;

const EYEBROW = "text-[11px] font-semibold tracking-[0.14em] uppercase";
const PRIMARY_BUTTON =
  "bg-brand inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const CARD = "rounded-xl border border-[#E7DED3] bg-white";

interface NewAddress {
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY_ADDRESS: NewAddress = {
  label: "Home",
  fullName: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "Nigeria",
  phone: "",
  isDefault: false,
};

const toDateValue = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

function getDeliveryDates(): DeliveryDate[] {
  const today = new Date();

  return Array.from({ length: 9 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);

    return {
      value: toDateValue(date),
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.toLocaleDateString("en-US", { day: "numeric" }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    };
  });
}

const getItemPrice = (item: CartItem) => {
  const tier = item.product.tiers?.find((t) => t.name === item.selectedTier);
  return tier?.price ?? item.product.basePrice ?? 0;
};

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { items, clearCart } = useCartStore();
  const { setQuantity, removeItem } = useCartActions();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const dateOptions = useMemo(getDeliveryDates, []);
  const [selectedDate, setSelectedDate] = useState(
    () => dateOptions[0]?.value ?? "",
  );
  const [selectedSlot, setSelectedSlot] = useState("10-12");
  const [notes, setNotes] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [newAddress, setNewAddress] = useState<NewAddress>(EMPTY_ADDRESS);

  const cartItems = items as CartItem[];
  const hasPendingItems = cartItems.some((item) => isTempItem(item.id));

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + getItemPrice(item) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const selectedSlotData =
    DELIVERY_SLOTS.find((slot) => slot.id === selectedSlot) ??
    DELIVERY_SLOTS[1];
  const deliveryFee =
    deliveryMethod === "home" ? HOME_DELIVERY_FEE + selectedSlotData.price : 0;
  const discount = subtotal * DISCOUNT_RATE;
  const taxes = Math.max(0, subtotal - discount) * TAX_RATE;
  const total = subtotal + deliveryFee - discount + taxes;

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  useEffect(() => {
    if (!isHydrated || user) return;
    router.push(`/auth/login?redirect=${encodeURIComponent("/checkout")}`);
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (!isHydrated || !user) return;

    let cancelled = false;

    (async () => {
      try {
        setAddressesLoading(true);

        const response = await fetchWithAuth("/api/customer/addresses", {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load addresses");
        }
        if (cancelled) return;

        const loaded: Address[] = data.addresses ?? [];
        const fallback = loaded.find((a) => a.isDefault) ?? loaded[0];

        setAddresses(loaded);
        setSelectedAddressId(fallback?.id ?? "");
        setShowNewAddressForm(!fallback);
      } catch (error) {
        if (cancelled) return;

        console.error("Address loading error:", error);
        setAddresses([]);
        setShowNewAddressForm(true);
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load your saved addresses. Please enter your delivery address below.",
        );
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, user]);

  const createAddress = useCallback(async () => {
    if (!isHydrated || !user) {
      toast.error("Your session has expired.");
      return;
    }

    const required: (keyof NewAddress)[] = [
      "fullName",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
      "phone",
    ];

    if (required.some((key) => !String(newAddress[key]).trim())) {
      toast.error("Please complete all address fields.");
      return;
    }

    try {
      setAddressSaving(true);

      const response = await fetchWithAuth("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create address");
      }

      const created: Address = data.address;

      setAddresses((previous) => [
        created,
        ...previous.filter((address) => address.id !== created.id),
      ]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      setNewAddress(EMPTY_ADDRESS);
      toast.success("Address saved");
    } catch (error) {
      console.error("Create address error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create address",
      );
    } finally {
      setAddressSaving(false);
    }
  }, [isHydrated, user, newAddress]);

  const waitForCartSync = () => {
    if (!hasPendingItems) return false;
    toast("Updating your cart, one moment…");
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      setStep(3);
      toast.error("Please select a delivery address");
      return;
    }

    if (!isHydrated || !user) {
      toast.error("Your session has expired. Please sign in again.");
      router.push(`/auth/login?redirect=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (waitForCartSync()) return;

    setLoading(true);

    try {
      const response = await fetchWithAuth("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => item.id),
          shippingAddress: `${selectedAddress.fullName}, ${selectedAddress.address}`,
          shippingCity: selectedAddress.city,
          shippingState: selectedAddress.state,
          shippingZip: selectedAddress.zipCode,
          shippingCountry: selectedAddress.country,
          deliveryMethod,
          deliveryDate: selectedDate,
          deliverySlot: selectedSlot,
          deliveryNotes: notes,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create order");
      }

      if (!data.authorizationUrl) {
        throw new Error("Payment link was not returned.");
      }

      clearCart();
      toast.success("Order created. Redirecting to Paystack...");
      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process checkout",
      );
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && waitForCartSync()) return;

    if (step === 3 && !selectedAddress) {
      toast.error("Please select or add a delivery address");
      return;
    }

    setStep((current) => Math.min(LAST_STEP, current + 1));
  };

  const previousStep = () => setStep((current) => Math.max(1, current - 1));

  if (!isHydrated || !user) return null;

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <ShoppingBag className="text-brand mx-auto mb-5 h-12 w-12" />
          <h1 className="text-2xl font-bold text-[#2A2521] sm:text-3xl">
            Your cart is empty
          </h1>
          <p className="mt-3 text-sm text-[#7E746A]">
            Add some cuts to your cart before proceeding to checkout.
          </p>
          <Link href="/shop" className={`${PRIMARY_BUTTON} mt-8 px-6`}>
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-6 text-[#2A2521] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <CheckoutProgress step={step} />

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <section className="min-w-0">
            {step === 1 && (
              <CartReview
                items={cartItems}
                onQuantityChange={setQuantity}
                onRemove={removeItem}
              />
            )}

            {step === 2 && (
              <DeliveryMethodStep
                value={deliveryMethod}
                onChange={setDeliveryMethod}
              />
            )}

            {step === 3 && (
              <DeliveryAddressStep
                addresses={addresses}
                loading={addressesLoading}
                selectedAddressId={selectedAddressId}
                onSelect={setSelectedAddressId}
                showNewAddressForm={showNewAddressForm}
                onShowNewAddressForm={() => setShowNewAddressForm(true)}
                onHideNewAddressForm={() => setShowNewAddressForm(false)}
                newAddress={newAddress}
                setNewAddress={setNewAddress}
                onCreateAddress={createAddress}
                addressSaving={addressSaving}
              />
            )}

            {step === 4 && (
              <DeliveryScheduleStep
                dates={dateOptions}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                notes={notes}
                onDateChange={setSelectedDate}
                onSlotChange={setSelectedSlot}
                onNotesChange={setNotes}
              />
            )}

            {step === 5 && (
              <ReviewOrder
                items={cartItems}
                address={selectedAddress}
                deliveryMethod={deliveryMethod}
                slot={selectedSlotData}
                selectedDate={selectedDate}
                onEdit={setStep}
              />
            )}

            {step === 6 && (
              <PaymentStep
                total={total}
                email={user.email || ""}
                loading={loading}
                onPay={handleSubmit}
              />
            )}

            <div className="mt-7 flex items-center justify-between border-t border-[#E7DED3] pt-5">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 1 || loading}
                className="inline-flex h-10 items-center gap-2 text-sm font-medium text-[#776E65] disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <span className="text-xs text-[#8B8177]">
                Step {step} of {LAST_STEP}
              </span>

              {step < LAST_STEP ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={PRIMARY_BUTTON}
                >
                  {step === 5 ? "Continue to Payment" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <span className="w-24" />
              )}
            </div>
          </section>

          <OrderSummary
            items={cartItems}
            subtotal={subtotal}
            delivery={deliveryFee}
            discount={discount}
            taxes={taxes}
            total={total}
            step={step}
            loading={loading}
            onContinue={step < LAST_STEP ? nextStep : handleSubmit}
          />
        </div>
      </div>
    </main>
  );
}

function CheckoutProgress({ step }: { step: number }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-3 right-4 left-4 h-px bg-[#E6DDD2]" />

        {STEPS.map((label, index) => {
          const number = index + 1;
          const completed = number < step;
          const active = number === step;

          return (
            <div
              key={label}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium",
                  completed
                    ? "border-brand bg-brand text-white"
                    : active
                      ? "border-brand text-brand bg-[#FFF9F5]"
                      : "border-[#E7DED3] bg-[#FCFBF8] text-[#B7ADA2]",
                ].join(" ")}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : number}
              </div>

              <span
                className={[
                  "hidden text-center text-xs sm:block",
                  active || completed
                    ? "font-medium text-[#403832]"
                    : "text-[#AAA096]",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs font-medium text-[#403832] sm:hidden">
        {STEPS[step - 1]}
      </p>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className={`${EYEBROW} text-brand mb-1.5`}>{eyebrow}</p>
      <h1 className="text-2xl leading-tight font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#857B71]">
        {description}
      </p>
    </header>
  );
}

function ProductImage({
  item,
  small = false,
}: {
  item: CartItem;
  small?: boolean;
}) {
  return (
    <div
      className={[
        "shrink-0 overflow-hidden rounded-xl border border-[#E9E0D7] bg-[#F2ECE5]",
        small ? "h-10 w-10" : "h-14 w-14",
      ].join(" ")}
    >
      {item.product.images?.[0] ? (
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ShoppingBag className="h-4 w-4 text-[#B0A59A]" />
        </div>
      )}
    </div>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={[
        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
        selected ? "border-brand bg-brand" : "border-[#E2D8CD]",
      ].join(" ")}
    >
      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

function CartReview({
  items,
  onQuantityChange,
  onRemove,
}: {
  items: CartItem[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Step 1 of 6"
        title="Review your cuts"
        description="Everything is butchered to order the morning of delivery. Adjust quantities before you continue."
      />

      <div className={`${CARD} overflow-hidden`}>
        {items.map((item, index) => {
          const syncing = isTempItem(item.id);
          const max = maxQuantityFor(item.product.stock);

          return (
            <div
              key={item.id}
              className={[
                "flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:px-5",
                index < items.length - 1 ? "border-b border-[#EEE7DE]" : "",
              ].join(" ")}
            >
              <ProductImage item={item} />

              <div className="min-w-0 flex-1 basis-40">
                <h3 className="truncate text-sm font-semibold">
                  {item.product.name}
                </h3>

                <p className="mt-1 text-xs text-[#8B8177]">
                  {item.selectedPreparation}
                  {item.selectedTier ? ` · ${item.selectedTier}` : ""}
                </p>

                <p className="mt-1.5 text-xs text-[#6E655C]">
                  {formatNaira(getItemPrice(item))}
                </p>
              </div>

              <div
                className={[
                  "flex items-center rounded-full border border-[#E8DED4] bg-[#FCFAF7]",
                  syncing ? "opacity-50" : "",
                ].join(" ")}
              >
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${item.product.name}`}
                  disabled={syncing || item.quantity <= 1}
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#F3EEE8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <span
                  className="w-7 text-center text-sm font-medium tabular-nums"
                  aria-live="polite"
                >
                  {item.quantity}
                </span>

                <button
                  type="button"
                  aria-label={`Increase quantity of ${item.product.name}`}
                  disabled={syncing || item.quantity >= max}
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#F3EEE8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="text-brand ml-auto w-24 text-right text-sm font-bold tabular-nums">
                {formatNaira(getItemPrice(item) * item.quantity)}
              </div>

              <button
                type="button"
                aria-label={`Remove ${item.product.name}`}
                disabled={syncing}
                onClick={() => onRemove(item.id)}
                className="text-brand flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#FFF0E9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DeliveryMethodStep({
  value,
  onChange,
}: {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Step 2 of 6"
        title="How would you like it?"
        description="Both options keep your order under 4°C from our counter to your kitchen."
      />

      <div className="space-y-3">
        {DELIVERY_METHODS.map(
          ({ id, title, icon: Icon, price, description, meta }) => {
            const selected = value === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                aria-pressed={selected}
                className={[
                  `${CARD} block w-full p-4 text-left transition`,
                  selected ? "border-brand" : "",
                ].join(" ")}
              >
                <div className="flex gap-3">
                  <RadioDot selected={selected} />

                  <span className="text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#FFF0E9]">
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-3">
                      <span className="text-sm font-semibold">{title}</span>
                      <span className="text-sm font-semibold">{price}</span>
                    </span>

                    <span className="mt-1.5 block text-xs leading-5 text-[#8B8177]">
                      {description}
                    </span>

                    <span className="mt-1.5 flex items-center gap-1.5 text-xs text-[#8B8177]">
                      <Clock3 className="h-3 w-3" />
                      {meta}
                    </span>
                  </span>
                </div>
              </button>
            );
          },
        )}
      </div>
    </>
  );
}

function DeliveryAddressStep({
  addresses,
  loading,
  selectedAddressId,
  onSelect,
  showNewAddressForm,
  onShowNewAddressForm,
  onHideNewAddressForm,
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
  onHideNewAddressForm: () => void;
  newAddress: NewAddress;
  setNewAddress: Dispatch<SetStateAction<NewAddress>>;
  onCreateAddress: () => void;
  addressSaving: boolean;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Step 3 of 6"
        title="Where should we deliver?"
        description="Pick a saved address or add a new one. We'll text you when the driver is 15 minutes away."
      />

      {loading ? (
        <div className={`${CARD} p-8 text-center text-sm text-[#8B8177]`}>
          Loading your saved addresses…
        </div>
      ) : (
        <>
          {addresses.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {addresses.map((address) => {
                const selected = selectedAddressId === address.id;

                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => onSelect(address.id)}
                    aria-pressed={selected}
                    className={[
                      `${CARD} p-4 text-left transition`,
                      selected
                        ? "border-brand shadow-[0_8px_24px_rgba(62,43,30,0.05)]"
                        : "",
                    ].join(" ")}
                  >
                    <div className="flex gap-3">
                      <RadioDot selected={selected} />

                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {address.label}

                          {address.isDefault && (
                            <span className="rounded bg-[#F3EEE8] px-1.5 py-0.5 text-[11px] font-medium text-[#8C8177]">
                              Default
                            </span>
                          )}
                        </span>

                        <span className="mt-2 block text-xs leading-5 text-[#857B71]">
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
            <button
              type="button"
              onClick={onShowNewAddressForm}
              className={`${CARD} mt-3 flex w-full items-center gap-3 p-4 text-left`}
            >
              <span className="bg-brand flex h-8 w-8 items-center justify-center rounded-full text-white">
                <Plus className="h-4 w-4" />
              </span>

              <span>
                <span className="block text-sm font-semibold">
                  Add a new address
                </span>
                <span className="block text-xs text-[#8B8177]">
                  Deliver this order somewhere else
                </span>
              </span>
            </button>
          )}

          {showNewAddressForm && (
            <div className={`${CARD} mt-3 p-4`}>
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Add a new address</h3>
                <p className="mt-1 text-xs text-[#8B8177]">
                  This address will be saved to your account.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ADDRESS_FIELDS.map(([name, label]) => (
                  <label key={name} className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#655C54]">
                      {label}
                    </span>

                    <input
                      value={newAddress[name]}
                      onChange={(event) =>
                        setNewAddress((previous) => ({
                          ...previous,
                          [name]: event.target.value,
                        }))
                      }
                      className="focus:border-brand h-10 w-full rounded-lg border border-[#E6DDD2] bg-[#FCFBF9] px-3 text-sm outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={onHideNewAddressForm}
                    className="h-10 rounded-lg border border-[#E7DED3] px-4 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={onCreateAddress}
                  disabled={addressSaving}
                  className={PRIMARY_BUTTON}
                >
                  {addressSaving ? "Saving…" : "Save Address"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function DeliveryScheduleStep({
  dates,
  selectedDate,
  selectedSlot,
  notes,
  onDateChange,
  onSlotChange,
  onNotesChange,
}: {
  dates: DeliveryDate[];
  selectedDate: string;
  selectedSlot: string;
  notes: string;
  onDateChange: (value: string) => void;
  onSlotChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Step 4 of 6"
        title="Pick a delivery window"
        description="Choose the day and two-hour window that suits you. You can reschedule up to 12 hours before."
      />

      <p className={`${EYEBROW} mb-2 text-[#8B8177]`}>Date</p>

      <div className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-5 lg:grid-cols-9">
        {dates.map((date) => {
          const selected = selectedDate === date.value;

          return (
            <button
              key={date.value}
              type="button"
              onClick={() => onDateChange(date.value)}
              aria-pressed={selected}
              className={[
                "rounded-xl border px-2 py-2.5 text-center transition",
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-[#E7DED3] bg-white text-[#4A423B]",
              ].join(" ")}
            >
              <span className="block text-[11px]">{date.day}</span>
              <strong className="mt-0.5 block text-base leading-none">
                {date.date}
              </strong>
              <span className="mt-1 block text-[11px]">{date.month}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <p className={`${EYEBROW} mb-2 text-[#8B8177]`}>Time slot</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {DELIVERY_SLOTS.map((slot) => {
            const selected = selectedSlot === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={slot.disabled}
                onClick={() => onSlotChange(slot.id)}
                aria-pressed={selected}
                className={[
                  "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3.5 text-left transition",
                  slot.disabled
                    ? "cursor-not-allowed border-[#EEE8E0] bg-[#FAF8F5] text-[#B8AEA4]"
                    : selected
                      ? "border-brand bg-white"
                      : "border-[#E7DED3] bg-white",
                ].join(" ")}
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {slot.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#8B8177]">
                    {slot.subtitle}
                  </span>
                </span>

                <span className="text-brand shrink-0 text-xs font-semibold">
                  {slot.disabled
                    ? "Fully booked"
                    : slot.price
                      ? `+${formatNaira(slot.price)}`
                      : "Free"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-6 block">
        <span className={`${EYEBROW} mb-2 flex items-center gap-1.5 text-[#8B8177]`}>
          <Clock3 className="text-brand h-3.5 w-3.5" />
          Notes for the butcher or driver
        </span>

        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={3}
          className="focus:border-brand w-full resize-none rounded-xl border border-[#E7DED3] bg-white px-3 py-3 text-sm outline-none"
          placeholder="Leave with the concierge, chuck it on the..."
        />
      </label>
    </>
  );
}

function ReviewCard({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`${EYEBROW} text-[#8B8177]`}>{title}</span>

        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-brand text-xs font-medium"
        >
          Edit
        </button>
      </div>

      {children}
    </div>
  );
}

function ReviewOrder({
  items,
  address,
  deliveryMethod,
  slot,
  selectedDate,
  onEdit,
}: {
  items: CartItem[];
  address: Address | null;
  deliveryMethod: DeliveryMethod;
  slot: DeliverySlot;
  selectedDate: string;
  onEdit: (step: number) => void;
}) {
  const formattedDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <>
      <PageHeading
        eyebrow="Step 5 of 6"
        title="One last look"
        description="Confirm the details below, then place your order. You'll get a receipt and live tracking by text."
      />

      <div className={`${CARD} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <span className={`${EYEBROW} text-[#8B8177]`}>Your cuts</span>

          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-brand flex items-center gap-1 text-xs font-medium"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <ProductImage item={item} small />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.product.name}
                </p>
                <p className="text-xs text-[#958B80]">
                  {item.quantity} × {formatNaira(getItemPrice(item))}
                </p>
              </div>

              <span className="text-brand text-sm font-bold">
                {formatNaira(getItemPrice(item) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ReviewCard title="Delivery address" step={3} onEdit={onEdit}>
          {address ? (
            <div className="text-xs leading-5 text-[#786F66]">
              <p>{address.fullName}</p>
              <p>{address.address}</p>
              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
            </div>
          ) : (
            <p className="text-xs text-red-500">No address selected</p>
          )}
        </ReviewCard>

        <ReviewCard title="Delivery method" step={2} onEdit={onEdit}>
          <p className="text-sm font-medium">
            {deliveryMethod === "home" ? "Home Delivery" : "Store Pickup"}
          </p>
          <p className="mt-1 text-xs text-[#786F66]">
            {deliveryMethod === "home"
              ? `${formatNaira(HOME_DELIVERY_FEE)} delivery`
              : "Free pickup"}
          </p>
        </ReviewCard>

        <ReviewCard title="Schedule" step={4} onEdit={onEdit}>
          <p className="text-sm font-medium">{formattedDate}</p>
          <p className="mt-1 text-xs text-[#786F66]">{slot.label}</p>
        </ReviewCard>

        <ReviewCard title="Payment" step={6} onEdit={onEdit}>
          <p className="text-sm font-medium">Paystack</p>
          <p className="mt-1 text-xs text-[#786F66]">
            Card, bank transfer, USSD & more
          </p>
        </ReviewCard>
      </div>
    </>
  );
}

function PaymentStep({
  total,
  email,
  loading,
  onPay,
}: {
  total: number;
  email: string;
  loading: boolean;
  onPay: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Step 6 of 6"
        title="Ready to pay?"
        description="You'll be securely redirected to Paystack to choose your preferred payment method."
      />

      <div className={`${CARD} p-5 sm:p-6`}>
        <div className="mx-auto max-w-md text-center">
          <div className="text-brand mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0E9]">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-lg font-bold">Secure payment</h2>

          <p className="mt-2 text-sm leading-6 text-[#857B71]">
            Your payment details are entered directly on Paystack&apos;s secure
            checkout.
          </p>

          <div className="mt-6 rounded-xl bg-[#FCFAF7] p-4 text-left">
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-[#857B71]">Email</span>
              <span className="truncate">{email}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#EAE2D8] pt-3">
              <span className="text-sm font-semibold">Amount due</span>
              <span className="text-lg font-bold">{formatNaira(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onPay}
            disabled={loading}
            className={`${PRIMARY_BUTTON} mt-5 h-12 w-full`}
          >
            {loading ? "Creating order…" : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </>
  );
}

function OrderSummary({
  items,
  subtotal,
  delivery,
  discount,
  taxes,
  total,
  step,
  onContinue,
  loading,
}: {
  items: CartItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  taxes: number;
  total: number;
  step: number;
  onContinue: () => void;
  loading: boolean;
}) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside
      className={`${CARD} p-4 shadow-[0_8px_28px_rgba(61,45,31,0.08)] sm:p-5 lg:sticky lg:top-6`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Order Summary</h2>
        <span className="text-xs text-[#8B8177]">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <ProductImage item={item} small />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{item.product.name}</p>
              <p className="mt-0.5 text-[11px] text-[#8B8177]">
                {item.quantity} × {formatNaira(getItemPrice(item))}
              </p>
            </div>

            <span className="text-xs">
              {formatNaira(getItemPrice(item) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-[#EEE7DE]" />

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between">
          <span className="text-[#857B71]">Products</span>
          <span>{formatNaira(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#857B71]">Delivery</span>
          <span>{formatNaira(delivery)}</span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-[#857B71]">
            Discount
            <span className="text-brand rounded-full bg-[#FFF0E9] px-1.5 py-0.5 text-[11px] font-bold">
              {DISCOUNT_CODE}
            </span>
          </span>
          <span className="text-brand">− {formatNaira(discount)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#857B71]">Taxes</span>
          <span>{formatNaira(taxes)}</span>
        </div>
      </div>

      <div className="my-4 border-t border-[#EEE7DE]" />

      <div className="flex items-end justify-between">
        <span className="text-sm font-bold">Total</span>
        <span className="text-xl font-bold">{formatNaira(total)}</span>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={loading}
        className={`${PRIMARY_BUTTON} mt-4 w-full`}
      >
        {loading
          ? "Processing…"
          : step >= LAST_STEP
            ? "Proceed to Payment"
            : "Continue"}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#8B8177]">
        <LockKeyhole className="h-3 w-3 shrink-0" />
        Encrypted payment · Free returns on quality issues
      </div>
    </aside>
  );
}