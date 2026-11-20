import { describe, expect, it } from "vitest";
import { safeNextPath } from "./config";
import {
  createSessionToken,
  hashPin,
  verifyPin,
  verifySessionToken,
} from "./crypto";

const SECRET = "x".repeat(40);

describe("PIN hashing", () => {
  it("verifies the right PIN and rejects others", () => {
    const stored = hashPin("482916");
    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(verifyPin("482916", stored)).toBe(true);
    expect(verifyPin("482917", stored)).toBe(false);
  });

  it("salts every hash", () => {
    expect(hashPin("1234")).not.toBe(hashPin("1234"));
  });

  it("rejects malformed hashes", () => {
    expect(verifyPin("1234", "plain-text")).toBe(false);
    expect(verifyPin("1234", "scrypt$00$11")).toBe(false);
  });
});

describe("session tokens", () => {
  const now = Date.UTC(2026, 11, 1);

  it("are valid for 30 days", () => {
    const token = createSessionToken(SECRET, now);
    expect(verifySessionToken(token, SECRET, now + 29 * 86_400_000)).toBe(true);
    expect(verifySessionToken(token, SECRET, now + 31 * 86_400_000)).toBe(
      false,
    );
  });

  it("reject tampering and other secrets", () => {
    const token = createSessionToken(SECRET, now);
    const [expires, signature] = token.split(".");
    expect(
      verifySessionToken(`${Number(expires) + 1}.${signature}`, SECRET, now),
    ).toBe(false);
    expect(verifySessionToken(token, "y".repeat(40), now)).toBe(false);
    expect(verifySessionToken(undefined, SECRET, now)).toBe(false);
    expect(verifySessionToken("garbage", SECRET, now)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/months/2026-12", "/months/2026-12"],
    ["/settings?tab=1", "/settings?tab=1"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["/unlock", "/"],
    [undefined, "/"],
  ])("%j → %j", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
