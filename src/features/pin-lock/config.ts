type Env = Record<string, string | undefined>;

export const SESSION_COOKIE = "et_session";
export const SESSION_DAYS = 30;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

/** The lock is on only when a PIN hash is configured (the live site). */
export function isPinEnabled(env: Env = process.env): boolean {
  return Boolean(env.APP_PIN_HASH?.trim());
}

export function getPinHash(env: Env = process.env): string {
  const hash = env.APP_PIN_HASH?.trim();
  if (!hash) throw new Error("APP_PIN_HASH is not set");
  return hash;
}

export function getSessionSecret(env: Env = process.env): string {
  const secret = env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set (32+ characters) when APP_PIN_HASH is set",
    );
  }
  return secret;
}

/** Only allow same-site relative paths as post-unlock redirects. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }
  return value.startsWith("/unlock") ? "/" : value;
}
