import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { categories, expenses, items, settings } from "./schema";
import { seedDatabase } from "./seed";
import { SEED_ITEMS } from "./seed-data";

let testDb: TestDb | undefined;
afterEach(async () => {
  await testDb?.close();
  testDb = undefined;
});

async function counts(db: TestDb["db"]) {
  const count = async (
    table: typeof categories | typeof items | typeof settings,
  ) => {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(table);
    return row?.n ?? 0;
  };
  return {
    categories: await count(categories),
    items: await count(items),
    settings: await count(settings),
  };
}

describe("seedDatabase", () => {
  it("creates settings, the Qatar category and 18 fixed items", async () => {
    testDb = await createTestDb();
    expect(await counts(testDb.db)).toEqual({
      categories: 1,
      items: SEED_ITEMS.length,
      settings: 1,
    });
    expect(SEED_ITEMS).toHaveLength(18);

    const recurring = await testDb.db
      .select({ name: items.name })
      .from(items)
      .where(sql`${items.amountMode} = 'recurring'`);
    expect(recurring.map((r) => r.name).sort()).toEqual([
      "Accommodation",
      "Mobile Package",
    ]);

    const [row] = await testDb.db.select().from(settings);
    expect(row).toMatchObject({
      startMonth: "2026-12",
      defaultCurrency: "QAR",
      displayCurrency: "QAR",
    });
  });

  it("is idempotent", async () => {
    testDb = await createTestDb();
    await seedDatabase(testDb.db);
    await seedDatabase(testDb.db);
    expect(await counts(testDb.db)).toEqual({
      categories: 1,
      items: SEED_ITEMS.length,
      settings: 1,
    });
  });

  it("enforces positive amounts at the database level", async () => {
    testDb = await createTestDb();
    const [item] = await testDb.db
      .select({ id: items.id })
      .from(items)
      .limit(1);
    await expect(
      testDb.db.insert(expenses).values({
        itemId: item!.id,
        spentOn: "2026-12-01",
        amountMinor: 0,
        currency: "QAR",
        pkrPerQar: "76.500000",
        rateSource: "manual",
        amountQarMinor: 0,
        amountPkrMinor: 0,
      }),
    ).rejects.toThrow();
  });
});
