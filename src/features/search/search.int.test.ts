import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCategory, createItem } from "@/features/catalog/mutations";
import {
  insertExpense,
  softDeleteExpense,
} from "@/features/expenses/mutations";
import { prepareExpense } from "@/features/expenses/prepare";
import { getCatalog } from "@/features/expenses/queries";
import { createTestDb, type TestDb } from "@/test/db";
import { searchExpenses } from "./queries";

let testDb: TestDb;
let umrah: { id: string; hotel: string; flights: string };
let qatarItems: Record<string, string>;

const idOf = (result: { ok: boolean; id?: string }) => {
  if (!result.ok || !result.id) throw new Error("expected ok");
  return result.id;
};

const spend = (
  itemId: string,
  amount: string,
  spentOn: string,
  note?: string,
  currency: "QAR" | "PKR" = "QAR",
) =>
  insertExpense(
    testDb.db,
    prepareExpense(
      { itemId, amount, currency, spentOn, note },
      "76.5",
      "manual",
    ),
  );

beforeEach(async () => {
  testDb = await createTestDb();
  const id = idOf(
    await createCategory(testDb.db, { name: "Umrah", color: "teal" }),
  );
  const item = async (name: string) =>
    idOf(
      await createItem(testDb.db, {
        categoryId: id,
        name,
        isFixed: true,
        amountMode: "variable",
      }),
    );
  umrah = { id, hotel: await item("Hotel"), flights: await item("Flights") };
  const [qatar] = await getCatalog(testDb.db);
  qatarItems = Object.fromEntries(qatar!.items.map((i) => [i.name, i.id]));
});
afterEach(async () => {
  await testDb.close();
});

describe("searchExpenses", () => {
  it("lists every expense of a category across months, newest first, with exact totals", async () => {
    await spend(umrah.hotel, "800", "2026-12-20", "Makkah");
    await spend(umrah.flights, "1200", "2027-01-05");
    await spend(umrah.hotel, "400", "2027-01-07", "Madinah");
    await spend(qatarItems["Lunch"]!, "25", "2027-01-07");
    const gone = await spend(umrah.hotel, "999", "2027-01-08");
    await softDeleteExpense(testDb.db, gone.id);

    const results = await searchExpenses(testDb.db, {
      categoryId: umrah.id,
      terms: [],
    });

    expect(results.rows.map((r) => [r.spentOn, r.itemName])).toEqual([
      ["2027-01-07", "Hotel"],
      ["2027-01-05", "Flights"],
      ["2026-12-20", "Hotel"],
    ]);
    expect(results.rows[0]).toMatchObject({
      categoryName: "Umrah",
      categoryColor: "teal",
      note: "Madinah",
      amountQarMinor: 40000,
    });
    expect(results.truncated).toBe(false);
    expect(results.items).toEqual([
      expect.objectContaining({
        itemName: "Flights",
        count: 1,
        qarMinor: 120000,
        firstDate: "2027-01-05",
        lastDate: "2027-01-05",
      }),
      expect.objectContaining({
        itemName: "Hotel",
        count: 2,
        qarMinor: 120000,
        pkrMinor: 9180000,
        firstDate: "2026-12-20",
        lastDate: "2027-01-07",
      }),
    ]);
  });

  it("matches words against category, item and note, case-insensitively", async () => {
    await spend(umrah.hotel, "800", "2026-12-20", "Makkah");
    await spend(
      qatarItems["Uber"]!,
      "30",
      "2026-12-21",
      "to the airport for umrah",
    );
    await spend(qatarItems["Tea"]!, "3", "2026-12-22");

    const byCategoryName = await searchExpenses(testDb.db, {
      terms: ["UMRAH"],
    });
    expect(byCategoryName.rows.map((r) => r.itemName).sort()).toEqual([
      "Hotel",
      "Uber",
    ]);

    const byItem = await searchExpenses(testDb.db, { terms: ["tea"] });
    expect(byItem.rows.map((r) => r.itemName)).toEqual(["Tea"]);

    const byNote = await searchExpenses(testDb.db, { terms: ["makk"] });
    expect(byNote.rows.map((r) => r.note)).toEqual(["Makkah"]);
  });

  it("requires every word to match and can combine words with a category", async () => {
    await spend(umrah.hotel, "800", "2026-12-20", "Makkah");
    await spend(umrah.flights, "1200", "2027-01-05", "Makkah return");
    await spend(qatarItems["Uber"]!, "30", "2026-12-21", "Makkah transfer");

    const both = await searchExpenses(testDb.db, {
      terms: ["umrah", "hotel"],
    });
    expect(both.rows.map((r) => r.itemName)).toEqual(["Hotel"]);

    const inCategory = await searchExpenses(testDb.db, {
      categoryId: umrah.id,
      terms: ["makkah"],
    });
    expect(inCategory.rows.map((r) => r.itemName)).toEqual([
      "Flights",
      "Hotel",
    ]);
  });

  it("treats % and _ in a search as plain characters", async () => {
    await spend(qatarItems["Shopping"]!, "50", "2026-12-20", "50% off");
    await spend(qatarItems["Shopping"]!, "60", "2026-12-21", "500 off");

    const results = await searchExpenses(testDb.db, { terms: ["50%"] });
    expect(results.rows.map((r) => r.note)).toEqual(["50% off"]);
  });

  it("caps the rows but keeps totals for every match", async () => {
    for (let day = 1; day <= 4; day++) {
      await spend(umrah.hotel, "100", `2026-12-0${day}`);
    }
    const results = await searchExpenses(
      testDb.db,
      { categoryId: umrah.id, terms: [] },
      { limit: 3 },
    );
    expect(results.rows).toHaveLength(3);
    expect(results.truncated).toBe(true);
    expect(results.items[0]).toMatchObject({ count: 4, qarMinor: 40000 });
  });
});
