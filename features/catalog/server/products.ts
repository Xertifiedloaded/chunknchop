export const ACTIVE_PRODUCT_FILTER = {
  isActive: true,
  isArchived: false,
} as const;

export const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
