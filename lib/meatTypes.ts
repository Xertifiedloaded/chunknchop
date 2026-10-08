// Must match the Prisma `MeatType` enum exactly.
export const MEAT_TYPES = ['BEEF', 'CHICKEN', 'SEAFOOD', 'GOAT', 'PORK', 'TURKEY', 'BBQ', 'SAUSAGE', 'SPICE'] as const;

export type MeatTypeValue = (typeof MEAT_TYPES)[number];

export function isMeatType(value: unknown): value is MeatTypeValue {
  return typeof value === 'string' && (MEAT_TYPES as readonly string[]).includes(value);
}

export function formatMeatType(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function meatTypeFromDisplay(name: string): MeatTypeValue | null {
  if (!name) return null;
  const exact = MEAT_TYPES.find((t) => formatMeatType(t) === name);
  if (exact) return exact;

  const lowerName = name.toLowerCase();
  const contains = MEAT_TYPES.find((t) => lowerName.includes(formatMeatType(t).toLowerCase()));
  if (contains) return contains;
  const normalized = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const byNormalized = MEAT_TYPES.find((t) => t.replace(/[^A-Z]/g, '') === normalized);
  if (byNormalized) return byNormalized;

  return null;
}
