"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { isSpendDateAllowed, type MonthRange } from "@/features/settings/range";
import {
  calendarWeeks,
  formatLongDate,
  formatMonthLabel,
  monthKeyOf,
  WEEKDAY_LABELS,
  weekdayOf,
  type DateKey,
  type MonthKey,
} from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
/** Friday and Saturday: the weekend in Qatar. */
const isWeekend = (weekday: number) => weekday === 5 || weekday === 6;

type MonthCalendarProps = {
  /** The month shown (see `calendarMonthFor`). */
  month: MonthKey;
  today: DateKey;
  /** Months expenses can be logged in; days outside it can't be picked. */
  range: MonthRange;
  /** Spent per day in `currency`; days with nothing logged are absent. */
  totals: ReadonlyMap<DateKey, number>;
  currency: Currency;
  onPickDay: (date: DateKey) => void;
};

/** Every day of the month by weekday. Today is filled; a dot marks days with spending. */
export function MonthCalendar({
  month,
  today,
  range,
  totals,
  currency,
  onPickDay,
}: MonthCalendarProps) {
  const weeks = calendarWeeks(month);
  const beforeTracking = month < range.min;
  const showsToday = monthKeyOf(today) === month;
  const daysWithSpending = [...totals.keys()].filter(
    (date) => monthKeyOf(date) === month && (totals.get(date) ?? 0) > 0,
  ).length;

  return (
    <section
      aria-label="Calendar"
      className="rounded-2xl bg-card p-3 ring-1 ring-foreground/[0.06] sm:p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-semibold tracking-tight">
          {formatMonthLabel(month)}
        </h2>
        {!showsToday && (
          <Link
            href="/"
            className="-mr-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Today
            <ChevronRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>

      <table className="w-full table-fixed border-collapse text-center">
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((label, weekday) => (
              <th
                key={label}
                scope="col"
                abbr={WEEKDAY_NAMES[weekday]}
                className={cn(
                  "pb-1.5 text-[11px] font-medium text-muted-foreground",
                  isWeekend(weekday) && "text-muted-foreground/60",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.find(Boolean)}>
              {week.map((date, index) => (
                <td key={date ?? `blank-${index}`} className="p-0.5">
                  {date && (
                    <DayButton
                      date={date}
                      isToday={date === today}
                      canAdd={isSpendDateAllowed(date, range)}
                      spent={totals.get(date) ?? 0}
                      currency={currency}
                      onPick={() => onPickDay(date)}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 px-1 text-xs text-muted-foreground tabular-nums">
        {beforeTracking
          ? `Tracking starts on ${formatLongDate(`${range.min}-01`)}.`
          : daysWithSpending === 0
            ? "No spending yet. Tap a day to add an expense."
            : `Spent on ${daysWithSpending} ${daysWithSpending === 1 ? "day" : "days"}. Tap a day to add an expense.`}
      </p>
    </section>
  );
}

function DayButton({
  date,
  isToday,
  canAdd,
  spent,
  currency,
  onPick,
}: {
  date: DateKey;
  isToday: boolean;
  canAdd: boolean;
  spent: number;
  currency: Currency;
  onPick: () => void;
}) {
  const amount = spent > 0 ? formatMoney(spent, currency) : null;
  const label = `${formatLongDate(date)}${isToday ? ", today" : ""}`;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!canAdd}
      aria-current={isToday ? "date" : undefined}
      aria-label={
        canAdd
          ? `${label}: ${amount ? `${amount} spent` : "nothing logged"}. Add an expense`
          : label
      }
      title={amount ?? undefined}
      className={cn(
        "relative mx-auto grid aspect-square w-full max-w-10 place-items-center rounded-full text-sm tabular-nums transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        canAdd ? "hover:bg-muted" : "cursor-default",
        !isToday && !canAdd && "text-muted-foreground/45",
        !isToday &&
          canAdd &&
          isWeekend(weekdayOf(date)) &&
          "text-muted-foreground",
        isToday && "bg-primary font-semibold text-primary-foreground",
        isToday && canAdd && "hover:bg-primary/85",
      )}
    >
      {Number(date.slice(8))}
      {amount && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-[14%] size-1 rounded-full",
            isToday ? "bg-primary-foreground" : "bg-primary",
          )}
        />
      )}
    </button>
  );
}
