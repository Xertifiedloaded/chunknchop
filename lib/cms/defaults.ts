
import type { SectionKey } from "./config";

const img = (id: string, w = 900, q = 85) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export type HeroSlide = {
  image: string;
  lines: string[];
  text: string;
  ctaLabel: string;
  ctaTarget: string;
  secondaryLabel: string;
  secondaryTarget: string;
};
export type HomeCategory = { slug: string; name: string; description: string; image: string | null };
export type SectionCopy = { eyebrow?: string; heading: string; subtext?: string; image?: string; buttonLabel?: string; secondaryLabel?: string };
export type Step = { number: string; title: string; description: string };
export type Meatbox = { id: string; label: string; title: string; contents: string; price: number; featured: boolean; link?: string };
export type StandardPoint = { title: string; description: string };
export type Faq = { question: string; answer: string };

const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : []);

export function toHeroSlide(d: Record<string, unknown>): HeroSlide {
  return {
    image: str(d.image),
    lines: arr(d.lines),
    text: str(d.text),
    ctaLabel: str(d.ctaLabel, "SHOP NOW"),
    ctaTarget: str(d.ctaTarget, "shop"),
    secondaryLabel: str(d.secondaryLabel, "SEE MEATBOXES"),
    secondaryTarget: str(d.secondaryTarget, "meatbox"),
  };
}

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    lines: ["POULTRY.", "FRESH CHICKEN,", "NEVER PRE‑PACKED."],
    text: "Whole birds, thighs, breasts and wings, skin-on or skinless.",
    ctaLabel: "SHOP CHICKEN",
    ctaTarget: "shop",
    secondaryLabel: "SEE MEATBOXES",
    secondaryTarget: "meatbox",
    image: img("photo-1587593810167-a84920ea0781", 1600, 90),
  },
  {
    lines: ["BEEF.", "PREMIUM CUTS,", "CUT TO ORDER."],
    text: "Steaks, ribs and mince, trimmed and portioned how you like.",
    ctaLabel: "SHOP BEEF",
    ctaTarget: "shop",
    secondaryLabel: "SEE MEATBOXES",
    secondaryTarget: "meatbox",
    image: img("photo-1603048297172-c92544798d5a", 1600, 90),
  },
  {
    lines: ["MEATBOXES.", "STOCK UP,", "SAVE MORE."],
    text: "Mixed boxes packed on ice and delivered fresh to your door.",
    ctaLabel: "SEE MEATBOXES",
    ctaTarget: "meatbox",
    secondaryLabel: "SHOP ALL CUTS",
    secondaryTarget: "shop",
    image: img("photo-1529692236671-f1f6cf9683ba", 1600, 90),
  },
];

export const DEFAULT_HIGHLIGHTS = ["HYGIENICALLY PROCESSED", "PACKED & SEALED ON ICE", "CUT EXACTLY HOW YOU LIKE", "FRESHNESS GUARANTEE"];


export const DEFAULT_SECTIONS: Record<SectionKey, SectionCopy> = {
  shop: {
    eyebrow: "SHOP BY MEAT",
    heading: "WHAT ARE YOU COOKING?",
    subtext: "From everyday staples to weekend showstoppers, every category is trimmed on request.",
    buttonLabel: "VIEW ALL",
  },
  bestsellers: {
    eyebrow: "BEST SELLERS",
    heading: "BUTCHER'S FAVOURITES",
    subtext: "Price per kilo. Add to cart and set your cut size at checkout.",
  },
  how: { eyebrow: "HOW IT WORKS", heading: "FROM OUR BLOCK TO YOUR KITCHEN" },
  meatbox: {
    eyebrow: "MEATBOX",
    heading: "PICK A MEATBOX, SKIP THE DECISIONS",
    subtext: "Ready-made boxes for families, grill days and parties.",
    buttonLabel: "ADD MEATBOX TO CART",
  },
  standard: {
    eyebrow: "OUR STANDARD",
    heading: "FRESHNESS ISN'T A PROMISE. IT'S A PROCESS.",
    subtext: "Every cut is traceable, inspected and temperature-controlled from the first knife stroke to your doorstep.",
    image: img("photo-1558030006-450675393462", 1200, 90),
  },
  faq: { eyebrow: "QUESTIONS", heading: "BEFORE YOU ORDER" },
  newsletter: {
    heading: "FRESH MEAT. ORDERED IN MINUTES.",
    subtext: "Get offers, new cuts and seasonal bundles sent straight to your inbox.",
    buttonLabel: "JOIN THE LIST",
    secondaryLabel: "START YOUR ORDER",
  },
};


export const DEFAULT_STEPS: Step[] = [
  { number: "01", title: "CHOOSE", description: "Browse cuts and tell us your weight, cut and packaging preference." },
  { number: "02", title: "WE CUT", description: "Your order is cut fresh to the exact size you choose." },
  { number: "03", title: "WE PACK", description: "Vacuum-sealed or tray-packed, then boxed with ice to hold the cold chain." },
  { number: "04", title: "YOU COOK", description: "Delivered to your kitchen window. Straight to the freezer, fridge, or fire up the grill." },
];


