export type SeedItem = { name: string; recurring?: boolean };

export const SEED_CATEGORY = { name: "Qatar", color: "maroon" } as const;

/** Fixed monthly items, in display order (SPEC §1 "Seed data"). */
export const SEED_ITEMS: readonly SeedItem[] = [
  { name: "Mobile Package", recurring: true },
  { name: "Accommodation", recurring: true },
  { name: "Breakfast" },
  { name: "Lunch" },
  { name: "Dinner" },
  { name: "Tea" },
  { name: "Water" },
  { name: "Eggs/Bread" },
  { name: "Fruits" },
  { name: "Frozen items" },
  { name: "Grocery" },
  { name: "Misc drinks/chips" },
  { name: "Restaurant" },
  { name: "Uber" },
  { name: "Metro" },
  { name: "Shopping" },
  { name: "Outing" },
  { name: "Haircut" },
];

export const DEFAULT_START_MONTH = "2026-12";
