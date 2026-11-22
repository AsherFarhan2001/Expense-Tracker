import { describe, expect, it } from "vitest";
import { buildLedger, dailyTotals, percentChange } from "./ledger";
import type { CatalogCategory, EntryView, Suggestion } from "./types";

const item = (
  id: string,
  overrides: Partial<CatalogCategory["items"][number]> = {},
) => ({
  id,
  categoryId: "qatar",
  name: id,
  isFixed: true,
  amountMode: "variable" as const,
  archived: false,
  ...overrides,
});

const entry = (
  id: string,
  itemId: string,
  qar: number,
  pkr = qar * 76,
): EntryView => ({
  id,
  itemId,
  spentOn: "2026-12-05",
  amountMinor: qar,
  currency: "QAR",
  pkrPerQar: "76.000000",
  amountQarMinor: qar,
  amountPkrMinor: pkr,
  note: null,
  createdAt: "2026-12-05T10:00:00.000Z",
});

const catalog: CatalogCategory[] = [
  {
    id: "qatar",
    name: "Qatar",
    color: "maroon",
    archived: false,
    items: [
      item("rent", { amountMode: "recurring" }),
      item("uber"),
      item("gift", { isFixed: false }),
      item("old", { archived: true }),
    ],
  },
  {
    id: "pakistan",
    name: "Pakistan",
    color: "teal",
    archived: false,
    items: [item("family", { categoryId: "pakistan", isFixed: false })],
  },
  {
    id: "saudi",
    name: "Saudi",
    color: "amber",
    archived: true,
    items: [item("umrah", { categoryId: "saudi", isFixed: false })],
  },
];

describe("buildLedger", () => {
  it("totals entries per item, category and month", () => {
    const ledger = buildLedger(
      catalog,
      [
        entry("1", "uber", 2500),
        entry("2", "uber", 1500),
        entry("3", "family", 6000),
      ],
      [],
      "QAR",
    );
    expect(ledger.total).toBe(10000);
    expect(ledger.entryCount).toBe(3);
    const [qatar, pakistan] = ledger.categories;
    expect(qatar?.total).toBe(4000);
    expect(qatar?.share).toBeCloseTo(0.4);
    expect(qatar?.items.find((i) => i.id === "uber")?.total).toBe(4000);
    expect(pakistan?.total).toBe(6000);
  });

  it("totals in PKR using the stored converted amounts", () => {
    const ledger = buildLedger(
      catalog,
      [entry("1", "uber", 2500, 190000)],
      [],
      "PKR",
    );
    expect(ledger.total).toBe(190000);
  });

  it("shows fixed items, hides non-fixed and archived items without entries", () => {
    const ledger = buildLedger(catalog, [], [], "QAR");
    const qatarItems = ledger.categories[0]?.items.map((i) => i.id);
    expect(qatarItems).toEqual(["rent", "uber"]);
    // Pakistan is active but has no fixed items: shown empty.
    expect(ledger.categories.map((c) => c.id)).toEqual(["qatar", "pakistan"]);
    expect(ledger.categories[1]?.items).toEqual([]);
  });

  it("keeps archived items and categories that have entries this month", () => {
    const ledger = buildLedger(
      catalog,
      [entry("1", "old", 100), entry("2", "umrah", 900)],
      [],
      "QAR",
    );
    expect(ledger.categories.map((c) => c.id)).toEqual([
      "qatar",
      "pakistan",
      "saudi",
    ]);
    expect(ledger.categories[0]?.items.map((i) => i.id)).toContain("old");
  });

  it("offers a suggestion only for recurring items with no entries", () => {
    const suggestion: Suggestion = {
      itemId: "rent",
      amountMinor: 150000,
      currency: "QAR",
      fromDate: "2026-11-01",
    };
    const pending = buildLedger(catalog, [], [suggestion], "QAR");
    expect(pending.categories[0]?.items[0]?.suggestion).toEqual(suggestion);
    expect(pending.total).toBe(0);

    const confirmed = buildLedger(
      catalog,
      [entry("1", "rent", 150000)],
      [suggestion],
      "QAR",
    );
    expect(confirmed.categories[0]?.items[0]?.suggestion).toBeNull();
  });
});

describe("percentChange", () => {
  it("computes relative change", () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(80, 100)).toBeCloseTo(-0.2);
  });

  it("returns null without a baseline", () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe("dailyTotals", () => {
  it("adds up each day's expenses in the chosen currency", () => {
    const entries = [
      { ...entry("a", "tea", 300), spentOn: "2026-12-05" },
      { ...entry("b", "lunch", 2500), spentOn: "2026-12-05" },
      { ...entry("c", "uber", 1800), spentOn: "2026-12-07" },
    ];
    expect(Object.fromEntries(dailyTotals(entries, "QAR"))).toEqual({
      "2026-12-05": 2800,
      "2026-12-07": 1800,
    });
    expect(dailyTotals(entries, "PKR").get("2026-12-07")).toBe(1800 * 76);
  });
});
