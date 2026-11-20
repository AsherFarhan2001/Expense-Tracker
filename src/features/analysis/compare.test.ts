import { describe, expect, it } from "vitest";
import type { CatalogCategory } from "@/features/expenses/types";
import { biggestChanges, categoryShares, compareItems } from "./compare";

const item = (id: string, categoryId: string) => ({
  id,
  categoryId,
  name: id[0]!.toUpperCase() + id.slice(1),
  isFixed: true,
  amountMode: "variable" as const,
  archived: false,
});

const catalog: CatalogCategory[] = [
  {
    id: "qa",
    name: "Qatar",
    color: "maroon",
    archived: false,
    items: [item("grocery", "qa"), item("uber", "qa"), item("haircut", "qa")],
  },
  {
    id: "pk",
    name: "Pakistan",
    color: "teal",
    archived: false,
    items: [item("family", "pk")],
  },
];

const t = (QAR: number) => ({ QAR, PKR: QAR * 76 });

const current = { grocery: t(60000), uber: t(15000), family: t(25000) };
const previous = { grocery: t(50000), uber: t(20000), haircut: t(4000) };

describe("compareItems", () => {
  it("lists items with spending in either month, biggest first, with change", () => {
    const rows = compareItems(catalog, current, previous, "QAR");
    expect(rows.map((r) => [r.name, r.current, r.previous, r.delta])).toEqual([
      ["Grocery", 60000, 50000, 10000],
      ["Family", 25000, 0, 25000],
      ["Uber", 15000, 20000, -5000],
      ["Haircut", 0, 4000, -4000],
    ]);
    expect(rows[0]?.deltaRatio).toBeCloseTo(0.2);
    expect(rows[1]?.deltaRatio).toBeNull();
    expect(rows[1]).toMatchObject({ categoryName: "Pakistan", color: "teal" });
  });

  it("uses the requested currency", () => {
    const rows = compareItems(catalog, current, previous, "PKR");
    expect(rows[0]?.current).toBe(60000 * 76);
  });
});

describe("categoryShares", () => {
  it("returns non-zero categories with shares adding up to 1", () => {
    const shares = categoryShares(catalog, current, "QAR");
    expect(shares.map((s) => [s.name, s.total])).toEqual([
      ["Qatar", 75000],
      ["Pakistan", 25000],
    ]);
    expect(shares.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1);
  });
});

describe("biggestChanges", () => {
  it("splits increases and decreases, largest first", () => {
    const { increases, decreases } = biggestChanges(
      compareItems(catalog, current, previous, "QAR"),
    );
    expect(increases.map((r) => r.name)).toEqual(["Family", "Grocery"]);
    expect(decreases.map((r) => r.name)).toEqual(["Uber", "Haircut"]);
  });
});
