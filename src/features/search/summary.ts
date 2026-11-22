import { amountIn } from "@/features/expenses/ledger";
import { monthKeyOf, type DateKey, type MonthKey } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import type { ItemMatch, SearchRow } from "./types";

export type MonthGroup = { month: MonthKey; total: number; rows: SearchRow[] };

/** Splits newest-first rows into months, each with its total in `currency`. */
export function groupByMonth(
  rows: readonly SearchRow[],
  currency: Currency,
): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const row of rows) {
    const month = monthKeyOf(row.spentOn);
    let group = groups.at(-1);
    if (group?.month !== month) {
      group = { month, total: 0, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
    group.total += amountIn(row, currency);
  }
  return groups;
}

/** Count, total and date span of every match (from the per-item totals). */
export function summarizeMatches(
  items: readonly ItemMatch[],
  currency: Currency,
): {
  count: number;
  total: number;
  firstDate: DateKey | null;
  lastDate: DateKey | null;
} {
  let count = 0;
  let total = 0;
  let firstDate: DateKey | null = null;
  let lastDate: DateKey | null = null;
  for (const item of items) {
    count += item.count;
    total += currency === "QAR" ? item.qarMinor : item.pkrMinor;
    if (firstDate === null || item.firstDate < firstDate)
      firstDate = item.firstDate;
    if (lastDate === null || item.lastDate > lastDate) lastDate = item.lastDate;
  }
  return { count, total, firstDate, lastDate };
}
