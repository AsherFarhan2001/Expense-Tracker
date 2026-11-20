import "server-only";
import { and, asc, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, expenses, items } from "@/db/schema";
import { addMonths, monthBounds, type MonthKey } from "@/lib/dates";
import type {
  CatalogCategory,
  EntryView,
  MonthData,
  Suggestion,
} from "./types";

const entryColumns = {
  id: expenses.id,
  itemId: expenses.itemId,
  spentOn: expenses.spentOn,
  amountMinor: expenses.amountMinor,
  currency: expenses.currency,
  pkrPerQar: expenses.pkrPerQar,
  amountQarMinor: expenses.amountQarMinor,
  amountPkrMinor: expenses.amountPkrMinor,
  note: expenses.note,
  createdAt: expenses.createdAt,
};

type EntryRow = Omit<EntryView, "createdAt"> & { createdAt: Date };

export function toEntryView(row: EntryRow): EntryView {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

const inMonth = (month: MonthKey) => {
  const { start, end } = monthBounds(month);
  return and(
    isNull(expenses.deletedAt),
    gte(expenses.spentOn, start),
    lt(expenses.spentOn, end),
  );
};

/** Every category with its items (archived ones flagged), in display order. */
export async function getCatalog(db: Database): Promise<CatalogCategory[]> {
  const [categoryRows, itemRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(items).orderBy(asc(items.sortOrder), asc(items.name)),
  ]);

  return categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color,
    archived: category.archivedAt !== null,
    items: itemRows
      .filter((item) => item.categoryId === category.id)
      .map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        isFixed: item.isFixed,
        amountMode: item.amountMode,
        // An item in an archived category is effectively archived too.
        archived: item.archivedAt !== null || category.archivedAt !== null,
      })),
  }));
}

export async function getMonthEntries(
  db: Database,
  month: MonthKey,
): Promise<EntryView[]> {
  const rows = await db
    .select(entryColumns)
    .from(expenses)
    .where(inMonth(month))
    .orderBy(desc(expenses.spentOn), desc(expenses.createdAt));
  return rows.map(toEntryView);
}

/** Latest earlier entry for each active recurring item. */
async function getSuggestions(
  db: Database,
  month: MonthKey,
): Promise<Suggestion[]> {
  const { start } = monthBounds(month);
  const rows = await db
    .selectDistinctOn([expenses.itemId], {
      itemId: expenses.itemId,
      amountMinor: expenses.amountMinor,
      currency: expenses.currency,
      fromDate: expenses.spentOn,
    })
    .from(expenses)
    .innerJoin(items, eq(items.id, expenses.itemId))
    .where(
      and(
        eq(items.amountMode, "recurring"),
        isNull(items.archivedAt),
        isNull(expenses.deletedAt),
        lt(expenses.spentOn, start),
      ),
    )
    .orderBy(expenses.itemId, desc(expenses.spentOn), desc(expenses.createdAt));
  return rows;
}

export async function getMonthTotals(
  db: Database,
  month: MonthKey,
): Promise<{ QAR: number; PKR: number }> {
  const [row] = await db
    .select({
      qar: sql<string>`coalesce(sum(${expenses.amountQarMinor}), 0)`,
      pkr: sql<string>`coalesce(sum(${expenses.amountPkrMinor}), 0)`,
    })
    .from(expenses)
    .where(inMonth(month));
  return { QAR: Number(row?.qar ?? 0), PKR: Number(row?.pkr ?? 0) };
}

export async function getMonthData(
  db: Database,
  month: MonthKey,
): Promise<MonthData> {
  const [catalog, entries, suggestions, previousTotals] = await Promise.all([
    getCatalog(db),
    getMonthEntries(db, month),
    getSuggestions(db, month),
    getMonthTotals(db, addMonths(month, -1)),
  ]);
  return { month, catalog, entries, suggestions, previousTotals };
}
