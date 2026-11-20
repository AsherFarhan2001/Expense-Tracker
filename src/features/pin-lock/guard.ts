import "server-only";

/**
 * Every Server Action calls this first. With no APP_PIN_HASH configured
 * (local development) the app is unlocked. The PIN session check is added in
 * Phase 6.
 */
export async function requireUnlocked(): Promise<void> {
  if (!process.env.APP_PIN_HASH) return;
  throw new Error("PIN lock is configured but not implemented yet");
}
