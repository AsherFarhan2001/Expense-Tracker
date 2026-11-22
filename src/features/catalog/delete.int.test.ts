import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { expenses, items } from "@/db/schema";
import {
  insertExpense,
  softDeleteExpense,
} from "@/features/expenses/mutations";
import { prepareExpense } from "@/features/expenses/prepare";
import { getCatalog, getMonthTotals } from "@/features/expenses/queries";
import { createTestDb, type TestDb } from "@/test/db";
import { createCategory, createItem, deleteCategory } from "./mutations";
import { getCategoryUsage } from "./queries";

let testDb: TestDb;
beforeEach(async () => {
  testDb = await createTestDb();
});
afterEach(async () => {
  await testDb.close();
});

const idOf = (result: { ok: boolean; id?: string }) => {
  if (!result.ok || !result.id) throw new Error("expected ok");
  return result.id;
};

async function addCategoryWithItems(name: string, itemNames: string[]) {
  const categoryId = idOf(
    await createCategory(testDb.db, { name, color: "teal" }),
  );
  const itemIds: string[] = [];
  for (const itemName of itemNames) {
    itemIds.push(
      idOf(
        await createItem(testDb.db, {
          categoryId,
          name: itemName,
          isFixed: true,
          amountMode: "variable",
        }),
      ),
    );
  }
  return { categoryId, itemIds };
}

const spend = (
  itemId: string,
  amount: string,
  spentOn: string,
  currency: "QAR" | "PKR" = "QAR",
) =>
  insertExpense(
    testDb.db,
    prepareExpense({ itemId, amount, currency, spentOn }, "76.5", "manual"),
  );

async function countRows(table: typeof items | typeof expenses) {
  const [row] = await testDb.db
    .select({ n: sql<number>`count(*)::int` })
    .from(table);
  return row?.n ?? 0;
}

describe("getCategoryUsage", () => {
  it("counts each category's live expenses and totals them in both currencies", async () => {
    const pakistan = await addCategoryWithItems("Pakistan", [
      "Family",
      "Bills",
    ]);
    await spend(pakistan.itemIds[0]!, "10000", "2026-12-03", "PKR");
    await spend(pakistan.itemIds[1]!, "50", "2027-01-04");
    const removed = await spend(pakistan.itemIds[1]!, "99", "2027-01-05");
    await softDeleteExpense(testDb.db, removed.id);

    const usage = await getCategoryUsage(testDb.db);
    expect(usage[pakistan.categoryId]).toEqual({
      expenseCount: 2,
      qarMinor: 13072 + 5000,
      pkrMinor: 1000000 + 382500,
    });
    // Categories with nothing logged are simply absent.
    const [qatar] = await getCatalog(testDb.db);
    expect(usage[qatar!.id]).toBeUndefined();
  });
});

describe("deleteCategory", () => {
  it("removes the category with its items and every expense, leaving others alone", async () => {
    const [qatar] = await getCatalog(testDb.db);
    const lunch = qatar!.items.find((i) => i.name === "Lunch")!;
    await spend(lunch.id, "25", "2026-12-02");

    const itemsBefore = await countRows(items);
    const pakistan = await addCategoryWithItems("Pakistan", [
      "Family",
      "Bills",
    ]);
    await spend(pakistan.itemIds[0]!, "300", "2026-12-03");
    await spend(pakistan.itemIds[1]!, "40", "2027-01-08");
    const softDeleted = await spend(pakistan.itemIds[1]!, "5", "2027-01-09");
    await softDeleteExpense(testDb.db, softDeleted.id);

    expect(await deleteCategory(testDb.db, pakistan.categoryId)).toEqual({
      ok: true,
      id: pakistan.categoryId,
    });

    expect((await getCatalog(testDb.db)).map((c) => c.name)).toEqual(["Qatar"]);
    expect(await countRows(items)).toBe(itemsBefore);
    expect(await countRows(expenses)).toBe(1);
    expect((await getMonthTotals(testDb.db, "2026-12")).QAR).toBe(2500);
    expect((await getMonthTotals(testDb.db, "2027-01")).QAR).toBe(0);
  });

  it("deletes an archived or empty category and frees its name", async () => {
    const saudi = await addCategoryWithItems("Saudi Arabia", []);
    expect((await deleteCategory(testDb.db, saudi.categoryId)).ok).toBe(true);
    expect(
      (
        await createCategory(testDb.db, {
          name: "Saudi Arabia",
          color: "amber",
        })
      ).ok,
    ).toBe(true);
  });

  it("reports a category that no longer exists", async () => {
    const saudi = await addCategoryWithItems("Saudi Arabia", ["Hotel"]);
    await deleteCategory(testDb.db, saudi.categoryId);
    expect(await deleteCategory(testDb.db, saudi.categoryId)).toEqual({
      ok: false,
      error: "That category no longer exists.",
    });
  });
});
