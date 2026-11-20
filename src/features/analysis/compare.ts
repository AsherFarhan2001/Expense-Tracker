import type { CatalogCategory } from "@/features/expenses/types";
import { percentChange } from "@/features/expenses/ledger";
import type { MonthKey } from "@/lib/dates";
import type { Currency } from "@/lib/money";

export type Totals = Record<Currency, number>;

/** Sum per item for one month, keyed by item id. */
export type ItemTotals = Record<string, Totals>;

export type MonthTotal = {
  month: MonthKey;
  totals: Totals;
  entryCount: number;
};

export type ItemComparison = {
  itemId: string;
  name: string;
  categoryName: string;
  color: string;
  current: number;
  previous: number;
  delta: number;
  /** null when there was nothing last month. */
  deltaRatio: number | null;
};

export type CategoryShare = {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  share: number;
};

/** Items with spending in either month, biggest this month first. */
export function compareItems(
  catalog: readonly CatalogCategory[],
  current: ItemTotals,
  previous: ItemTotals,
  currency: Currency,
): ItemComparison[] {
  const rows: ItemComparison[] = [];
  for (const category of catalog) {
    for (const item of category.items) {
      const now = current[item.id]?.[currency] ?? 0;
      const before = previous[item.id]?.[currency] ?? 0;
      if (now === 0 && before === 0) continue;
      rows.push({
        itemId: item.id,
        name: item.name,
        categoryName: category.name,
        color: category.color,
        current: now,
        previous: before,
        delta: now - before,
        deltaRatio: percentChange(now, before),
      });
    }
  }
  return rows.sort(
    (a, b) =>
      b.current - a.current ||
      b.previous - a.previous ||
      a.name.localeCompare(b.name),
  );
}

export function categoryShares(
  catalog: readonly CatalogCategory[],
  current: ItemTotals,
  currency: Currency,
): CategoryShare[] {
  const shares = catalog
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
      color: category.color,
      total: category.items.reduce(
        (sum, item) => sum + (current[item.id]?.[currency] ?? 0),
        0,
      ),
      share: 0,
    }))
    .filter((c) => c.total > 0);
  const grand = shares.reduce((sum, c) => sum + c.total, 0);
  for (const c of shares) c.share = grand > 0 ? c.total / grand : 0;
  return shares.sort((a, b) => b.total - a.total);
}

/** Largest increases and decreases vs last month (at most `limit` each). */
export function biggestChanges(rows: readonly ItemComparison[], limit = 3) {
  const increases = rows
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);
  const decreases = rows
    .filter((r) => r.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit);
  return { increases, decreases };
}
