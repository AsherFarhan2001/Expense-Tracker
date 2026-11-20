import { convertMinor, normalizeRate, parseAmountToMinor } from "@/lib/money";
import type { ExpenseFormInput } from "./schemas";

export type PreparedExpense = {
  itemId: string;
  spentOn: string;
  amountMinor: number;
  currency: ExpenseFormInput["currency"];
  pkrPerQar: string;
  rateSource: "auto" | "manual";
  amountQarMinor: number;
  amountPkrMinor: number;
  note: string | null;
};

/**
 * Turns validated form input into the stored row: amount in minor units plus
 * both converted amounts, locked to `pkrPerQar`. Pure, so the client can use it
 * to build optimistic entries that match what the server will save.
 */
export function prepareExpense(
  input: ExpenseFormInput,
  pkrPerQar: string,
  rateSource: "auto" | "manual",
): PreparedExpense {
  const amountMinor = parseAmountToMinor(input.amount);
  const rate = normalizeRate(pkrPerQar);
  if (amountMinor === null) throw new Error("Invalid amount");
  if (rate === null) throw new Error("Invalid exchange rate");
  return {
    itemId: input.itemId,
    spentOn: input.spentOn,
    amountMinor,
    currency: input.currency,
    pkrPerQar: rate,
    rateSource,
    amountQarMinor: convertMinor(amountMinor, input.currency, "QAR", rate),
    amountPkrMinor: convertMinor(amountMinor, input.currency, "PKR", rate),
    note: input.note ? input.note : null,
  };
}
