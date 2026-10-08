import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
  Package,
  Snowflake,
  Leaf,
  Sparkle,
  CheckCircle,
} from "lucide-react";
export const BADGES = [
  { label: "Every Cut Certified" },
  { label: "Cold Chain Delivery" },
  { label: "100% Organic" },
];

export const FEATURES = [
  {
    title: "Certified Processing",
    subtitle: "HACCP STANDARD FACILITY",
    icon: ShieldCheck,
  },
  {
    title: "Fresh Daily",
    subtitle: "PORTIONED EVERY MORNING",
    icon: Sparkle,
  },
  {
    title: "Fast Delivery",
    subtitle: "SAME-DAY ACROSS LAGOS",
    icon: Snowflake,
  },
  {
    title: "Secure Payment",
    subtitle: "ENCRYPTED CHECKOUT",
    icon: ShieldCheck,
  },
  {
    title: "Trusted by Families",
    subtitle: "12,000+ HAPPY HOMES",
    icon: Leaf,
  },
];

export const ROLE_STYLES: Record<
  string,
  {
    label: string;
    avatar: string; // avatar circle background
    badge: string; // text/background for the small role badge
    mobileAccent: string; // background/border used for mobile menu links tied to this role
  }
> = {
  ADMIN: {
    label: "Admin",
    avatar: "bg-red-500",
    badge: "bg-red-50 text-red-600",
    mobileAccent: "bg-red-500 text-white",
  },
  SUPPLIER: {
    label: "Supplier",
    avatar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600",
    mobileAccent: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  CUSTOMER: {
    label: "Customer",
    avatar: "bg-brand",
    badge: "bg-brand/10 text-brand",
    mobileAccent: "bg-neutral-50 text-[#2D2D2D]",
  },
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

const search = (q: string) => `https://unsplash.com/s/photos/${q}`;

export type Category = {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  find: string;
};

export const categories: Category[] = [
  {
    slug: "beef",
    title: "BEEF",
    description: "Steaks, roasts, mince, ribs.",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=85",
    find: search("raw-beef-steak"),
  },

  {
    slug: "chicken",
    title: "CHICKEN",
    description: "Whole, breasts, thighs, wings.",
    image:
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=900&q=85",
    find: search("raw-chicken"),
  },

  {
    slug: "goat",
    title: "GOAT & LAMB",
    description: "Bone-in chops, leg, stew pieces.",
    image:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85",
    find: search("lamb-chops"),
  },

  {
    slug: "pork",
    title: "PORK",
    description: "Ribs, belly, chops, offal.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    find: search("pork-belly"),
  },

  {
    slug: "bbq",
    title: "BBQ",
    description: "Ribs, skewers, marinated cuts.",
    image:
      "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=85",
    find: search("bbq-meat"),
  },

  {
    slug: "sausages",
    title: "SAUSAGES",
    description: "Fresh and smoked links.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    find: search("sausages"),
  },

  {
    slug: "turkey",
    title: "TURKEY",
    description: "Whole birds, breast, drumsticks.",
    image:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=85",
    find: search("raw-turkey"),
  },

  {
    slug: "seafood",
    title: "SEAFOOD",
    description: "Fish, prawns, shellfish.",
    image:
      "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=900&q=85",
    find: search("fresh-seafood"),
  },

  {
    slug: "frozen",
    title: "FROZEN",
    description: "Frozen packs, ready to stock.",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=85",
    find: search("frozen-meat"),
  },

  {
    slug: "dairy",
    title: "DAIRY",
    description: "Milk, cheese, butter, eggs.",
    image:
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=900&q=85",
    find: search("dairy-products"),
  },

  {
    slug: "spices",
    title: "SPICES",
    description: "Rubs, marinades, seasoning.",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85",
    find: search("spices"),
  },
];

export const highlights = [
  "HYGIENICALLY PROCESSED",
  "PACKED & SEALED ON ICE",
  "CUT EXACTLY HOW YOU LIKE",
  "FRESHNESS GUARANTEE",
];
export const products = [
  {
    category: "BEEF",
    name: "RIBEYE STEAK",
    description: "Well-marbled, cut 2–3 cm thick.",
    price: "₦12,000/kg",
    image:
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "GOAT",
    name: "GOAT STEW PIECES",
    description: "Bone-in, chopped to stew size.",
    price: "₦9,500/kg",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "CHICKEN",
    name: "CHICKEN THIGHS",
    description: "Skin-on or skinless, trimmed.",
    price: "₦4,500/kg",
    image:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "BEEF",
    name: "LEAN BEEF MINCE",
    description: "Ground fresh, never pre-packed.",
    price: "₦7,000/kg",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
  },
];

export const faqs = [
  {
    question: "HOW DO I CHOOSE MY CUT AND WEIGHT?",
    answer:
      "Choose a product, select the quantity you need and add it to your cart. Weight options are shown on each product.",
  },
  {
    question: "HOW IS THE MEAT KEPT FRESH IN TRANSIT?",
    answer:
      "Orders are chilled immediately after cutting, sealed securely and transported in temperature-controlled packaging.",
  },
  {
    question: "WHAT ARE YOUR DELIVERY AREAS AND TIMES?",
    answer:
      "Delivery slots are shown at checkout based on your address and current availability.",
  },
  {
    question: "CAN I CHANGE OR CANCEL AN ORDER?",
    answer:
      "Contact us as soon as possible. Orders already being prepared may not be changeable.",
  },
  {
    question: "WHAT IF I'M NOT HAPPY WITH MY ORDER?",
    answer:
      "Contact support with your order number and we will review the issue and arrange the appropriate resolution.",
  },
];

export const slides = [
  {
    lines: ["POULTRY.", "FRESH CHICKEN,", "NEVER PRE‑PACKED."], // ‑ is a non-breaking hyphen
    text: "Whole birds, thighs, breasts and wings, skin-on or skinless.",
    cta: { label: "SHOP CHICKEN", target: "shop" },
    image:
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1400&q=90",
  },
  {
    lines: ["BEEF.", "PREMIUM CUTS,", "CUT TO ORDER."],
    text: "Steaks, ribs and mince, trimmed and portioned how you like.",
    cta: { label: "SHOP BEEF", target: "shop" },
    image:
      "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=85",
  },
  {
    lines: ["MEATBOXES.", "STOCK UP,", "SAVE MORE."],
    text: "Mixed boxes packed on ice and delivered fresh to your door.",
    cta: { label: "SEE MEATBOXES", target: "meatbox" },
    image:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85",
  },
];
