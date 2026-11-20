import "server-only";
import { cookies } from "next/headers";
import { getSessionSecret, isPinEnabled, SESSION_COOKIE } from "./config";
import { verifySessionToken } from "./crypto";

export async function hasUnlockedSession(): Promise<boolean> {
  if (!isPinEnabled()) return true;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, getSessionSecret());
}

/**
 * Every Server Action calls this first: actions are reachable by direct POST,
 * so the proxy redirect alone is not enough. No-op when the lock is off.
 */
export async function requireUnlocked(): Promise<void> {
  if (!(await hasUnlockedSession())) {
    throw new Error("This device is locked. Enter your PIN to continue.");
  }
}
