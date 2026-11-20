"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RateInfo } from "@/features/currency/types";
import type { MonthRange } from "@/features/settings/range";
import { formatShortDate, lastDayOfMonth } from "@/lib/dates";
import {
  convertMinor,
  formatMoney,
  formatRate,
  normalizeRate,
  parseAmountToMinor,
  type Currency,
} from "@/lib/money";
import { categoryColor } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { expenseFormSchema, type ExpenseFormInput } from "../schemas";
import type { CatalogCategory } from "../types";

export type ExpenseDraft = {
  /** Present when editing an existing expense. */
  id?: string;
  itemId: string;
  amount: string;
  currency: Currency;
  spentOn: string;
  /** Rate shown in the form; sent to the server only if the user changed it. */
  pkrPerQar: string;
  rateEdited: boolean;
  note: string;
};

export type ExpenseSubmission = {
  draft: ExpenseDraft;
  input: ExpenseFormInput;
  /** The rate the saved expense will use (for the optimistic entry). */
  rate: string;
};

type Field = keyof ExpenseFormInput;

type ExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ExpenseDraft;
  catalog: CatalogCategory[];
  todayRate: RateInfo | null;
  range: MonthRange;
  onSubmit: (submission: ExpenseSubmission, addAnother: boolean) => void;
};

