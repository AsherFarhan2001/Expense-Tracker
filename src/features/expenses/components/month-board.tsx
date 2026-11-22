"use client";

import {
  ChevronDown,
  ListFilter,
  MoreHorizontal,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import { toast } from "sonner";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DeleteCategoryDialog,
  type CategoryToDelete,
} from "@/features/catalog/components/delete-category-dialog";
import type { CategoryUsageMap } from "@/features/catalog/types";
import { searchHref } from "@/features/search/params";
import { useStoredSet } from "@/hooks/use-stored-set";
import { useToday } from "@/hooks/use-today";
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
import { cn } from "@/lib/utils";
import {
  addExpense,
  deleteExpense,
  restoreExpense,
  updateExpense,
} from "../actions";
import { calendarMonthFor } from "../calendar";
import { buildLedger, dailyTotals, type LedgerItem } from "../ledger";
import { prepareExpense } from "../prepare";
import type { EntryView, MonthData } from "../types";
import { AddCategoryForm } from "./add-category-form";
import { AddItemForm } from "./add-item-form";
import {
  ExpenseDialog,
  type ExpenseDraft,
  type ExpenseSubmission,
} from "./expense-dialog";
import { LedgerItemRow } from "./ledger-item-row";
import { MonthCalendar } from "./month-calendar";
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
  usage: CategoryUsageMap;
  displayCurrency: Currency;
  defaultCurrency: Currency;
};

export function MonthBoard({
  data,
  today: serverToday,
  range,
  todayRate,
  usage,
  displayCurrency,
  defaultCurrency,
}: MonthBoardProps) {
  const { month, catalog, suggestions, previousTotals } = data;
  const router = useRouter();
  const today = useToday(serverToday);
  const [entries, applyOptimistic] = useOptimistic(data.entries, applyChange);
  const [currency, setCurrency] = useState(displayCurrency);
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{
    open: boolean;
    category: CategoryToDelete;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // Which categories are folded away; remembered on this device.
  const [collapsed, toggleCollapsed] = useStoredSet(
    "expense-tracker:collapsed-categories",
  );
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
  const totalsByDay = useMemo(
    () => dailyTotals(entries, currency),
    [entries, currency],
  );

  // A new month began while the page was open: reload so "/" shows it.
  useEffect(() => {
    if (monthKeyOf(today) !== monthKeyOf(serverToday)) router.refresh();
  }, [today, serverToday, router]);
  const itemNames = useMemo(
    () =>
      new Map(
        catalog.flatMap((c) => c.items.map((i) => [i.id, i.name] as const)),
      ),
    [catalog],
  );
  /** First active item per category, or undefined when it has none yet. */
  const firstActiveItem = useMemo(
    () =>
      new Map(catalog.map((c) => [c.id, c.items.find((i) => !i.archived)?.id])),
    [catalog],
  );

  function blankDraft(
    itemId = "",
    spentOn = defaultEntryDate(month, today),
  ): ExpenseDraft {
    return {
      itemId,
      amount: "",
      currency: defaultCurrency,
      spentOn,
      pkrPerQar: todayRate?.pkrPerQar ?? "",
      rateEdited: false,
      note: "",
    };
  }

  const askToDelete = (categoryId: string) => {
    const category = catalog.find((c) => c.id === categoryId);
    if (!category) return;
    setDeleting({
      open: true,
      category: {
        id: category.id,
        name: category.name,
        archived: category.archived,
        itemCount: category.items.length,
        usage: usage[category.id],
      },
    });
  };

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
          today={today}
          isCurrentMonth={monthKeyOf(today) === month}
          range={range}
          ledger={ledger}
          previousTotal={previousTotals[currency]}
          currency={currency}
          onCurrencyChange={changeCurrency}
          onAdd={() => openDialog(blankDraft())}
          calendar={
            <MonthCalendar
              month={calendarMonthFor(month, today, range)}
              today={today}
              range={range}
              totals={totalsByDay}
              currency={currency}
              onPickDay={(date) => openDialog(blankDraft("", date))}
            />
          }
        />
      </aside>

      <div className="grid content-start gap-9 self-start rounded-2xl bg-card px-4 py-5 ring-1 ring-foreground/[0.06] sm:px-6 sm:py-6">
        {ledger.categories.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            You have no active categories. Add one below.
          </p>
        ) : (
          <div className="grid gap-9">
            {ledger.categories.map((category) => {
              const headingId = `category-${category.id}`;
              const firstItemId = firstActiveItem.get(category.id);
              const isCollapsed = collapsed.has(category.id);
              const itemsId = `category-items-${category.id}`;
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
                      <button
                        type="button"
                        onClick={() => toggleCollapsed(category.id)}
                        aria-expanded={!isCollapsed}
                        aria-controls={itemsId}
                        className="-ml-1.5 flex items-center gap-1 rounded-md px-1 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
                            isCollapsed && "-rotate-90",
                          )}
                        />
                        {category.name}
                      </button>
                    </h2>
                    {category.archived && (
                      <Badge variant="outline">Archived</Badge>
                    )}
                    {category.total > 0 && (
                      <span className="pb-0.5 text-xs text-muted-foreground tabular-nums">
                        {shareFormat.format(category.share)} of month
                      </span>
                    )}
                    {isCollapsed && (
                      <span className="hidden pb-0.5 text-xs text-muted-foreground tabular-nums sm:inline">
                        {category.items.length}{" "}
                        {category.items.length === 1 ? "item" : "items"} hidden
                      </span>
                    )}
                    <Money
                      className="ml-auto text-lg font-semibold"
                      minor={category.total}
                      currency={currency}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="-mr-1.5 self-center text-muted-foreground"
                          aria-label={`${category.name} options`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={searchHref({ category: category.id })}>
                            <ListFilter /> See all expenses
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings">
                            <Settings2 /> Edit in Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => askToDelete(category.id)}
                        >
                          <Trash2 /> Delete category…
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div id={itemsId} hidden={isCollapsed}>
                    {category.items.length === 0 ? (
                      firstItemId ? (
                        <p className="py-4 text-sm text-muted-foreground">
                          Nothing logged here this month.{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => openDialog(blankDraft(firstItemId))}
                          >
                            Add an expense
                          </Button>
                        </p>
                      ) : (
                        <p className="pt-4 pb-1 text-sm text-muted-foreground">
                          No items yet. Add what you spend on in {category.name}
                          .
                        </p>
                      )
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
                    {!category.archived && (
                      <AddItemForm
                        categoryId={category.id}
                        categoryName={category.name}
                        defaultOpen={!firstItemId}
                        autoFocus={category.id === newCategoryId}
                      />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <AddCategoryForm existing={catalog} onCreated={setNewCategoryId} />
      </div>

      <Button
        size="icon-lg"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg shadow-primary/25 md:hidden"
        onClick={() => openDialog(blankDraft())}
        aria-label="Add expense"
      >
        <Plus className="size-6" />
      </Button>

      {deleting && (
        <DeleteCategoryDialog
          category={deleting.category}
          currency={currency}
          open={deleting.open}
          onOpenChange={(open) =>
            setDeleting((current) => current && { ...current, open })
          }
        />
      )}

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
