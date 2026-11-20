// Calendar helpers. Months are "YYYY-MM" keys and days are "YYYY-MM-DD" keys,
// always interpreted in Asia/Qatar (UTC+3, no DST). Servers run in UTC, so
// never derive "today" or "this month" from Date getters directly.

export type MonthKey = string;
export type DateKey = string;

export const QATAR_TIME_ZONE = "Asia/Qatar";

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_RE = /^(\d{4})-(0[1-9]|1[0-2])-(\d{2})$/;

const pad2 = (n: number) => String(n).padStart(2, "0");

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseMonth(key: MonthKey): { year: number; month: number } {
  const match = MONTH_RE.exec(key);
  if (!match) throw new Error(`Invalid month key: ${key}`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && MONTH_RE.test(value);
}

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string") return false;
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const day = Number(match[3]);
  return day >= 1 && day <= daysInMonth(Number(match[1]), Number(match[2]));
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const { year, month } = parseMonth(key);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${pad2((index % 12) + 1)}`;
}

/** Half-open range [start, end) of calendar days in the month. */
export function monthBounds(key: MonthKey): { start: DateKey; end: DateKey } {
  return { start: `${key}-01`, end: `${addMonths(key, 1)}-01` };
}

export function lastDayOfMonth(key: MonthKey): DateKey {
  const { year, month } = parseMonth(key);
  return `${key}-${pad2(daysInMonth(year, month))}`;
}

export function monthKeyOf(date: DateKey): MonthKey {
  return date.slice(0, 7);
}

/** Inclusive list of months from `from` to `to` (empty if from > to). */
export function monthsBetween(from: MonthKey, to: MonthKey): MonthKey[] {
  const months: MonthKey[] = [];
  for (let key = from; key <= to; key = addMonths(key, 1)) months.push(key);
  return months;
}

export function clampMonth(
  key: MonthKey,
  range: { min: MonthKey; max: MonthKey },
): MonthKey {
  if (key < range.min) return range.min;
  if (key > range.max) return range.max;
  return key;
}

export function todayInQatar(now: Date = new Date()): DateKey {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: QATAR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return monthKeyOf(todayInQatar(now));
}

/** Today if it falls in the month, else the month's first (future) or last (past) day. */
export function defaultEntryDate(month: MonthKey, today: DateKey): DateKey {
  const todayMonth = monthKeyOf(today);
  if (todayMonth === month) return today;
  return todayMonth < month ? `${month}-01` : lastDayOfMonth(month);
}

function utcDate(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

export function formatMonthLabel(
  key: MonthKey,
  style: "long" | "short" = "long",
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate(`${key}-01`));
}

/** "2026-12-05" → "5 Dec" */
export function formatShortDate(date: DateKey): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(utcDate(date));
}

/** "2026-12-05" → "Sat" */
export function formatWeekday(date: DateKey): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(utcDate(date));
}
