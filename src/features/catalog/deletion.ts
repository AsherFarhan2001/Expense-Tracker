import { formatMoney, type Currency } from "@/lib/money";
import type { CategoryUsage } from "./types";

type DeletionInput = {
  name: string;
  /** All items in the category, archived ones included. */
  itemCount: number;
  archived: boolean;
  usage: CategoryUsage | undefined;
  currency: Currency;
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

/** Wording for the delete-category confirmation, so it says exactly what goes. */
export function describeCategoryDeletion({
  name,
  itemCount,
  archived,
  usage,
  currency,
}: DeletionInput): { title: string; body: string; offerArchive: boolean } {
  const title = `Delete ${name}?`;
  const expenseCount = usage?.expenseCount ?? 0;

  if (expenseCount === 0) {
    const what =
      itemCount === 0 ? name : `${name} and its ${plural(itemCount, "item")}`;
    return {
      title,
      body: `${what} will be removed. This can't be undone.`,
      offerArchive: false,
    };
  }

  const total = formatMoney(
    currency === "QAR" ? usage!.qarMinor : usage!.pkrMinor,
    currency,
  );
  return {
    title,
    body: `This permanently removes ${name}, its ${plural(itemCount, "item")} and ${plural(expenseCount, "expense")} (${total}) from every month, History and Analysis. This can't be undone.`,
    offerArchive: !archived,
  };
}
