// Must match the Prisma `MeatType` enum exactly.
export const MEAT_TYPES = ['BEEF', 'CHICKEN', 'SEAFOOD', 'GOAT', 'PORK', 'TURKEY', 'BBQ', 'SAUSAGE', 'SPICE'] as const;

export type MeatTypeValue = (typeof MEAT_TYPES)[number];

export function isMeatType(value: unknown): value is MeatTypeValue {
  return typeof value === 'string' && (MEAT_TYPES as readonly string[]).includes(value);
}

export function formatMeatType(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
