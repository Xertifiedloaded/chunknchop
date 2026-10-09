export const SECTION_KEYS = ["shop", "bestsellers", "how", "meatbox", "standard", "faq", "newsletter"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const CONTENT_TYPES = [
  "HERO",
  "BANNER",
  "SECTION",
  "HIGHLIGHT",
  "STEP",
  "MEATBOX",
  "STANDARD_POINT",
  "FAQ",
  "RECIPE",
  "BLOG",
  "PAGE",
  "DELIVERY_LOCATION",
] as const;
export type ContentTypeKey = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ["DRAFT", "LIVE"] as const;
export type ContentStatusKey = (typeof CONTENT_STATUSES)[number];

export type FieldKind = "text" | "textarea" | "url" | "lines" | "select" | "datetime" | "number" | "checkbox" | "image";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  help?: string;
}

export interface TypeConfig {
  label: string;
  singular: string;
  titleLabel: string;
  slugged: boolean;
  subtitleKey?: string;
  fields: FieldDef[];
}

export const CONTENT_CONFIG: Record<ContentTypeKey, TypeConfig> = {
  HERO: {
    label: "Homepage Hero",
    singular: "hero slide",
    titleLabel: "Internal name",
    slugged: false,
    subtitleKey: "text",
    fields: [
      { key: "lines", label: "Headline", kind: "lines", required: true, help: "One line per row, e.g. POULTRY. / FRESH CHICKEN, / NEVER PRE-PACKED." },
      { key: "text", label: "Sub-text", kind: "textarea", required: true },
      { key: "image", label: "Background image", kind: "image", required: true, help: "Use a wide image, at least 1600px." },
      { key: "ctaLabel", label: "Primary button label", kind: "text", required: true },
      { key: "ctaTarget", label: "Primary button scroll target", kind: "text", required: true, help: "Section id on the homepage: shop, how, meatbox, faq" },
      { key: "secondaryLabel", label: "Secondary button label", kind: "text", help: "Defaults to SEE MEATBOXES" },
      { key: "secondaryTarget", label: "Secondary button scroll target", kind: "text", help: "Defaults to meatbox" },
    ],
  },
  BANNER: {
    label: "Banners",
    singular: "banner",
    titleLabel: "Internal name",
    slugged: false,
    subtitleKey: "text",
    fields: [
      { key: "text", label: "Banner text", kind: "text", required: true },
      { key: "placement", label: "Placement", kind: "select", required: true, options: ["TOP_BAR", "HOME_MID", "SHOP_TOP"] },
      { key: "link", label: "Link (optional)", kind: "url" },
      { key: "image", label: "Image (optional)", kind: "image" },
      { key: "startsAt", label: "Show from (optional)", kind: "datetime" },
      { key: "endsAt", label: "Show until (optional)", kind: "datetime" },
    ],
  },
  SECTION: {
    label: "Section Copy",
    singular: "section",
    titleLabel: "Internal name",
    slugged: true,
    subtitleKey: "heading",
    fields: [
      { key: "eyebrow", label: "Eyebrow (small label)", kind: "text" },
      { key: "heading", label: "Heading", kind: "text", required: true },
      { key: "subtext", label: "Sub-text", kind: "textarea" },
      { key: "image", label: "Image", kind: "image", help: "Only used by the 'standard' section" },
      { key: "buttonLabel", label: "Button label", kind: "text", help: "Used by shop (mobile 'view all'), meatbox and newsletter" },
      { key: "secondaryLabel", label: "Second button label", kind: "text", help: "Used by newsletter" },
    ],
  },
  HIGHLIGHT: {
    label: "Marquee",
    singular: "marquee line",
    titleLabel: "Marquee text",
    slugged: false,
    fields: [],
  },
  STEP: {
    label: "How It Works",
    singular: "step",
    titleLabel: "Step title",
    slugged: false,
    subtitleKey: "description",
    fields: [
      { key: "number", label: "Step number", kind: "text", required: true, help: "e.g. 01" },
      { key: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  MEATBOX: {
    label: "Meatboxes",
    singular: "meatbox",
    titleLabel: "Box name",
    slugged: false,
    subtitleKey: "contents",
    fields: [
      { key: "label", label: "Badge label", kind: "text", required: true, help: "e.g. WEEKLY, MOST POPULAR, FOR EVENTS" },
      { key: "contents", label: "What's inside", kind: "text", required: true },
      { key: "price", label: "Price (₦)", kind: "number", required: true },
      { key: "featured", label: "Highlight this box", kind: "checkbox" },
      { key: "link", label: "Button link (optional)", kind: "url", help: "Defaults to /shop?category=meatbox" },
    ],
  },
  STANDARD_POINT: {
    label: "Our Standard",
    singular: "standard point",
    titleLabel: "Heading",
    slugged: false,
    subtitleKey: "description",
    fields: [{ key: "description", label: "Description", kind: "textarea", required: true }],
  },
  FAQ: {
    label: "FAQs",
    singular: "FAQ",
    titleLabel: "Question",
    slugged: false,
    subtitleKey: "answer",
    fields: [{ key: "answer", label: "Answer", kind: "textarea", required: true }],
  },
  RECIPE: {
    label: "Recipes",
    singular: "recipe",
    titleLabel: "Recipe name",
    slugged: true,
    subtitleKey: "category",
    fields: [
      { key: "author", label: "Author", kind: "text", required: true },
      { key: "category", label: "Category", kind: "text", required: true },
      { key: "image", label: "Image", kind: "image" },
      { key: "summary", label: "Summary", kind: "textarea" },
      { key: "ingredients", label: "Ingredients", kind: "lines", help: "One per line" },
      { key: "steps", label: "Steps", kind: "lines", help: "One per line" },
    ],
  },
  BLOG: {
    label: "Blog",
    singular: "blog post",
    titleLabel: "Post title",
    slugged: true,
    subtitleKey: "author",
    fields: [
      { key: "author", label: "Author", kind: "text", required: true },
      { key: "excerpt", label: "Excerpt", kind: "textarea" },
      { key: "cover", label: "Cover image", kind: "image" },
      { key: "body", label: "Body", kind: "textarea", required: true },
      { key: "tags", label: "Tags", kind: "lines", help: "One per line" },
    ],
  },
  PAGE: {
    label: "Pages",
    singular: "page",
    titleLabel: "Page title",
    slugged: true,
    subtitleKey: "body",
    fields: [{ key: "body", label: "Content", kind: "textarea", required: true }],
  },
  DELIVERY_LOCATION: {
    label: "Delivery Locations",
    singular: "delivery location",
    titleLabel: "Location name",
    slugged: false,
    fields: [],
  },
};

export function isContentType(v: unknown): v is ContentTypeKey {
  return typeof v === "string" && (CONTENT_TYPES as readonly string[]).includes(v);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateData(type: AdminTab, input: unknown) {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const f of getTabConfig(type).fields) {
    const raw = src[f.key];

    if (f.kind === "checkbox") {
      data[f.key] = raw === true || raw === "true";
      continue;
    }

    if (f.kind === "number") {
      const empty = raw === undefined || raw === null || raw === "";
      const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, ""));
      if (empty) {
        if (f.required) errors[f.key] = `${f.label} is required`;
        data[f.key] = null;
      } else if (!Number.isFinite(n) || n < 0) {
        errors[f.key] = `${f.label} must be a positive number`;
      } else {
        data[f.key] = n;
      }
      continue;
    }

    if (f.kind === "lines") {
      const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split("\n") : [];
      const lines = arr.map((v) => String(v).trim()).filter(Boolean).slice(0, 100);
      if (f.required && lines.length === 0) errors[f.key] = `${f.label} is required`;
      data[f.key] = lines;
      continue;
    }

    let value = typeof raw === "string" ? raw.trim() : "";
    if (value.length > 20000) errors[f.key] = `${f.label} is too long`;
    else if (!value) {
      if (f.required) errors[f.key] = `${f.label} is required`;
    } else if ((f.kind === "url" || f.kind === "image") && !/^(https?:\/\/|\/)/i.test(value)) {
      errors[f.key] = `${f.label} must start with http(s):// or /`;
    } else if (f.kind === "select" && !f.options?.includes(value)) {
      errors[f.key] = `${f.label} is invalid`;
    } else if (f.kind === "datetime") {
      const d = new Date(value);
      if (isNaN(d.getTime())) errors[f.key] = `${f.label} is not a valid date`;
      else value = d.toISOString();
    }
    data[f.key] = value;
  }

  return { ok: Object.keys(errors).length === 0, data, errors };
}

export type AdminTab = ContentTypeKey | "CATEGORY";

export const CATEGORY_CONFIG: TypeConfig = {
  label: "Categories",
  singular: "category",
  titleLabel: "Category name",
  slugged: true,
  subtitleKey: "description",
  fields: [
    { key: "description", label: "Short description", kind: "textarea", help: "Shown under the name on the homepage card" },
    { key: "image", label: "Card image", kind: "image", help: "Landscape photo, at least 900px wide" },
  ],
};

export const ADMIN_TABS: AdminTab[] = [
  "HERO",
  "BANNER",
  "HIGHLIGHT",
  "SECTION",
  "CATEGORY",
  "STEP",
  "MEATBOX",
  "STANDARD_POINT",
  "FAQ",
  "RECIPE",
  "BLOG",
  "PAGE",
  "DELIVERY_LOCATION",
];

export function getTabConfig(tab: AdminTab): TypeConfig {
  return tab === "CATEGORY" ? CATEGORY_CONFIG : CONTENT_CONFIG[tab];
}