// Validated with the dataviz palette checker (lightness band, chroma floor,
// CVD and normal-vision separation, contrast) in both light and dark mode.
// Order matters: adjacent slots are the ones checked for separation.
export const CATEGORY_COLORS = [
  "maroon",
  "teal",
  "amber",
  "indigo",
  "olive",
  "rose",
  "sky",
  "coral",
  "violet",
  "brown",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function isCategoryColor(value: unknown): value is CategoryColor {
  return CATEGORY_COLORS.includes(value as CategoryColor);
}

/** CSS colour for a category palette key (theme-aware via CSS variables). */
export function categoryColor(key: string): string {
  return `var(--cat-${isCategoryColor(key) ? key : CATEGORY_COLORS[0]})`;
}

/** First palette colour not used yet, cycling when all are taken. */
export function nextCategoryColor(used: readonly string[]): CategoryColor {
  return (
    CATEGORY_COLORS.find((color) => !used.includes(color)) ??
    CATEGORY_COLORS[used.length % CATEGORY_COLORS.length]!
  );
}
