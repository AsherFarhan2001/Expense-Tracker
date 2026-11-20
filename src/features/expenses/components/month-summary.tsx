"use client";

import { Plus } from "lucide-react";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Delta } from "@/components/delta";
import { Money } from "@/components/money";
import { MonthSwitcher } from "@/components/month-switcher";
import { Button } from "@/components/ui/button";
import type { MonthRange } from "@/features/settings/range";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { addMonths, formatMonthLabel, type MonthKey } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import { categoryColor } from "@/lib/palette";
import type { Ledger } from "../ledger";

const shareFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

type MonthSummaryProps = {
  month: MonthKey;
  isCurrentMonth: boolean;
  range: MonthRange;
  ledger: Ledger;
  previousTotal: number;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onAdd: () => void;
};

export function MonthSummary({
  month,
  isCurrentMonth,
  range,
  ledger,
  previousTotal,
  currency,
  onCurrencyChange,
  onAdd,
}: MonthSummaryProps) {
  const animatedTotal = useAnimatedNumber(ledger.total);
  const [monthName, year] = formatMonthLabel(month).split(" ");
  const previousMonth = addMonths(month, -1);
  const withSpending = ledger.categories.filter((c) => c.total > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <MonthSwitcher
          month={month}
          range={range}
          hrefFor={(m) => `/months/${m}`}
        />
        <CurrencyToggle
          value={currency}
          onChange={onCurrencyChange}
          label="Show totals in"
        />
      </div>

      <h1 className="flex items-baseline gap-3 leading-none">
        <span className="text-5xl font-semibold tracking-[-0.035em] sm:text-6xl">
          {monthName}
        </span>
        <span className="text-2xl font-normal tracking-tight text-muted-foreground">
          {year}
        </span>
      </h1>

      <div className="grid gap-1.5">
        <p className="text-sm text-muted-foreground">
          {isCurrentMonth ? "Spent so far this month" : "Spent this month"}
        </p>
        <p className="text-4xl font-semibold tracking-tight" aria-hidden="true">
          <Money
            minor={animatedTotal}
            currency={currency}
            codeClassName="text-[0.5em] align-[0.35em]"
          />
        </p>
        <p className="sr-only" aria-live="polite" data-testid="month-total">
          {formatMoney(ledger.total, currency)}
        </p>
        {previousTotal > 0 || ledger.total > 0 ? (
          month > range.min || previousTotal > 0 ? (
            <Delta
              current={ledger.total}
              previous={previousTotal}
              currency={currency}
              suffix={`vs ${formatMonthLabel(previousMonth, "short").split(" ")[0]}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Your first tracked month.
            </p>
          )
        ) : null}
        <p className="text-sm text-muted-foreground tabular-nums">
          {ledger.entryCount === 0
            ? "No expenses logged yet."
            : `${ledger.entryCount} ${ledger.entryCount === 1 ? "expense" : "expenses"} logged`}
        </p>
      </div>

      <Button size="lg" className="h-11 w-full text-base" onClick={onAdd}>
        <Plus data-icon="inline-start" />
        Add expense
      </Button>

      {withSpending.length > 0 && (
        <section aria-label="Spending by category" className="grid gap-3">
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            {withSpending.map((category) => (
              <div
                key={category.id}
                className="h-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{
                  width: `${category.share * 100}%`,
                  background: categoryColor(category.color),
                }}
              />
            ))}
          </div>
          <ul className="grid gap-1.5 text-sm">
            {withSpending.map((category) => (
              <li key={category.id} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: categoryColor(category.color) }}
                  aria-hidden="true"
                />
                <span className="truncate">{category.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {shareFormat.format(category.share)}
                </span>
                <Money
                  className="ml-auto"
                  minor={category.total}
                  currency={currency}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
