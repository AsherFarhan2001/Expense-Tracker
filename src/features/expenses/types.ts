import type { DateKey, MonthKey } from "@/lib/dates";
import type { Currency } from "@/lib/money";

/** One logged expense, as sent to the client. Amounts are minor units. */
export type EntryView = {
  id: string;
  itemId: string;
  spentOn: DateKey;
  amountMinor: number;
  currency: Currency;
  pkrPerQar: string;
  amountQarMinor: number;
  amountPkrMinor: number;
  note: string | null;
  createdAt: string;
};

export type CatalogItem = {
  id: string;
  categoryId: string;
  name: string;
  isFixed: boolean;
  amountMode: "variable" | "recurring";
  archived: boolean;
};

export type CatalogCategory = {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  items: CatalogItem[];
};

/** Last month's amount for a recurring item, offered for one-tap confirmation. */
export type Suggestion = {
  itemId: string;
  amountMinor: number;
  currency: Currency;
  fromDate: DateKey;
};

export type MonthData = {
  month: MonthKey;
  catalog: CatalogCategory[];
  entries: EntryView[];
  suggestions: Suggestion[];
  previousTotals: Record<Currency, number>;
};
