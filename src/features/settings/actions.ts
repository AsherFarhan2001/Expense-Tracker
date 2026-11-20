"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { requireUnlocked } from "@/features/pin-lock/guard";
import { failFromZod, ok, type ActionResult } from "@/lib/action-result";
import { CURRENCIES } from "@/lib/money";
import { updateSettings } from "./queries";

const currencySchema = z.enum(CURRENCIES);

export async function setDisplayCurrency(
  input: unknown,
): Promise<ActionResult> {
  await requireUnlocked();
  const parsed = currencySchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  await updateSettings(await getDb(), { displayCurrency: parsed.data });
  refresh();
  return ok(null);
}

export async function setDefaultCurrency(
  input: unknown,
): Promise<ActionResult> {
  await requireUnlocked();
  const parsed = currencySchema.safeParse(input);
  if (!parsed.success) return failFromZod(parsed.error);
  await updateSettings(await getDb(), { defaultCurrency: parsed.data });
  refresh();
  return ok(null);
}
