import "server-only";
import { eq, isNull, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { expenses, items } from "@/db/schema";
import type { CategoryUsageMap } from "./types";

/** Live (not deleted) expenses per category across all months, for the delete confirmation. */
export async function getCategoryUsage(
  db: Database,
): Promise<CategoryUsageMap> {
  const rows = await db
    .select({
      categoryId: items.categoryId,
      count: sql<number>`count(*)::int`,
      qar: sql<string>`sum(${expenses.amountQarMinor})`,
      pkr: sql<string>`sum(${expenses.amountPkrMinor})`,
    })
    .from(expenses)
    .innerJoin(items, eq(expenses.itemId, items.id))
    .where(isNull(expenses.deletedAt))
    .groupBy(items.categoryId);

  return Object.fromEntries(
    rows.map((row) => [
      row.categoryId,
      {
        expenseCount: row.count,
        qarMinor: Number(row.qar),
        pkrMinor: Number(row.pkr),
      },
    ]),
  );
}
