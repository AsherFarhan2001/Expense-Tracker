import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { items } from "@/db/schema";
import {
  insertExpense,
  softDeleteExpense,
} from "@/features/expenses/mutations";
import { prepareExpense } from "@/features/expenses/prepare";
import { createTestDb, type TestDb } from "@/test/db";
import { getItemTotals, getMonthlyTotals } from "./queries";

let testDb: TestDb;
let ids: Record<string, string>;

beforeEach(async () => {
  testDb = await createTestDb();
  const rows = await testDb.db
    .select({ id: items.id, name: items.name })
    .from(items);
  ids = Object.fromEntries(rows.map((r) => [r.name, r.id]));
});
afterEach(async () => {
  await testDb.close();
});

const add = (item: string, amount: string, spentOn: string) =>
  insertExpense(
    testDb.db,
    prepareExpense(
      { itemId: ids[item]!, amount, currency: "QAR", spentOn },
      "76.5",
      "manual",
    ),
  );

describe("analysis queries", () => {
  it("returns a row per month including empty months", async () => {
    await add("Grocery", "100", "2026-12-02");
    await add("Uber", "20", "2026-12-31");
    await add("Grocery", "80", "2027-02-10");
    const deleted = await add("Grocery", "999", "2027-02-11");
    await softDeleteExpense(testDb.db, deleted.id);

    const totals = await getMonthlyTotals(testDb.db, "2026-12", "2027-02");
    expect(totals).toEqual([
      { month: "2026-12", totals: { QAR: 12000, PKR: 918000 }, entryCount: 2 },
      { month: "2027-01", totals: { QAR: 0, PKR: 0 }, entryCount: 0 },
      { month: "2027-02", totals: { QAR: 8000, PKR: 612000 }, entryCount: 1 },
    ]);
  });

  it("sums per item for a month", async () => {
    await add("Grocery", "100", "2026-12-02");
    await add("Grocery", "50.50", "2026-12-20");
    await add("Uber", "20", "2027-01-01");

    const totals = await getItemTotals(testDb.db, "2026-12");
    expect(totals).toEqual({ [ids.Grocery!]: { QAR: 15050, PKR: 1151325 } });
  });
});
