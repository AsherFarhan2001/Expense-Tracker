import { describe, expect, it } from "vitest";
import { groupByMonth, summarizeMatches } from "./summary";
import type { ItemMatch, SearchRow } from "./types";

const row = (id: string, spentOn: string, qar: number): SearchRow => ({
  id,
  itemId: "hotel",
  spentOn,
  amountMinor: qar,
  currency: "QAR",
  pkrPerQar: "76.500000",
  amountQarMinor: qar,
  amountPkrMinor: qar * 76.5,
  note: null,
  createdAt: "2026-12-01T00:00:00.000Z",
  itemName: "Hotel",
  categoryId: "umrah",
  categoryName: "Umrah",
  categoryColor: "teal",
});

const item = (
  itemId: string,
  count: number,
  qarMinor: number,
  firstDate: string,
  lastDate: string,
): ItemMatch => ({
  itemId,
  itemName: itemId,
  categoryId: "umrah",
  categoryName: "Umrah",
  categoryColor: "teal",
  count,
  qarMinor,
  pkrMinor: qarMinor * 76.5,
  firstDate,
  lastDate,
});

describe("groupByMonth", () => {
  it("keeps the newest-first order and totals each month", () => {
    const groups = groupByMonth(
      [
        row("a", "2027-01-07", 40000),
        row("b", "2027-01-05", 120000),
        row("c", "2026-12-20", 80000),
      ],
      "QAR",
    );
    expect(
      groups.map((g) => [g.month, g.total, g.rows.map((r) => r.id)]),
    ).toEqual([
      ["2027-01", 160000, ["a", "b"]],
      ["2026-12", 80000, ["c"]],
    ]);
  });

  it("totals in the chosen currency", () => {
    expect(groupByMonth([row("a", "2027-01-07", 200)], "PKR")[0]?.total).toBe(
      15300,
    );
  });
});

describe("summarizeMatches", () => {
  it("adds up every item and finds the date span", () => {
    expect(
      summarizeMatches(
        [
          item("Flights", 1, 120000, "2027-01-05", "2027-01-05"),
          item("Hotel", 2, 120000, "2026-12-20", "2027-01-07"),
        ],
        "QAR",
      ),
    ).toEqual({
      count: 3,
      total: 240000,
      firstDate: "2026-12-20",
      lastDate: "2027-01-07",
    });
  });

  it("is empty when nothing matched", () => {
    expect(summarizeMatches([], "PKR")).toEqual({
      count: 0,
      total: 0,
      firstDate: null,
      lastDate: null,
    });
  });
});
