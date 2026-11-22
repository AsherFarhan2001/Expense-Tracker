import type { DateKey } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import type {
  CatalogCategory,
  CatalogItem,
  EntryView,
  Suggestion,
} from "./types";

export type LedgerItem = CatalogItem & {
  entries: EntryView[];
  total: number;
  suggestion: Suggestion | null;
};

export type LedgerCategory = Omit<CatalogCategory, "items"> & {
  items: LedgerItem[];
  total: number;
  /** Share of the month total, 0–1. */
  share: number;
};

export type Ledger = {
  total: number;
  entryCount: number;
  categories: LedgerCategory[];
};

export function amountIn(
  entry: Pick<EntryView, "amountQarMinor" | "amountPkrMinor">,
  currency: Currency,
): number {
  return currency === "QAR" ? entry.amountQarMinor : entry.amountPkrMinor;
}

/**
 * Groups a month's entries under the catalog and totals them in `currency`.
 * Visible items: active fixed items, anything with entries, and recurring
 * items with a pending suggestion. Archived categories only appear when they
 * have entries this month.
 */
export function buildLedger(
  catalog: readonly CatalogCategory[],
  entries: readonly EntryView[],
  suggestions: readonly Suggestion[],
  currency: Currency,
): Ledger {
  const entriesByItem = new Map<string, EntryView[]>();
  for (const entry of entries) {
    const list = entriesByItem.get(entry.itemId);
    if (list) list.push(entry);
    else entriesByItem.set(entry.itemId, [entry]);
  }
  const suggestionByItem = new Map(suggestions.map((s) => [s.itemId, s]));

  let total = 0;
  const categories: LedgerCategory[] = [];

  for (const category of catalog) {
    const items: LedgerItem[] = [];
    let categoryTotal = 0;

    for (const item of category.items) {
      const itemEntries = entriesByItem.get(item.id) ?? [];
      const itemTotal = itemEntries.reduce(
        (sum, e) => sum + amountIn(e, currency),
        0,
      );
      const suggestion =
        itemEntries.length === 0 &&
        !item.archived &&
        item.amountMode === "recurring"
          ? (suggestionByItem.get(item.id) ?? null)
          : null;
      const visible =
        itemEntries.length > 0 ||
        (!item.archived && (item.isFixed || suggestion !== null));
      if (!visible) continue;
      items.push({
        ...item,
        entries: itemEntries,
        total: itemTotal,
        suggestion,
      });
      categoryTotal += itemTotal;
    }

    const hasEntries = items.some((i) => i.entries.length > 0);
    if (category.archived && !hasEntries) continue;

    categories.push({
      id: category.id,
      name: category.name,
      color: category.color,
      archived: category.archived,
      items,
      total: categoryTotal,
      share: 0,
    });
    total += categoryTotal;
  }

  for (const category of categories) {
    category.share = total > 0 ? category.total / total : 0;
  }

  return { total, entryCount: entries.length, categories };
}

/** Total spent on each day, in `currency`. Days with nothing logged are absent. */
export function dailyTotals(
  entries: readonly EntryView[],
  currency: Currency,
): Map<DateKey, number> {
  const totals = new Map<DateKey, number>();
  for (const entry of entries) {
    totals.set(
      entry.spentOn,
      (totals.get(entry.spentOn) ?? 0) + amountIn(entry, currency),
    );
  }
  return totals;
}

/** Relative change from `previous` to `current`; null when there's no baseline. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}
