import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { items } from "@/db/schema";
import { createTestDb, type TestDb } from "@/test/db";
import { buildLedger } from "./ledger";
import {
  insertExpense,
  isActiveItem,
  restoreExpense,
  softDeleteExpense,
  updateExpense,
} from "./mutations";
import { prepareExpense } from "./prepare";
import { getMonthData } from "./queries";

let testDb: TestDb;
let itemIds: Record<string, string>;

beforeEach(async () => {
  testDb = await createTestDb();
  const rows = await testDb.db
    .select({ id: items.id, name: items.name })
    .from(items);
  itemIds = Object.fromEntries(rows.map((r) => [r.name, r.id]));
});
afterEach(async () => {
  await testDb.close();
});

const add = (
  item: string,
  amount: string,
  spentOn: string,
  currency: "QAR" | "PKR" = "QAR",
) =>
  insertExpense(
    testDb.db,
    prepareExpense(
      { itemId: itemIds[item]!, amount, currency, spentOn },
      "76.5",
      "manual",
    ),
  );

describe("month data", () => {
  it("returns only the month's live entries with totals that update on add/delete/restore", async () => {
    await add("Uber", "25", "2026-12-03");
    const lunch = await add("Lunch", "18.50", "2026-12-04");
    await add("Uber", "30", "2027-01-02"); // other month
    await add("Uber", "20", "2026-11-30"); // previous month

    let data = await getMonthData(testDb.db, "2026-12");
    expect(data.entries).toHaveLength(2);
    expect(
      buildLedger(data.catalog, data.entries, data.suggestions, "QAR").total,
    ).toBe(4350);
    expect(data.previousTotals.QAR).toBe(2000);

    expect(await softDeleteExpense(testDb.db, lunch.id)).toBe(true);
    data = await getMonthData(testDb.db, "2026-12");
    expect(
      buildLedger(data.catalog, data.entries, data.suggestions, "QAR").total,
    ).toBe(2500);

    expect(await restoreExpense(testDb.db, lunch.id)).toBe(true);
    data = await getMonthData(testDb.db, "2026-12");
    expect(data.entries.find((e) => e.id === lunch.id)?.amountMinor).toBe(1850);
  });

  it("includes PKR expenses in the QAR total via the locked rate", async () => {
    await add("Grocery", "10,000", "2026-12-10", "PKR");
    const data = await getMonthData(testDb.db, "2026-12");
    const ledger = buildLedger(
      data.catalog,
      data.entries,
      data.suggestions,
      "QAR",
    );
    expect(ledger.total).toBe(13072);
    expect(
      buildLedger(data.catalog, data.entries, data.suggestions, "PKR").total,
    ).toBe(1_000_000);
  });

  it("suggests last month's amount for recurring items until confirmed", async () => {
    await add("Accommodation", "1500", "2026-12-01");
    let data = await getMonthData(testDb.db, "2027-01");
    expect(data.suggestions).toEqual([
      expect.objectContaining({
        itemId: itemIds.Accommodation,
        amountMinor: 150000,
        currency: "QAR",
      }),
    ]);

    await add("Accommodation", "1500", "2027-01-01");
    data = await getMonthData(testDb.db, "2027-01");
    const ledger = buildLedger(
      data.catalog,
      data.entries,
      data.suggestions,
      "QAR",
    );
    const accommodation = ledger.categories[0]?.items.find(
      (i) => i.name === "Accommodation",
    );
    expect(accommodation?.suggestion).toBeNull();
    expect(accommodation?.total).toBe(150000);
  });

  it("updates an expense in place and re-converts", async () => {
    const entry = await add("Tea", "2", "2026-12-02");
    const updated = await updateExpense(
      testDb.db,
      entry.id,
      prepareExpense(
        {
          itemId: itemIds.Tea!,
          amount: "153",
          currency: "PKR",
          spentOn: "2026-12-02",
        },
        "76.5",
        "manual",
      ),
    );
    expect(updated).toMatchObject({
      amountMinor: 15300,
      currency: "PKR",
      amountQarMinor: 200,
    });
  });

  it("hides archived items from future months but keeps their history", async () => {
    await add("Haircut", "40", "2026-12-12");
    await testDb.db
      .update(items)
      .set({ archivedAt: new Date() })
      .where(eq(items.name, "Haircut"));

    expect(await isActiveItem(testDb.db, itemIds.Haircut!)).toBe(false);

    const december = await getMonthData(testDb.db, "2026-12");
    const decLedger = buildLedger(
      december.catalog,
      december.entries,
      december.suggestions,
      "QAR",
    );
    expect(
      decLedger.categories[0]?.items.some((i) => i.name === "Haircut"),
    ).toBe(true);

    const january = await getMonthData(testDb.db, "2027-01");
    const janLedger = buildLedger(
      january.catalog,
      january.entries,
      january.suggestions,
      "QAR",
    );
    expect(
      janLedger.categories[0]?.items.some((i) => i.name === "Haircut"),
    ).toBe(false);
  });
});
