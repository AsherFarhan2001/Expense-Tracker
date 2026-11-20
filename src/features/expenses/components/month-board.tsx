"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RateInfo } from "@/features/currency/types";
import { setDisplayCurrency } from "@/features/settings/actions";
import type { MonthRange } from "@/features/settings/range";
import {
  defaultEntryDate,
  formatMonthLabel,
  monthKeyOf,
  type DateKey,
} from "@/lib/dates";
import { formatMinorForInput, formatMoney, type Currency } from "@/lib/money";
import { categoryColor } from "@/lib/palette";
import {
  addExpense,
  deleteExpense,
  restoreExpense,
  updateExpense,
} from "../actions";
import { buildLedger, type LedgerItem } from "../ledger";
import { prepareExpense } from "../prepare";
import type { EntryView, MonthData } from "../types";
import {
  ExpenseDialog,
  type ExpenseDraft,
  type ExpenseSubmission,
} from "./expense-dialog";
import { LedgerItemRow } from "./ledger-item-row";
import { MonthSummary } from "./month-summary";

type OptimisticChange =
  { type: "upsert"; entry: EntryView } | { type: "remove"; id: string };

function applyChange(
  entries: EntryView[],
  change: OptimisticChange,
): EntryView[] {
  if (change.type === "remove")
    return entries.filter((e) => e.id !== change.id);
  const rest = entries.filter((e) => e.id !== change.entry.id);
  return [change.entry, ...rest];
}

const shareFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

type MonthBoardProps = {
  data: MonthData;
  today: DateKey;
  range: MonthRange;
  todayRate: RateInfo | null;
  displayCurrency: Currency;
  defaultCurrency: Currency;
};

