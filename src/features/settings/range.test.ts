import { describe, expect, it } from "vitest";
import { describeRange, isSpendDateAllowed, navigableRange } from "./range";

describe("navigableRange", () => {
  it("opens only the start month while it is still ahead", () => {
    expect(navigableRange("2026-12", "2026-11-21")).toEqual({
      min: "2026-12",
      max: "2026-12",
    });
  });

  it("extends to the current month once it has passed the start", () => {
    expect(navigableRange("2026-12", "2027-03-02")).toEqual({
      min: "2026-12",
      max: "2027-03",
    });
  });
});

describe("isSpendDateAllowed", () => {
  const range = { min: "2026-12", max: "2027-01" };
  it.each([
    ["2026-11-30", false],
    ["2026-12-01", true],
    ["2027-01-31", true],
    ["2027-02-01", false],
  ])("%s → %s", (date, allowed) => {
    expect(isSpendDateAllowed(date, range)).toBe(allowed);
  });
});

describe("describeRange", () => {
  it("names a single month or a span", () => {
    expect(describeRange({ min: "2026-12", max: "2026-12" })).toBe(
      "December 2026",
    );
    expect(describeRange({ min: "2026-12", max: "2027-02" })).toBe(
      "December 2026 – February 2027",
    );
  });
});
