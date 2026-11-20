import { sql } from "drizzle-orm";
import type { Database } from "./create-db";
import { categories, items, settings } from "./schema";
import { DEFAULT_START_MONTH, SEED_CATEGORY, SEED_ITEMS } from "./seed-data";

/**
 * Idempotent: creates the settings row, the default category and its fixed
 * items only if they don't exist yet. Never modifies existing rows, so user
 * edits (renames, archives) survive re-seeding.
 */
export async function seedDatabase(db: Database): Promise<void> {
  await db
    .insert(settings)
    .values({ id: 1, startMonth: DEFAULT_START_MONTH })
    .onConflictDoNothing();

  const [existingCategories] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories);
  if ((existingCategories?.count ?? 0) > 0) return;

  const [category] = await db
    .insert(categories)
    .values({ ...SEED_CATEGORY, sortOrder: 0 })
    .onConflictDoNothing()
    .returning({ id: categories.id });
  if (!category) return;

  await db
    .insert(items)
    .values(
      SEED_ITEMS.map((item, index) => ({
        categoryId: category.id,
        name: item.name,
        isFixed: true,
        amountMode: item.recurring
          ? ("recurring" as const)
          : ("variable" as const),
        sortOrder: index,
      })),
    )
    .onConflictDoNothing();
}
