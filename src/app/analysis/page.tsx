import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { Delta } from "@/components/delta";
import { Money } from "@/components/money";
import { MonthSwitcher } from "@/components/month-switcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from "@/db/client";
import {
  biggestChanges,
  categoryShares,
  compareItems,
  type ItemComparison,
} from "@/features/analysis/compare";
import { CategoryDonut } from "@/features/analysis/components/category-donut";
import { ItemComparisonChart } from "@/features/analysis/components/item-comparison-chart";
import { TrendChart } from "@/features/analysis/components/trend-chart";
import {
  getMonthComparison,
  getMonthlyTotals,
} from "@/features/analysis/queries";
import { getCatalog } from "@/features/expenses/queries";
import { DisplayCurrencyToggle } from "@/features/settings/components/display-currency-toggle";
import { getSettings } from "@/features/settings/queries";
import { navigableRange } from "@/features/settings/range";
import {
  addMonths,
  clampMonth,
  formatMonthLabel,
  isMonthKey,
  todayInQatar,
} from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import { categoryColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analysis" };

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

export default function AnalysisPage({ searchParams }: PageProps<"/analysis">) {
  return (
    <Suspense fallback={<AnalysisSkeleton />}>
      <AnalysisContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AnalysisContent({
  searchParams,
}: Pick<PageProps<"/analysis">, "searchParams">) {
  await connection();
  const { month: requested } = await searchParams;
  const db = await getDb();
  const settings = await getSettings(db);
  const range = navigableRange(settings.startMonth, todayInQatar());
  const month = isMonthKey(requested)
    ? clampMonth(requested, range)
    : range.max;
  const previousMonth = addMonths(month, -1);
  const currency = settings.displayCurrency;

  const [catalog, comparison, monthly] = await Promise.all([
    getCatalog(db),
    getMonthComparison(db, month),
    getMonthlyTotals(db, range.min, range.max),
  ]);

  const rows = compareItems(
    catalog,
    comparison.current,
    comparison.previous,
    currency,
  );
  const shares = categoryShares(catalog, comparison.current, currency);
  const total = rows.reduce((sum, r) => sum + r.current, 0);
  const previousTotal = rows.reduce((sum, r) => sum + r.previous, 0);
  const { increases, decreases } = biggestChanges(rows, 1);
  const monthName = formatMonthLabel(month).split(" ")[0]!;
  const previousName = formatMonthLabel(previousMonth).split(" ")[0]!;
  const chartRows = rows
    .filter((r) => r.current > 0 || r.previous > 0)
    .slice(0, 14);

  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Analysis
          </h1>
          <p className="text-muted-foreground">
            {formatMonthLabel(month)} compared with{" "}
            {formatMonthLabel(previousMonth)}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSwitcher
            month={month}
            range={range}
            hrefFor={(m) => `/analysis?month=${m}`}
          />
          <DisplayCurrencyToggle value={currency} />
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl bg-card px-6 py-16 text-center ring-1 ring-foreground/[0.06]">
          <p className="text-lg font-medium">Nothing to compare yet</p>
          <p className="max-w-sm text-muted-foreground">
            Log expenses for {formatMonthLabel(month)} and the charts will fill
            in here.
          </p>
          <Button asChild>
            <Link href={`/months/${month}`}>Open {monthName}</Link>
          </Button>
        </div>
      ) : (
        <>
          <dl className="grid divide-y rounded-2xl bg-card ring-1 ring-foreground/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Stat label={`Spent in ${monthName}`}>
              <Money
                minor={total}
                currency={currency}
                className="text-2xl font-semibold tracking-tight"
              />
              {previousTotal > 0 ? (
                <Delta
                  current={total}
                  previous={previousTotal}
                  currency={currency}
                  suffix={`vs ${previousName}`}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No spending logged in {previousName}.
                </span>
              )}
            </Stat>
            <Stat label="Biggest increase">
              <ChangeHighlight
                row={increases[0]}
                currency={currency}
                direction="up"
              />
            </Stat>
            <Stat label="Biggest drop">
              <ChangeHighlight
                row={decreases[0]}
                currency={currency}
                direction="down"
              />
            </Stat>
          </dl>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <ChartSection
              title="Item by item"
              description={`What you spent on each item in ${monthName} and ${previousName}.`}
            >
              <ItemComparisonChart
                rows={chartRows}
                currency={currency}
                currentLabel={formatMonthLabel(month, "short")}
                previousLabel={formatMonthLabel(previousMonth, "short")}
              />
            </ChartSection>
            <ChartSection
              title="Where the money went"
              description={`Share of ${monthName} by category.`}
            >
              {shares.length > 0 ? (
                <CategoryDonut
                  shares={shares}
                  currency={currency}
                  total={total}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No spending in {monthName} yet.
                </p>
              )}
            </ChartSection>
          </div>

          <ChartSection
            title="Monthly totals"
            description={
              monthly.length > 1
                ? `Every month since ${formatMonthLabel(range.min)}.`
                : "Your trend line grows as you log more months."
            }
          >
            <TrendChart months={monthly} currency={currency} selected={month} />
          </ChartSection>

          <ChartSection
            title="Full breakdown"
            description="The same comparison as a table."
          >
            <ComparisonTable
              rows={rows}
              currency={currency}
              currentLabel={formatMonthLabel(month, "short")}
              previousLabel={formatMonthLabel(previousMonth, "short")}
            />
          </ChartSection>
        </>
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1.5 px-5 py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="grid gap-1">{children}</dd>
    </div>
  );
}

function ChangeHighlight({
  row,
  currency,
  direction,
}: {
  row: ItemComparison | undefined;
  currency: Currency;
  direction: "up" | "down";
}) {
  if (!row) {
    return (
      <span className="text-sm text-muted-foreground">
        {direction === "up" ? "Nothing went up." : "Nothing went down."}
      </span>
    );
  }
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <>
      <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span
          className="size-2.5 shrink-0 rounded-[3px]"
          style={{ background: categoryColor(row.color) }}
          aria-hidden="true"
        />
        {row.name}
      </span>
      <span
        className={cn(
          "flex items-center gap-1 text-sm tabular-nums",
          direction === "up" ? "text-increase" : "text-decrease",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {formatMoney(row.delta, currency, { signed: true })}
        {row.deltaRatio !== null &&
          ` (${percent.format(Math.abs(row.deltaRatio))})`}
      </span>
    </>
  );
}

function ChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid content-start gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.06] sm:p-6">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ComparisonTable({
  rows,
  currency,
  currentLabel,
  previousLabel,
}: {
  rows: ItemComparison[];
  currency: Currency;
  currentLabel: string;
  previousLabel: string;
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">
              Item
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-3 font-medium md:table-cell"
            >
              Category
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-3 text-right font-medium sm:table-cell"
            >
              {previousLabel}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {currentLabel}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.itemId}>
              <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: categoryColor(row.color) }}
                    aria-hidden="true"
                  />
                  {row.name}
                </span>
              </th>
              <td className="hidden py-2.5 pr-3 text-muted-foreground md:table-cell">
                {row.categoryName}
              </td>
              <td className="hidden py-2.5 pr-3 text-right text-muted-foreground tabular-nums sm:table-cell">
                {formatMoney(row.previous, currency, { code: false })}
              </td>
              <td className="py-2.5 pr-3 text-right font-medium tabular-nums">
                {formatMoney(row.current, currency, { code: false })}
              </td>
              <td
                className={cn(
                  "py-2.5 text-right tabular-nums",
                  row.delta > 0 && "text-increase",
                  row.delta < 0 && "text-decrease",
                  row.delta === 0 && "text-muted-foreground",
                )}
              >
                {row.delta === 0
                  ? "—"
                  : formatMoney(row.delta, currency, {
                      code: false,
                      signed: true,
                    })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Amounts in {currency}.
      </p>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid gap-10" aria-busy="true" aria-label="Loading analysis">
      <div className="grid gap-2">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
