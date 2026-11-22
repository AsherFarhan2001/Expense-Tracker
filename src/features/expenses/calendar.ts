import type { MonthRange } from "@/features/settings/range";
import { monthKeyOf, type DateKey, type MonthKey } from "@/lib/dates";

/**
 * The month the calendar shows: the month being viewed, except before
 * tracking starts. Then the page lists the start month but today is earlier,
 * so the calendar shows today's month to keep today visible and highlighted.
 */
export function calendarMonthFor(
  viewed: MonthKey,
  today: DateKey,
  range: MonthRange,
): MonthKey {
  const todayMonth = monthKeyOf(today);
  return todayMonth < range.min ? todayMonth : viewed;
}
