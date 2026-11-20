"use server";

import { refresh } from "next/cache";
import { getDb } from "@/db/client";
import { getRateForDay } from "@/features/currency/rates";
import { requireUnlocked } from "@/features/pin-lock/guard";
import { getSettings } from "@/features/settings/queries";
import {
  describeRange,
  isSpendDateAllowed,
  navigableRange,
} from "@/features/settings/range";
import { fail, failFromZod, ok, type ActionResult } from "@/lib/action-result";
import { todayInQatar } from "@/lib/dates";
import { normalizeRate } from "@/lib/money";
import {
  findExpense,
  insertExpense,
  isActiveItem,
  restoreExpense as restoreExpenseRow,
  softDeleteExpense,
  updateExpense as updateExpenseRow,
} from "./mutations";
import { prepareExpense } from "./prepare";
import {
  expenseFormSchema,
  expenseIdSchema,
  updateExpenseSchema,
} from "./schemas";
import type { EntryView } from "./types";

const RATE_UNAVAILABLE =
  "Today's exchange rate isn't available. Enter the rate to save this expense.";

async function checkDate(
  db: Awaited<ReturnType<typeof getDb>>,
  spentOn: string,
): Promise<ActionResult<never> | null> {
  const settings = await getSettings(db);
  const range = navigableRange(settings.startMonth, todayInQatar());
  return isSpendDateAllowed(spentOn, range)
    ? null
    : fail(`Pick a date in ${describeRange(range)}`, "spentOn");
}

export async function addExpense(
  input: unknown,
): Promise<ActionResult<EntryView>> {
  await requireUnlocked();
  const parsed = expenseFormSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  const data = parsed.data;
  const db = await getDb();

  if (!(await isActiveItem(db, data.itemId))) {
    return fail(
      "That item isn't available any more. Pick another one.",
      "itemId",
    );
  }
  const dateError = await checkDate(db, data.spentOn);
  if (dateError) return dateError;

  const manualRate = data.pkrPerQar ? normalizeRate(data.pkrPerQar) : null;
  const rate =
    manualRate ?? (await getRateForDay(db, todayInQatar()))?.pkrPerQar;
  if (!rate) return fail(RATE_UNAVAILABLE, "pkrPerQar");

  const entry = await insertExpense(
    db,
    prepareExpense(data, rate, manualRate ? "manual" : "auto"),
  );
  refresh();
  return ok(entry);
}

export async function updateExpense(
  input: unknown,
): Promise<ActionResult<EntryView>> {
  await requireUnlocked();
  const parsed = updateExpenseSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  const { id, ...data } = parsed.data;
  const db = await getDb();

  const existing = await findExpense(db, id);
  if (!existing)
    return fail("This expense was deleted. Refresh to see the latest list.");
  if (
    data.itemId !== existing.itemId &&
    !(await isActiveItem(db, data.itemId))
  ) {
    return fail(
      "That item isn't available any more. Pick another one.",
      "itemId",
    );
  }
  const dateError = await checkDate(db, data.spentOn);
  if (dateError) return dateError;

  // The rate stays locked to the original unless the user changes it.
  const manualRate = data.pkrPerQar ? normalizeRate(data.pkrPerQar) : null;
  const rateChanged = manualRate !== null && manualRate !== existing.pkrPerQar;
  const rate = rateChanged ? manualRate : existing.pkrPerQar;
  const source = rateChanged ? "manual" : existing.rateSource;

  const entry = await updateExpenseRow(
    db,
    id,
    prepareExpense(data, rate, source),
  );
  if (!entry)
    return fail("This expense was deleted. Refresh to see the latest list.");
  refresh();
  return ok(entry);
}

export async function deleteExpense(input: unknown): Promise<ActionResult> {
  await requireUnlocked();
  const parsed = expenseIdSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  await softDeleteExpense(await getDb(), parsed.data.id);
  refresh();
  return ok(null);
}

export async function restoreExpense(input: unknown): Promise<ActionResult> {
  await requireUnlocked();
  const parsed = expenseIdSchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  await restoreExpenseRow(await getDb(), parsed.data.id);
  refresh();
  return ok(null);
}
