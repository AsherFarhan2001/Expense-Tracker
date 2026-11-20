import {
  formatMonthLabel,
  lastDayOfMonth,
  monthKeyOf,
  type DateKey,
  type MonthKey,
} from "@/lib/dates";

export type MonthRange = { min: MonthKey; max: MonthKey };

/** Months the app lets you open: the start month up to this month (or the start month if it's still ahead). */
export function navigableRange(
  startMonth: MonthKey,
  today: DateKey,
): MonthRange {
  const current = monthKeyOf(today);
  return { min: startMonth, max: current > startMonth ? current : startMonth };
}

export function isSpendDateAllowed(date: DateKey, range: MonthRange): boolean {
  return date >= `${range.min}-01` && date <= lastDayOfMonth(range.max);
}

export function describeRange(range: MonthRange): string {
  return range.min === range.max
    ? formatMonthLabel(range.min)
    : `${formatMonthLabel(range.min)} – ${formatMonthLabel(range.max)}`;
}