export function MonthBoard({
  data,
  today,
  range,
  todayRate,
  displayCurrency,
  defaultCurrency,
}: MonthBoardProps) {
  const { month, catalog, suggestions, previousTotals } = data;
  const router = useRouter();
  const [entries, applyOptimistic] = useOptimistic(data.entries, applyChange);
  const [currency, setCurrency] = useState(displayCurrency);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [dialog, setDialog] = useState<{
    open: boolean;
    key: number;
    draft: ExpenseDraft;
  }>(() => ({
    open: false,
    key: 0,
    draft: blankDraft(),
  }));

  const ledger = useMemo(
    () => buildLedger(catalog, entries, suggestions, currency),
    [catalog, entries, suggestions, currency],
  );
  const itemNames = useMemo(
    () =>
      new Map(
        catalog.flatMap((c) => c.items.map((i) => [i.id, i.name] as const)),
      ),
    [catalog],
  );

  function blankDraft(itemId = ""): ExpenseDraft {
    return {
      itemId,
      amount: "",
      currency: defaultCurrency,
      spentOn: defaultEntryDate(month, today),
      pkrPerQar: todayRate?.pkrPerQar ?? "",
      rateEdited: false,
      note: "",
    };
  }

  const openDialog = (draft: ExpenseDraft) =>
    setDialog((d) => ({ open: true, key: d.key + 1, draft }));

  const changeCurrency = (next: Currency) => {
    setCurrency(next);
    startTransition(async () => {
      await setDisplayCurrency(next);
    });
  };

  const toggle = (itemId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  const save = (
    { draft, input, rate }: ExpenseSubmission,
    addAnother: boolean,
  ) => {
    if (!addAnother) setDialog((d) => ({ ...d, open: false }));
    const prepared = prepareExpense(
      input,
      rate,
      draft.rateEdited ? "manual" : "auto",
    );
    const optimistic: EntryView = {
      ...prepared,
      id: draft.id ?? `temp-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const name = itemNames.get(input.itemId) ?? "Expense";
    const leavesMonth = monthKeyOf(input.spentOn) !== month;

    startTransition(async () => {
      if (!leavesMonth) applyOptimistic({ type: "upsert", entry: optimistic });
      else if (draft.id) applyOptimistic({ type: "remove", id: draft.id });
      const result = draft.id
        ? await updateExpense({ ...input, id: draft.id })
        : await addExpense(input);
      if (!result.ok) {
        toast.error(result.error, {
          action: { label: "Fix it", onClick: () => openDialog(draft) },
        });
        return;
      }
      if (leavesMonth) {
        const target = monthKeyOf(input.spentOn);
        toast.success(`${name} saved to ${formatMonthLabel(target)}`, {
          action: {
            label: "Open month",
            onClick: () => router.push(`/months/${target}`),
          },
        });
      } else if (draft.id) {
        toast.success(`${name} updated`);
      }
    });
  };

  const remove = (entry: EntryView) => {
    const name = itemNames.get(entry.itemId) ?? "Expense";
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: entry.id });
      const result = await deleteExpense({ id: entry.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast(`Deleted ${name}`, {
        description: formatMoney(entry.amountMinor, entry.currency),
        duration: 6000,
        action: { label: "Undo", onClick: () => undo(entry) },
      });
    });
  };

  const undo = (entry: EntryView) => {
    startTransition(async () => {
      applyOptimistic({ type: "upsert", entry });
      const result = await restoreExpense({ id: entry.id });
      if (!result.ok) toast.error(result.error);
    });
  };

  const editDraft = (entry: EntryView): ExpenseDraft => ({
    id: entry.id,
    itemId: entry.itemId,
    amount: formatMinorForInput(entry.amountMinor),
    currency: entry.currency,
    spentOn: entry.spentOn,
    pkrPerQar: entry.pkrPerQar,
    rateEdited: false,
    note: entry.note ?? "",
  });

  const suggestionDraft = (item: LedgerItem): ExpenseDraft => ({
    ...blankDraft(item.id),
    amount: item.suggestion
      ? formatMinorForInput(item.suggestion.amountMinor)
      : "",
    currency: item.suggestion?.currency ?? defaultCurrency,
  });

  const confirmSuggestion = (item: LedgerItem) => {
    if (!item.suggestion) return;
    const draft = suggestionDraft(item);
    if (!todayRate) {
      openDialog(draft);
      return;
    }
    save(
      {
        draft,
        rate: todayRate.pkrPerQar,
        input: {
          itemId: item.id,
          amount: draft.amount,
          currency: draft.currency,
          spentOn: draft.spentOn,
        },
      },
      false,
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <MonthSummary
          month={month}
          isCurrentMonth={monthKeyOf(today) === month}
          range={range}
          ledger={ledger}
          previousTotal={previousTotals[currency]}
          currency={currency}
          onCurrencyChange={changeCurrency}
          onAdd={() => openDialog(blankDraft())}
        />
      </aside>

      <div className="rounded-2xl bg-card px-4 py-5 ring-1 ring-foreground/[0.06] sm:px-6 sm:py-6">
        {ledger.categories.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground">
              You have no active categories.
            </p>
            <Button asChild variant="outline">
              <Link href="/settings">Add a category</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-9">
            {ledger.categories.map((category) => {
              const headingId = `category-${category.id}`;
              return (
                <section key={category.id} aria-labelledby={headingId}>
                  <div
                    className="flex items-end gap-3 border-b-2 pb-2"
                    style={{ borderColor: categoryColor(category.color) }}
                  >
                    <h2
                      id={headingId}
                      className="text-lg font-semibold tracking-tight"
                    >
                      {category.name}
                    </h2>
                    {category.archived && (
                      <Badge variant="outline">Archived</Badge>
                    )}
                    {category.total > 0 && (
                      <span className="pb-0.5 text-xs text-muted-foreground tabular-nums">
                        {shareFormat.format(category.share)} of month
                      </span>
                    )}
                    <Money
                      className="ml-auto text-lg font-semibold"
                      minor={category.total}
                      currency={currency}
                    />
                  </div>
                  {category.items.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      Nothing logged here this month.{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => openDialog(blankDraft())}
                      >
                        Add an expense
                      </Button>
                    </p>
                  ) : (
                    <ul className="mt-1">
                      {category.items.map((item) => (
                        <LedgerItemRow
                          key={item.id}
                          item={item}
                          currency={currency}
                          expanded={expanded.has(item.id)}
                          onToggle={() => toggle(item.id)}
                          onAdd={() => openDialog(blankDraft(item.id))}
                          onEdit={(entry) => openDialog(editDraft(entry))}
                          onDelete={remove}
                          onConfirmSuggestion={() => confirmSuggestion(item)}
                          onEditSuggestion={() =>
                            openDialog(suggestionDraft(item))
                          }
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Button
        size="icon-lg"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg shadow-primary/25 md:hidden"
        onClick={() => openDialog(blankDraft())}
        aria-label="Add expense"
      >
        <Plus className="size-6" />
      </Button>

      <ExpenseDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        draft={dialog.draft}
        catalog={catalog}
        todayRate={todayRate}
        range={range}
        onSubmit={save}
      />
    </div>
  );
}