export function ExpenseDialog({
  open,
  onOpenChange,
  draft: initial,
  catalog,
  todayRate,
  range,
  onSubmit,
}: ExpenseDialogProps) {
  const isEdit = Boolean(initial.id);
  const formId = useId();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showRate, setShowRate] = useState(
    initial.rateEdited || (!isEdit && !todayRate),
  );

  const set = <K extends keyof ExpenseDraft>(
    key: K,
    value: ExpenseDraft[K],
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const activeCategories = useMemo(
    () =>
      catalog
        .filter((c) => !c.archived)
        .map((c) => ({
          ...c,
          items: c.items.filter((i) => !i.archived || i.id === initial.itemId),
        }))
        .filter((c) => c.items.length > 0),
    [catalog, initial.itemId],
  );

  // Rate the expense will be saved with: edited > original (edit) > today's.
  const effectiveRate = draft.rateEdited
    ? normalizeRate(draft.pkrPerQar)
    : isEdit
      ? normalizeRate(initial.pkrPerQar)
      : todayRate
        ? normalizeRate(todayRate.pkrPerQar)
        : null;

  const amountMinor = parseAmountToMinor(draft.amount);
  const other: Currency = draft.currency === "QAR" ? "PKR" : "QAR";
  const converted =
    amountMinor !== null && effectiveRate
      ? convertMinor(amountMinor, draft.currency, other, effectiveRate)
      : null;

  const handleSubmit = (addAnother: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    const candidate = {
      itemId: draft.itemId,
      amount: draft.amount,
      currency: draft.currency,
      spentOn: draft.spentOn,
      pkrPerQar: draft.rateEdited ? draft.pkrPerQar : undefined,
      note: draft.note.trim() || undefined,
    };
    const parsed = expenseFormSchema.safeParse(candidate);
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        nextErrors[field] ??= issue.message;
      }
    }
    if (!effectiveRate)
      nextErrors.pkrPerQar ??= "Enter the exchange rate for this expense";
    if (
      Object.keys(nextErrors).length > 0 ||
      !parsed.success ||
      !effectiveRate
    ) {
      setErrors(nextErrors);
      if (nextErrors.pkrPerQar) setShowRate(true);
      return;
    }
    onSubmit({ draft, input: parsed.data, rate: effectiveRate }, addAnother);
    if (addAnother) {
      setDraft((d) => ({ ...d, itemId: "", amount: "", note: "" }));
      setErrors({});
    }
  };

  const dateMin = `${range.min}-01`;
  const dateMax = lastDayOfMonth(range.max);
  const rateLabel = draft.rateEdited
    ? "your rate"
    : isEdit
      ? `saved ${formatShortDate(initial.spentOn)}`
      : todayRate?.stale
        ? `last known, ${formatShortDate(todayRate.rateDate)}`
        : "today's rate";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Edit expense" : "Add expense"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changes update this month's totals straight away."
              : "Log what you spent. Totals update as soon as you save."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={handleSubmit(false)}
          className="grid gap-4"
          noValidate
        >
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-item`}>What was it for?</Label>
            <Select
              value={draft.itemId}
              onValueChange={(value) => set("itemId", value)}
            >
              <SelectTrigger
                id={`${formId}-item`}
                className="w-full"
                aria-invalid={Boolean(errors.itemId)}
                aria-describedby={
                  errors.itemId ? `${formId}-item-error` : undefined
                }
              >
                <SelectValue placeholder="Choose an item" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {activeCategories.map((category) => (
                  <SelectGroup key={category.id}>
                    <SelectLabel className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: categoryColor(category.color) }}
                        aria-hidden="true"
                      />
                      {category.name}
                    </SelectLabel>
                    {category.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <FieldError id={`${formId}-item-error`} message={errors.itemId} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-amount`}>Amount</Label>
            <div className="flex gap-2">
              <Input
                id={`${formId}-amount`}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={draft.amount}
                onChange={(e) => set("amount", e.target.value)}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={
                  errors.amount ? `${formId}-amount-error` : undefined
                }
                className="h-9 flex-1 text-base tabular-nums"
                autoFocus={Boolean(initial.itemId)}
              />
              <CurrencyToggle
                value={draft.currency}
                onChange={(currency) => set("currency", currency)}
                label="Currency of this expense"
                size="default"
              />
            </div>
            <FieldError id={`${formId}-amount-error`} message={errors.amount} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-date`}>Date</Label>
            <Input
              id={`${formId}-date`}
              type="date"
              min={dateMin}
              max={dateMax}
              value={draft.spentOn}
              onChange={(e) => set("spentOn", e.target.value)}
              aria-invalid={Boolean(errors.spentOn)}
              aria-describedby={
                errors.spentOn ? `${formId}-date-error` : undefined
              }
              className="h-9"
            />
            <FieldError id={`${formId}-date-error`} message={errors.spentOn} />
          </div>

          <div className="rounded-lg bg-muted/70 px-3 py-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {effectiveRate && !showRate ? (
                <span>
                  1 QAR ={" "}
                  <span className="font-medium tabular-nums">
                    {formatRate(effectiveRate)}
                  </span>{" "}
                  PKR
                  <span className="text-muted-foreground"> ({rateLabel})</span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Exchange rate, PKR for 1 QAR
                </span>
              )}
              {!showRate && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  onClick={() => setShowRate(true)}
                >
                  Change rate
                </Button>
              )}
              {converted !== null && (
                <span
                  className="ml-auto text-muted-foreground tabular-nums"
                  aria-live="polite"
                >
                  ≈ {formatMoney(converted, other)}
                </span>
              )}
            </div>
            {showRate && (
              <div className="mt-2 grid gap-1.5">
                <Label htmlFor={`${formId}-rate`} className="sr-only">
                  PKR for 1 QAR
                </Label>
                <Input
                  id={`${formId}-rate`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={
                    todayRate ? formatRate(todayRate.pkrPerQar) : "e.g. 76.50"
                  }
                  value={draft.rateEdited ? draft.pkrPerQar : ""}
                  onChange={(e) => {
                    set("pkrPerQar", e.target.value);
                    set("rateEdited", e.target.value.trim() !== "");
                  }}
                  aria-invalid={Boolean(errors.pkrPerQar)}
                  aria-describedby={
                    errors.pkrPerQar ? `${formId}-rate-error` : undefined
                  }
                  className="h-9 bg-card tabular-nums"
                />
                <FieldError
                  id={`${formId}-rate-error`}
                  message={errors.pkrPerQar}
                />
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-note`}>
              Note{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={`${formId}-note`}
              autoComplete="off"
              placeholder="e.g. Karak with friends"
              value={draft.note}
              maxLength={200}
              onChange={(e) => set("note", e.target.value)}
              aria-invalid={Boolean(errors.note)}
              className="h-9"
            />
            <FieldError message={errors.note} />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:justify-between">
          {!isEdit ? (
            <Button type="button" variant="ghost" onClick={handleSubmit(true)}>
              Save and add another
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form={formId} size="lg" className="min-w-32">
            {isEdit ? "Save changes" : "Add expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={cn("text-sm text-destructive")}>
      {message}
    </p>
  );
}
