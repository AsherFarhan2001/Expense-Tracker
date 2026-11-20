export const CATEGORY_COLORS = [
  "maroon",
  "teal",
  "amber",
  "indigo",
  "olive",
  "rose",
  "sky",
  "sand",
  "violet",
  "slate",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function isCategoryColor(value: unknown): value is CategoryColor {
  return CATEGORY_COLORS.includes(value as CategoryColor);
}

/** CSS colour for a category palette key (theme-aware via CSS variables). */
export function categoryColor(key: string): string {
  return `var(--cat-${isCategoryColor(key) ? key : "slate"})`;
}

/** First palette colour not used yet, cycling when all are taken. */
export function nextCategoryColor(used: readonly string[]): CategoryColor {
  return (
    CATEGORY_COLORS.find((color) => !used.includes(color)) ??
    CATEGORY_COLORS[used.length % CATEGORY_COLORS.length]!
  );
}
