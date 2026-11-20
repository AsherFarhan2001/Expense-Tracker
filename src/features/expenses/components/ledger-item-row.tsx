"use client";

import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { formatShortDate, formatWeekday } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { amountIn, type LedgerItem } from "../ledger";
import type { EntryView } from "../types";

export const isPendingEntry = (entry: EntryView) =>
  entry.id.startsWith("temp-");

type LedgerItemRowProps = {
  item: LedgerItem;
  currency: Currency;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (entry: EntryView) => void;
  onDelete: (entry: EntryView) => void;
  onConfirmSuggestion: () => void;
  onEditSuggestion: () => void;
};

export function LedgerItemRow({
  item,
  currency,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  onConfirmSuggestion,
  onEditSuggestion,
}: LedgerItemRowProps) {
  const count = item.entries.length;
  const hasEntries = count > 0;
  const entriesId = `entries-${item.id}`;

  return (
    <li data-testid={`item-${item.name}`}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={hasEntries ? onToggle : onAdd}
          aria-expanded={hasEntries ? expanded : undefined}
          aria-controls={hasEntries ? entriesId : undefined}
          className="flex min-w-0 flex-1 items-baseline gap-2 rounded-md py-2.5 pr-1 pl-1 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ChevronRight
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 self-center text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
              expanded && "rotate-90",
              !hasEntries && "invisible",
            )}
          />
          <span
            className={cn("truncate", item.archived && "text-muted-foreground")}
          >
            {item.name}
          </span>
          {count > 1 && (
            <span
              className="shrink-0 text-xs text-muted-foreground tabular-nums"
              aria-label={`${count} entries`}
            >
              ×{count}
            </span>
          )}
          <span className="ledger-leader" aria-hidden="true" />
          {hasEntries ? (
            <Money
              minor={item.total}
              currency={currency}
              className="font-medium"
            />
          ) : (
            <span className="text-muted-foreground" aria-label="Nothing logged">
              —
            </span>
          )}
        </button>
        {!item.archived && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAdd}
            aria-label={`Add ${item.name} expense`}
            className="text-muted-foreground hover:text-primary"
          >
            <Plus />
          </Button>
        )}
      </div>

      {item.suggestion && (
        <div className="mb-2 ml-7 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed border-primary/35 bg-accent/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Same as last month?{" "}
            <Money
              minor={item.suggestion.amountMinor}
              currency={item.suggestion.currency}
              className="font-medium text-foreground"
            />
          </span>
          <span className="ml-auto flex gap-1">
            <Button size="sm" variant="ghost" onClick={onEditSuggestion}>
              Change amount
            </Button>
            <Button size="sm" onClick={onConfirmSuggestion}>
              Confirm
            </Button>
          </span>
        </div>
      )}

      {hasEntries && expanded && (
        <ul
          id={entriesId}
          className="mb-2 ml-[1.15rem] border-l border-border pl-4"
        >
          {item.entries.map((entry) => {
            const pending = isPendingEntry(entry);
            const converted = entry.currency !== currency;
            return (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 py-1.5 text-sm",
                  pending && "opacity-60",
                )}
              >
                <span className="w-20 shrink-0 text-muted-foreground tabular-nums">
                  {formatWeekday(entry.spentOn)}{" "}
                  {formatShortDate(entry.spentOn)}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {entry.note}
                </span>
                {converted && (
                  <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                    {formatMoney(entry.amountMinor, entry.currency)}
                  </span>
                )}
                <Money minor={amountIn(entry, currency)} currency={currency} />
                <span className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={pending}
                    onClick={() => onEdit(entry)}
                    aria-label={`Edit ${item.name} expense of ${formatMoney(entry.amountMinor, entry.currency)} on ${formatShortDate(entry.spentOn)}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={pending}
                    onClick={() => onDelete(entry)}
                    aria-label={`Delete ${item.name} expense of ${formatMoney(entry.amountMinor, entry.currency)} on ${formatShortDate(entry.spentOn)}`}
                    className="hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
