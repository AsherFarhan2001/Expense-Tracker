import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Delta } from "@/components/delta";
import { Money } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from "@/db/client";
import { getMonthlyTotals } from "@/features/analysis/queries";
import { DisplayCurrencyToggle } from "@/features/settings/components/display-currency-toggle";
import { getSettings } from "@/features/settings/queries";
import { navigableRange } from "@/features/settings/range";
import { formatMonthLabel, monthKeyOf, todayInQatar } from "@/lib/dates";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}

async function HistoryContent() {
  await connection();
  const db = await getDb();
  const today = todayInQatar();
  const settings = await getSettings(db);
  const range = navigableRange(settings.startMonth, today);
  const currency = settings.displayCurrency;
  const months = await getMonthlyTotals(db, range.min, range.max);

  const totals = months.map((m) => m.totals[currency]);
  const grandTotal = totals.reduce((sum, t) => sum + t, 0);
  const tracked = months.filter((m) => m.entryCount > 0);
  const average =
    tracked.length > 0 ? Math.round(grandTotal / tracked.length) : 0;
  const largest = Math.max(1, ...totals);
  const newestFirst = [...months].reverse();

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            History
          </h1>
          <p className="text-muted-foreground">
            Every month since {formatMonthLabel(range.min)}. Open one to see or
            edit its expenses.
          </p>
        </div>
        <DisplayCurrencyToggle value={currency} />
      </header>

      <dl className="grid grid-cols-2 gap-6 sm:flex sm:gap-12">
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Total tracked</dt>
          <dd>
            <Money
              minor={grandTotal}
              currency={currency}
              className="text-2xl font-semibold tracking-tight"
            />
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Monthly average</dt>
          <dd>
            <Money
              minor={average}
              currency={currency}
              className="text-2xl font-semibold tracking-tight"
            />
          </dd>
        </div>
      </dl>

      <ol className="divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06]">
        {newestFirst.map((m, index) => {
          const previous = newestFirst[index + 1];
          const total = m.totals[currency];
          const isCurrent = m.month === monthKeyOf(today);
          return (
            <li key={m.month}>
              <Link
                href={`/months/${m.month}`}
                className="group grid grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:grid-cols-[10rem_minmax(0,1fr)_9rem_1rem]"
              >
                <span className="grid">
                  <span className="font-medium whitespace-nowrap">
                    {formatMonthLabel(m.month)}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {m.entryCount === 0
                      ? "No expenses"
                      : `${m.entryCount} ${m.entryCount === 1 ? "expense" : "expenses"}`}
                    {isCurrent && (
                      <span className="ml-2 font-medium text-primary">
                        This month
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className="col-span-3 row-start-2 h-1.5 overflow-hidden rounded-full bg-muted sm:col-span-1 sm:row-start-auto"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-full bg-primary/80"
                    style={{ width: `${(total / largest) * 100}%` }}
                  />
                </span>
                <span className="grid justify-items-end">
                  <Money
                    minor={total}
                    currency={currency}
                    className="font-semibold"
                  />
                  {previous && previous.totals[currency] > 0 ? (
                    <Delta
                      current={total}
                      previous={previous.totals[currency]}
                      currency={currency}
                      showAmount={false}
                      className="text-xs"
                    />
                  ) : null}
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading history">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-16 w-80" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
