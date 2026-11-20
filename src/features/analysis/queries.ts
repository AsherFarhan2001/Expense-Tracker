import "server-only";
import { and, gte, isNull, lt, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { expenses } from "@/db/schema";
import {
  addMonths,
  monthBounds,
  monthsBetween,
  type MonthKey,
} from "@/lib/dates";
import type { ItemTotals, MonthTotal } from "./compare";

/** Totals for every month in [from, to], including months with no spending. */
export async function getMonthlyTotals(
  db: Database,
  from: MonthKey,
  to: MonthKey,
): Promise<MonthTotal[]> {
  const start = monthBounds(from).start;
  const end = monthBounds(to).end;
  const month = sql<string>`to_char(${expenses.spentOn}, 'YYYY-MM')`;
  const rows = await db
    .select({
      month,
      qar: sql<string>`sum(${expenses.amountQarMinor})`,
      pkr: sql<string>`sum(${expenses.amountPkrMinor})`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(
      and(
        isNull(expenses.deletedAt),
        gte(expenses.spentOn, start),
        lt(expenses.spentOn, end),
      ),
    )
    .groupBy(month);

  const byMonth = new Map(rows.map((r) => [r.month, r]));
  return monthsBetween(from, to).map((key) => {
    const row = byMonth.get(key);
    return {
      month: key,
      totals: { QAR: Number(row?.qar ?? 0), PKR: Number(row?.pkr ?? 0) },
      entryCount: row?.count ?? 0,
    };
  });
}

export async function getItemTotals(
  db: Database,
  month: MonthKey,
): Promise<ItemTotals> {
  const { start, end } = monthBounds(month);
  const rows = await db
    .select({
      itemId: expenses.itemId,
      qar: sql<string>`sum(${expenses.amountQarMinor})`,
      pkr: sql<string>`sum(${expenses.amountPkrMinor})`,
    })
    .from(expenses)
    .where(
      and(
        isNull(expenses.deletedAt),
        gte(expenses.spentOn, start),
        lt(expenses.spentOn, end),
      ),
    )
    .groupBy(expenses.itemId);
  return Object.fromEntries(
    rows.map((r) => [r.itemId, { QAR: Number(r.qar), PKR: Number(r.pkr) }]),
  );
}

export async function getMonthComparison(db: Database, month: MonthKey) {
  const [current, previous] = await Promise.all([
    getItemTotals(db, month),
    getItemTotals(db, addMonths(month, -1)),
  ]);
  return { current, previous };
}
