// Node-only crypto for the PIN lock (used by Server Actions and the Node.js proxy).
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { SESSION_DAYS } from "./config";

const KEY_LENGTH = 32;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "scrypt:<salt hex>:<hash hex>". No "$" on purpose: Next.js and shells expand
 * $VARS in env values, which would silently corrupt the hash.
 */
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = scryptSync(pin, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** "<expiresAtMs>.<signature>" valid for SESSION_DAYS. */
export function createSessionToken(secret: string, now = Date.now()): string {
  const expiresAt = now + SESSION_DAYS * DAY_MS;
  return `${expiresAt}.${sign(`v1.${expiresAt}`, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token) return false;
  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!signature || !Number.isSafeInteger(expiresAt) || expiresAt <= now) {
    return false;
  }
  const expected = Buffer.from(sign(`v1.${expiresAt}`, secret));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
