
import { prisma } from "@/lib/db";
import { SECTION_KEYS, type ContentTypeKey, type SectionKey } from "./config";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_FAQS,
  DEFAULT_HIGHLIGHTS,
  DEFAULT_MEATBOXES,
  DEFAULT_SECTIONS,
  DEFAULT_SLIDES,
  DEFAULT_STANDARD_POINTS,
  DEFAULT_STEPS,
  toHeroSlide,
  type Faq,
  type HeroSlide,
  type HomeCategory,
  type Meatbox,
  type SectionCopy,
  type StandardPoint,
  type Step,
} from "./defaults";

export type HomeContent = {
  banner: { text: string; link?: string } | null;
  slides: HeroSlide[];
  highlights: string[];
  categories: HomeCategory[];
  sections: Record<SectionKey, SectionCopy>;
  steps: Step[];
  meatboxes: Meatbox[];
  standardPoints: StandardPoint[];
  faqs: Faq[];
};

type Row = { id: string; type: ContentTypeKey; title: string; slug: string | null; status: "DRAFT" | "LIVE"; data: Record<string, any> };

const HOME_TYPES = ["HERO", "BANNER", "SECTION", "HIGHLIGHT", "STEP", "MEATBOX", "STANDARD_POINT", "FAQ"] as const;
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);

export async function getHomeContent(): Promise<HomeContent> {
  let rows: Row[] = [];
  let cats: { name: string; slug: string; description: string | null; image: string | null; sortOrder: number | null; createdAt: Date }[] = [];

  const [contentRes, catRes] = await Promise.allSettled([
    prisma.contentEntry.findMany({
      where: { type: { in: [...HOME_TYPES] } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, type: true, title: true, slug: true, status: true, data: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true, description: true, image: true, sortOrder: true, createdAt: true },
    }),
  ]);

  if (contentRes.status === "fulfilled") rows = contentRes.value as unknown as Row[];
  else console.error("CMS content query failed, using defaults:", contentRes.reason);

  if (catRes.status === "fulfilled") {
    cats = [...catRes.value].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.createdAt.getTime() - b.createdAt.getTime());
  } else {
    console.error("Category query failed, using default categories:", catRes.reason);
  }

  function resolve<T>(type: ContentTypeKey, map: (r: Row, i: number) => T, fallback: T[]): T[] {
    const all = rows.filter((r) => r.type === type);
    if (all.length === 0) return fallback;
    return all.filter((r) => r.status === "LIVE").map(map);
  }

  const liveSlides = resolve("HERO", (r) => toHeroSlide(r.data), DEFAULT_SLIDES).filter((s) => s.image && s.lines.length);

  const sections = { ...DEFAULT_SECTIONS } as Record<SectionKey, SectionCopy>;
  for (const r of rows) {
    if (r.type !== "SECTION" || r.status !== "LIVE" || !r.slug || !(SECTION_KEYS as readonly string[]).includes(r.slug)) continue;
    const key = r.slug as SectionKey;
    const patch: Record<string, string> = {};
    for (const k of ["eyebrow", "heading", "subtext", "image", "buttonLabel", "secondaryLabel"]) {
      const v = str(r.data[k]);
      if (v) patch[k] = v;
    }
    sections[key] = { ...sections[key], ...patch };
  }

  const now = Date.now();
  const banner =
    rows
      .filter((r) => r.type === "BANNER" && r.status === "LIVE" && r.data.placement === "TOP_BAR")
      .find((r) => {
        const { startsAt, endsAt } = r.data;
        if (startsAt && new Date(startsAt).getTime() > now) return false;
        if (endsAt && new Date(endsAt).getTime() < now) return false;
        return true;
      }) ?? null;

  return {
    banner: banner ? { text: str(banner.data.text), link: str(banner.data.link) || undefined } : null,
    slides: liveSlides.length ? liveSlides : DEFAULT_SLIDES,
    highlights: resolve("HIGHLIGHT", (r) => r.title, DEFAULT_HIGHLIGHTS),
    categories: cats.length ? cats.map((c) => ({ slug: c.slug, name: c.name, description: c.description ?? "", image: c.image })) : DEFAULT_CATEGORIES,
    sections,
    steps: resolve("STEP", (r, i) => ({ number: str(r.data.number, String(i + 1).padStart(2, "0")), title: r.title, description: str(r.data.description) }), DEFAULT_STEPS),
    meatboxes: resolve(
      "MEATBOX",
      (r) => ({
        id: r.id,
        label: str(r.data.label),
        title: r.title,
        contents: str(r.data.contents),
        price: typeof r.data.price === "number" ? r.data.price : 0,
        featured: r.data.featured === true,
        link: str(r.data.link) || undefined,
      }),
      DEFAULT_MEATBOXES
    ),
    standardPoints: resolve("STANDARD_POINT", (r) => ({ title: r.title, description: str(r.data.description) }), DEFAULT_STANDARD_POINTS),
    faqs: resolve("FAQ", (r) => ({ question: r.title, answer: str(r.data.answer) }), DEFAULT_FAQS),
  };
}