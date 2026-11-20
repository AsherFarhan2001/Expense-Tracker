import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { pinAttempts } from "@/db/schema";
import { LOCKOUT_MINUTES, MAX_FAILED_ATTEMPTS } from "./config";

const MINUTE = 60_000;

/** Minutes left on a lockout, or 0 when PIN entry is allowed. */
export async function lockoutMinutesLeft(
  db: Database,
  now = new Date(),
): Promise<number> {
  const [row] = await db
    .select()
    .from(pinAttempts)
    .where(eq(pinAttempts.id, 1));
  if (!row?.lockedUntil || row.lockedUntil <= now) return 0;
  return Math.ceil((row.lockedUntil.getTime() - now.getTime()) / MINUTE);
}

/** Records a wrong PIN. Returns attempts left before lockout (0 = now locked). */
export async function recordFailure(
  db: Database,
  now = new Date(),
): Promise<number> {
  const [row] = await db
    .select()
    .from(pinAttempts)
    .where(eq(pinAttempts.id, 1));
  const windowExpired =
    !row ||
    now.getTime() - row.windowStart.getTime() > LOCKOUT_MINUTES * MINUTE;
  const failedCount = windowExpired ? 1 : row.failedCount + 1;
  const lockedUntil =
    failedCount >= MAX_FAILED_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_MINUTES * MINUTE)
      : null;
  const values = {
    failedCount: lockedUntil ? 0 : failedCount,
    windowStart: windowExpired || lockedUntil ? now : row!.windowStart,
    lockedUntil,
  };
  await db
    .insert(pinAttempts)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: pinAttempts.id, set: values });
  return lockedUntil ? 0 : MAX_FAILED_ATTEMPTS - failedCount;
}

export async function resetAttempts(db: Database): Promise<void> {
  await db
    .update(pinAttempts)
    .set({ failedCount: 0, lockedUntil: null })
    .where(eq(pinAttempts.id, 1));
}
