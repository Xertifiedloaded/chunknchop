export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'chicken-eggs': 'Chicken & Eggs',
  beef: 'Beef',
  seafood: 'Fish & Seafood',
  pork: 'Pork',
  'goat-mutton': 'Goat & Mutton',
  sausages: 'Sausages',
  bbq: 'BBQ Packs',
  'game-meat': 'Game Meat',
  dairy: 'Dairy',
  spices: 'Spices',
};

export const CATEGORIES: string[] = Object.values(CATEGORY_SLUG_MAP);

export function resolveCategoryFromSlug(slugOrName: string | null): string {
  if (!slugOrName) return 'All';
  if (Object.values(CATEGORY_SLUG_MAP).includes(slugOrName)) return slugOrName;
 if (CATEGORY_SLUG_MAP[slugOrName]) return CATEGORY_SLUG_MAP[slugOrName];
  const parts = slugOrName.replace(/^\//, '').split(/[-_]/).filter(Boolean);
  if (parts.length === 0) return 'All';
  const title = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  return title;
}

export const PREPARATIONS = ['Whole', 'Cubed', 'Boneless', 'Minced', 'Sliced'] as const;
