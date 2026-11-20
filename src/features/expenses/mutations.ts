import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, expenses, items } from "@/db/schema";
import type { PreparedExpense } from "./prepare";
import { toEntryView } from "./queries";
import type { EntryView } from "./types";

const returningEntry = {
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

/** True when the item exists and neither it nor its category is archived. */
export async function isActiveItem(
  db: Database,
  itemId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: items.id })
    .from(items)
    .innerJoin(categories, eq(categories.id, items.categoryId))
    .where(
      and(
        eq(items.id, itemId),
        isNull(items.archivedAt),
        isNull(categories.archivedAt),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function findExpense(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function insertExpense(
  db: Database,
  expense: PreparedExpense,
): Promise<EntryView> {
  const [row] = await db
    .insert(expenses)
    .values(expense)
    .returning(returningEntry);
  if (!row) throw new Error("Insert returned no row");
  return toEntryView(row);
}

export async function updateExpense(
  db: Database,
  id: string,
  expense: PreparedExpense,
): Promise<EntryView | null> {
  const [row] = await db
    .update(expenses)
    .set({ ...expense, updatedAt: new Date() })
    .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
    .returning(returningEntry);
  return row ? toEntryView(row) : null;
}

export async function softDeleteExpense(
  db: Database,
  id: string,
): Promise<boolean> {
  const rows = await db
    .update(expenses)
    .set({ deletedAt: new Date() })
    .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
    .returning({ id: expenses.id });
  return rows.length > 0;
}

export async function restoreExpense(
  db: Database,
  id: string,
): Promise<boolean> {
  const rows = await db
    .update(expenses)
    .set({ deletedAt: null })
    .where(and(eq(expenses.id, id), isNotNull(expenses.deletedAt)))
    .returning({ id: expenses.id });
  return rows.length > 0;
}
