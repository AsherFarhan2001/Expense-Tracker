import { z } from "zod";
import { isDateKey } from "@/lib/dates";
import { CURRENCIES, normalizeRate, parseAmountToMinor } from "@/lib/money";

/** Shared by the expense dialog (client) and the Server Actions. */
export const expenseFormSchema = z.object({
  itemId: z.uuid({ error: "Choose what this expense was for" }),
  amount: z
    .string()
    .refine(
      (value) => parseAmountToMinor(value) !== null,
      "Enter an amount above 0 with up to 2 decimals",
    ),
  currency: z.enum(CURRENCIES),
  spentOn: z.string().refine(isDateKey, "Choose a valid date"),
  pkrPerQar: z
    .string()
    .optional()
    .refine(
      (value) => !value || normalizeRate(value) !== null,
      "Enter a rate above 0 with up to 6 decimals",
    ),
  note: z
    .string()
    .trim()
    .max(200, "Keep the note under 200 characters")
    .optional(),
});

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;

export const updateExpenseSchema = expenseFormSchema.extend({ id: z.uuid() });
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const expenseIdSchema = z.object({ id: z.uuid() });
