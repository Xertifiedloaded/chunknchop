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

  return CATEGORY_SLUG_MAP[slugOrName] ?? slugOrName;
}

export const PREPARATIONS = ['Whole', 'Cubed', 'Boneless', 'Minced', 'Sliced'] as const;