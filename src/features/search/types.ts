import type { EntryView } from "@/features/expenses/types";
import type { DateKey } from "@/lib/dates";

/** One matching expense, with what it was filed under. */
export type SearchRow = EntryView & {
  itemName: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
};

/** Totals for one item across every match (not limited like the rows). */
export type ItemMatch = {
  itemId: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  count: number;
  qarMinor: number;
  pkrMinor: number;
  firstDate: DateKey;
  lastDate: DateKey;
};

export type SearchResults = {
  /** Newest first, capped at `SEARCH_ROW_LIMIT`. */
  rows: SearchRow[];
  /** Every match, grouped by item, biggest QAR total first. */
  items: ItemMatch[];
  /** True when there are more matches than `rows` holds. */
  truncated: boolean;
};