export const DEFAULT_MEATBOXES: Meatbox[] = [
  { id: "family", label: "WEEKLY", title: "FAMILY MEATBOX", contents: "Beef, chicken and mince quantities", price: 35000, featured: false },
  { id: "grill", label: "MOST POPULAR", title: "GRILL MASTER MEATBOX", contents: "Steaks, ribs, sausages and marinades", price: 48000, featured: true },
  { id: "party", label: "FOR EVENTS", title: "PARTY MEATBOX", contents: "Goat, chicken and beef for 15+ guests", price: 120000, featured: false },
];


export const DEFAULT_STANDARD_POINTS: StandardPoint[] = [
  { title: "SOURCED WITH CARE", description: "Every batch is traceable to a verified farm and supplier." },
  { title: "CUT TO YOUR SPEC", description: "Thickness, trim, bone-in or boneless. You decide." },
  { title: "COLD CHAIN, ALWAYS", description: "Chilled storage, insulated packing and ice for the journey." },
];


export const DEFAULT_FAQS: Faq[] = [
  {
    question: "HOW DO I CHOOSE MY CUT AND WEIGHT?",
    answer: "Choose a product, select the quantity you need and add it to your cart. Weight options are shown on each product.",
  },
  {
    question: "HOW IS THE MEAT KEPT FRESH IN TRANSIT?",
    answer: "Orders are chilled immediately after cutting, sealed securely and transported in temperature-controlled packaging.",
  },
  {
    question: "WHAT ARE YOUR DELIVERY AREAS AND TIMES?",
    answer: "Delivery slots are shown at checkout based on your address and current availability.",
  },
  {
    question: "CAN I CHANGE OR CANCEL AN ORDER?",
    answer: "Contact us as soon as possible. Orders already being prepared may not be changeable.",
  },
  {
    question: "WHAT IF I'M NOT HAPPY WITH MY ORDER?",
    answer: "Contact support with your order number and we will review the issue and arrange the appropriate resolution.",
  },
];


export const DEFAULT_CATEGORIES: HomeCategory[] = [
  { slug: "beef", name: "BEEF", description: "Steaks, roasts, mince, ribs.", image: img("photo-1607623814075-e51df1bdc82f") },
  { slug: "chicken", name: "CHICKEN", description: "Whole, breasts, thighs, wings.", image: img("photo-1587593810167-a84920ea0781") },
  { slug: "goat", name: "GOAT & LAMB", description: "Bone-in chops, leg, stew pieces.", image: img("photo-1529692236671-f1f6cf9683ba") },
  { slug: "pork", name: "PORK", description: "Ribs, belly, chops, offal.", image: img("photo-1544025162-d76694265947") },
  { slug: "bbq", name: "BBQ", description: "Ribs, skewers, marinated cuts.", image: img("photo-1529193591184-b1d58069ecdd") },
  { slug: "sausages", name: "SAUSAGES", description: "Fresh and smoked links.", image: img("photo-1544025162-d76694265947") },
  { slug: "turkey", name: "TURKEY", description: "Whole birds, breast, drumsticks.", image: img("photo-1604503468506-a8da13d82791") },
  { slug: "seafood", name: "SEAFOOD", description: "Fish, prawns, shellfish.", image: img("photo-1534482421-64566f976cfa") },
  { slug: "frozen", name: "FROZEN", description: "Frozen packs, ready to stock.", image: img("photo-1607623814075-e51df1bdc82f") },
  { slug: "dairy", name: "DAIRY", description: "Milk, cheese, butter, eggs.", image: img("photo-1628088062854-d1870b4553da") },
  { slug: "spices", name: "SPICES", description: "Rubs, marinades, seasoning.", image: img("photo-1596040033229-a9821ebd058d") },
];

export const DEFAULT_LOCATIONS = ["Lekki Phase 1", "Victoria Island", "Ikoyi", "Ikeja GRA", "Yaba", "Ajah", "Abuja (Maitama)", "Ibadan"];

export const SEED_PRODUCTS = [
  {
    sku: "SEED-RIBEYE-STEAK",
    name: "Ribeye Steak",
    description: "Well-marbled, cut 2–3 cm thick.",
    basePrice: 12000,
    categorySlug: "beef",
    meatType: "BEEF",
    preparations: ["Steaks 2 cm", "Steaks 3 cm", "Whole piece"],
    image: img("photo-1558030006-450675393462"),
  },
  {
    sku: "SEED-GOAT-STEW-PIECES",
    name: "Goat Stew Pieces",
    description: "Bone-in, chopped to stew size.",
    basePrice: 9500,
    categorySlug: "goat",
    meatType: "GOAT",
    preparations: ["Small stew pieces", "Large chunks"],
    image: img("photo-1601050690597-df0568f70950"),
  },
  {
    sku: "SEED-CHICKEN-THIGHS",
    name: "Chicken Thighs",
    description: "Skin-on or skinless, trimmed.",
    basePrice: 4500,
    categorySlug: "chicken",
    meatType: "CHICKEN",
    preparations: ["Skin-on", "Skinless"],
    image: img("photo-1604503468506-a8da13d82791"),
  },
  {
    sku: "SEED-LEAN-BEEF-MINCE",
    name: "Lean Beef Mince",
    description: "Ground fresh, never pre-packed.",
    basePrice: 7000,
    categorySlug: "beef",
    meatType: "BEEF",
    preparations: ["Coarse grind", "Fine grind"],
    image: img("photo-1544025162-d76694265947"),
  },
];