import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { lockoutMinutesLeft, recordFailure, resetAttempts } from "./attempts";

let testDb: TestDb;
beforeEach(async () => {
  testDb = await createTestDb();
});
afterEach(async () => {
  await testDb.close();
});

const at = (minutes: number) => new Date(Date.UTC(2026, 11, 1, 10, minutes));

describe("PIN attempt limiting", () => {
  it("locks for 15 minutes after 5 wrong PINs", async () => {
    const left = [];
    for (let i = 0; i < 5; i += 1)
      left.push(await recordFailure(testDb.db, at(i)));
    expect(left).toEqual([4, 3, 2, 1, 0]);
    expect(await lockoutMinutesLeft(testDb.db, at(5))).toBe(14);
    expect(await lockoutMinutesLeft(testDb.db, at(20))).toBe(0);
  });

  it("starts a new window after 15 quiet minutes", async () => {
    await recordFailure(testDb.db, at(0));
    await recordFailure(testDb.db, at(1));
    expect(await recordFailure(testDb.db, at(30))).toBe(4);
  });

  it("clears the count after a successful unlock", async () => {
    await recordFailure(testDb.db, at(0));
    await recordFailure(testDb.db, at(1));
    await resetAttempts(testDb.db);
    expect(await recordFailure(testDb.db, at(2))).toBe(4);
  });
});
