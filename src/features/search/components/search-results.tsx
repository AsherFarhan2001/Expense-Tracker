import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Money } from "@/components/money";
import { amountIn } from "@/features/expenses/ledger";
import {
  formatMonthLabel,
  formatShortDate,
  formatWeekday,
  monthKeyOf,
} from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import { categoryColor } from "@/lib/palette";
import { groupByMonth, summarizeMatches } from "../summary";
import type { ItemMatch, SearchResults } from "../types";

type SearchResultsViewProps = {
  results: SearchResults;
  currency: Currency;
  /** What was searched, e.g. "Umrah" or "Umrah: “hotel”". */
  title: string;
  /** Shown when nothing matched. */
  emptyTitle: string;
  rowLimit: number;
};

export function SearchResultsView({
  results,
  currency,
  title,
  emptyTitle,
  rowLimit,
}: SearchResultsViewProps) {
  const summary = summarizeMatches(results.items, currency);
  if (summary.count === 0) {
    return (
      <SearchMessage title={emptyTitle}>
        Try fewer words or check the spelling. Search looks at category, item
        and note names in every month.
      </SearchMessage>
    );
  }

  const groups = groupByMonth(results.rows, currency);
  const mixed = new Set(results.items.map((i) => i.categoryId)).size > 1;
  const firstMonth = monthKeyOf(summary.firstDate!);
  const lastMonth = monthKeyOf(summary.lastDate!);
  const period =
    firstMonth === lastMonth
      ? formatMonthLabel(firstMonth)
      : `${formatMonthLabel(firstMonth)} to ${formatMonthLabel(lastMonth)}`;

  return (
    <div className="grid gap-8">
      <section aria-labelledby="search-summary" className="grid gap-4">
        <h2
          id="search-summary"
          className="text-2xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        <dl className="flex flex-wrap gap-x-12 gap-y-4">
          <Stat label="Total">
            <span data-testid="search-total">
              <Money
                minor={summary.total}
                currency={currency}
                className="text-2xl font-semibold tracking-tight"
              />
            </span>
          </Stat>
          <Stat label="Expenses">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {summary.count}
            </span>
          </Stat>
          <Stat label="Period">
            <span className="text-lg leading-8 font-medium">{period}</span>
          </Stat>
        </dl>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
        <section aria-labelledby="search-by-item" className="grid gap-4">
          <h3
            id="search-by-item"
            className="border-b pb-2 text-sm font-medium text-muted-foreground"
          >
            By item
          </h3>
          <ItemBreakdown
            items={results.items}
            currency={currency}
            showCategory={mixed}
          />
        </section>

        <section aria-labelledby="search-by-month" className="grid gap-4">
          <h3 id="search-by-month" className="sr-only">
            Expenses by month
          </h3>
          {results.truncated && (
            <p className="text-sm text-muted-foreground">
              Showing the latest {rowLimit} of {summary.count} expenses. The
              total and the item breakdown include all of them.
            </p>
          )}
          <div className="grid gap-8 rounded-2xl bg-card px-4 py-5 ring-1 ring-foreground/[0.06] sm:px-6 sm:py-6">
            {groups.map((group) => (
              <section
                key={group.month}
                aria-labelledby={`search-month-${group.month}`}
              >
                <div className="flex items-baseline gap-3 border-b pb-2">
                  <h4 id={`search-month-${group.month}`}>
                    <Link
                      href={`/months/${group.month}`}
                      className="group inline-flex items-center gap-1 font-semibold tracking-tight hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {formatMonthLabel(group.month)}
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </Link>
                  </h4>
                  <Money
                    minor={group.total}
                    currency={currency}
                    className="ml-auto font-semibold"
                  />
                </div>
                <ul className="divide-y divide-border/60">
                  {group.rows.map((row) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-baseline gap-3 py-2.5"
                    >
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {formatWeekday(row.spentOn)}{" "}
                        {formatShortDate(row.spentOn)}
                      </span>
                      <span className="grid min-w-0">
                        <span className="truncate">{row.itemName}</span>
                        {(mixed || row.note) && (
                          <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                            {mixed && (
                              <span className="inline-flex shrink-0 items-center gap-1.5">
                                <span
                                  aria-hidden="true"
                                  className="size-2 rounded-full"
                                  style={{
                                    background: categoryColor(
                                      row.categoryColor,
                                    ),
                                  }}
                                />
                                {row.categoryName}
                              </span>
                            )}
                            {row.note && (
                              <span className="max-w-full truncate">
                                {row.note}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      <span className="grid justify-items-end">
                        <Money
                          minor={amountIn(row, currency)}
                          currency={currency}
                          className="font-medium"
                        />
                        {row.currency !== currency && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatMoney(row.amountMinor, row.currency)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ItemBreakdown({
  items,
  currency,
  showCategory,
}: {
  items: readonly ItemMatch[];
  currency: Currency;
  showCategory: boolean;
}) {
  const totalOf = (item: ItemMatch) =>
    currency === "QAR" ? item.qarMinor : item.pkrMinor;
  const largest = Math.max(1, ...items.map(totalOf));
  return (
    <ul className="grid gap-4">
      {items.map((item) => (
        <li key={item.itemId} className="grid gap-1.5">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-medium">{item.itemName}</span>
            {showCategory && (
              <span className="truncate text-sm text-muted-foreground">
                {item.categoryName}
              </span>
            )}
            <span
              className="shrink-0 text-xs text-muted-foreground tabular-nums"
              aria-label={`${item.count} ${item.count === 1 ? "expense" : "expenses"}`}
            >
              ×{item.count}
            </span>
            <Money
              minor={totalOf(item)}
              currency={currency}
              className="ml-auto font-medium"
            />
          </div>
          <span
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${(totalOf(item) / largest) * 100}%`,
                background: categoryColor(item.categoryColor),
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function SearchMessage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-foreground/15 px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-prose text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
