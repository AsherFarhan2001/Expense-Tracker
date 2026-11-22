import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, expenses, items } from "@/db/schema";
import { entryColumns, toEntryView } from "@/features/expenses/queries";
import { escapeLike } from "./params";
import type { SearchResults } from "./types";

/** Most rows the page lists; totals always cover every match. */
export const SEARCH_ROW_LIMIT = 500;

type SearchFilter = {
  /** Only this category's expenses. */
  categoryId?: string;
  /** Each word must match the category, item or note (case-insensitive). */
  terms: readonly string[];
};

function matching({ categoryId, terms }: SearchFilter): SQL | undefined {
  const conditions: (SQL | undefined)[] = [isNull(expenses.deletedAt)];
  if (categoryId) conditions.push(eq(items.categoryId, categoryId));
  for (const term of terms) {
    const pattern = `%${escapeLike(term)}%`;
    conditions.push(
      or(
        ilike(categories.name, pattern),
        ilike(items.name, pattern),
        ilike(expenses.note, pattern),
      ),
    );
  }
  return and(...conditions);
}

/** Expenses from every month that match the filter, plus per-item totals. */
export async function searchExpenses(
  db: Database,
  filter: SearchFilter,
  { limit = SEARCH_ROW_LIMIT }: { limit?: number } = {},
): Promise<SearchResults> {
  const where = matching(filter);
  const [rows, itemRows] = await Promise.all([
    db
      .select({
        ...entryColumns,
        itemName: items.name,
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(expenses)
      .innerJoin(items, eq(expenses.itemId, items.id))
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(where)
      .orderBy(desc(expenses.spentOn), desc(expenses.createdAt))
      .limit(limit + 1),
    db
      .select({
        itemId: items.id,
        itemName: items.name,
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
        count: sql<number>`count(*)::int`,
        qar: sql<string>`sum(${expenses.amountQarMinor})`,
        pkr: sql<string>`sum(${expenses.amountPkrMinor})`,
        firstDate: sql<string>`min(${expenses.spentOn})::text`,
        lastDate: sql<string>`max(${expenses.spentOn})::text`,
      })
      .from(expenses)
      .innerJoin(items, eq(expenses.itemId, items.id))
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(where)
      .groupBy(items.id, categories.id)
      .orderBy(desc(sql`sum(${expenses.amountQarMinor})`), asc(items.name)),
  ]);

  return {
    rows: rows
      .slice(0, limit)
      .map(
        ({ itemName, categoryId, categoryName, categoryColor, ...entry }) => ({
          ...toEntryView(entry),
          itemName,
          categoryId,
          categoryName,
          categoryColor,
        }),
      ),
    items: itemRows.map(({ qar, pkr, ...row }) => ({
      ...row,
      qarMinor: Number(qar),
      pkrMinor: Number(pkr),
    })),
    truncated: rows.length > limit,
  };
}
