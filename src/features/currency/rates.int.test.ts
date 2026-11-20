import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { fixedProvider, getRateForDay, type RateProvider } from "./rates";

let testDb: TestDb | undefined;
afterEach(async () => {
  await testDb?.close();
  testDb = undefined;
});

describe("getRateForDay", () => {
  it("fetches once and caches the rate for the day", async () => {
    testDb = await createTestDb();
    const provider = vi.fn<RateProvider>(fixedProvider("75.947268"));

    const first = await getRateForDay(testDb.db, "2026-12-01", provider);
    const second = await getRateForDay(testDb.db, "2026-12-01", provider);

    expect(first).toEqual({
      pkrPerQar: "75.947268",
      source: "fixed",
      rateDate: "2026-12-01",
      stale: false,
    });
    expect(second?.pkrPerQar).toBe("75.947268");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("falls back to the latest cached rate when the provider fails", async () => {
    testDb = await createTestDb();
    await getRateForDay(testDb.db, "2026-12-01", fixedProvider("76.1"));

    const failing: RateProvider = async () => null;
    const rate = await getRateForDay(testDb.db, "2026-12-05", failing);

    expect(rate).toEqual({
      pkrPerQar: "76.100000",
      source: "fixed",
      rateDate: "2026-12-01",
      stale: true,
    });
  });

  it("returns null when no rate has ever been available", async () => {
    testDb = await createTestDb();
    const rate = await getRateForDay(testDb.db, "2026-12-05", async () => null);
    expect(rate).toBeNull();
  });
});
