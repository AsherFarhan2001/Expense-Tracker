import { describe, expect, it } from "vitest";
import {
  addMonths,
  clampMonth,
  currentMonthKey,
  defaultEntryDate,
  formatMonthLabel,
  formatShortDate,
  isDateKey,
  isMonthKey,
  lastDayOfMonth,
  monthBounds,
  monthKeyOf,
  monthsBetween,
  todayInQatar,
} from "./dates";

describe("month keys", () => {
  it("validates YYYY-MM", () => {
    expect(isMonthKey("2026-12")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey("abcd-12")).toBe(false);
  });

  it("validates YYYY-MM-DD including real calendar days", () => {
    expect(isDateKey("2026-12-31")).toBe(true);
    expect(isDateKey("2027-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-12-1")).toBe(false);
  });

  it("adds and subtracts months across years", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(addMonths("2026-12", 13)).toBe("2028-01");
  });

  it("returns half-open month bounds", () => {
    expect(monthBounds("2026-12")).toEqual({
      start: "2026-12-01",
      end: "2027-01-01",
    });
  });

  it("knows the last day of a month", () => {
    expect(lastDayOfMonth("2026-12")).toBe("2026-12-31");
    expect(lastDayOfMonth("2027-02")).toBe("2027-02-28");
  });

  it("extracts the month of a date", () => {
    expect(monthKeyOf("2026-12-15")).toBe("2026-12");
  });

  it("lists months inclusively", () => {
    expect(monthsBetween("2026-12", "2027-02")).toEqual([
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
    expect(monthsBetween("2027-02", "2026-12")).toEqual([]);
  });

  it("clamps to a range", () => {
    const range = { min: "2026-12", max: "2027-03" };
    expect(clampMonth("2026-10", range)).toBe("2026-12");
    expect(clampMonth("2027-05", range)).toBe("2027-03");
    expect(clampMonth("2027-01", range)).toBe("2027-01");
  });
});

describe("Asia/Qatar clock", () => {
  it("is already the next day at 21:30 UTC", () => {
    const now = new Date("2026-11-30T21:30:00Z");
    expect(todayInQatar(now)).toBe("2026-12-01");
    expect(currentMonthKey(now)).toBe("2026-12");
  });

  it("is still the same day at 20:59 UTC", () => {
    expect(todayInQatar(new Date("2026-11-30T20:59:00Z"))).toBe("2026-11-30");
  });
});

describe("defaultEntryDate", () => {
  it("uses today when today is in the month", () => {
    expect(defaultEntryDate("2026-12", "2026-12-14")).toBe("2026-12-14");
  });

  it("uses the first day for a future month", () => {
    expect(defaultEntryDate("2026-12", "2026-11-21")).toBe("2026-12-01");
  });

  it("uses the last day for a past month", () => {
    expect(defaultEntryDate("2026-12", "2027-01-05")).toBe("2026-12-31");
  });
});

describe("labels", () => {
  it("formats month labels", () => {
    expect(formatMonthLabel("2026-12")).toBe("December 2026");
    expect(formatMonthLabel("2026-12", "short")).toBe("Dec 2026");
  });

  it("formats short dates", () => {
    expect(formatShortDate("2026-12-05")).toBe("5 Dec");
  });
});
