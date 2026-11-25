import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPin } from "@/features/pin-lock/crypto";
import { proxy } from "./proxy";

const ORIGIN = "https://expenses.test";

function visit(path: string) {
  return proxy(new NextRequest(`${ORIGIN}${path}`));
}

describe("proxy on a locked device (PIN on, no session cookie)", () => {
  beforeEach(() => {
    vi.stubEnv("APP_PIN_HASH", hashPin("123456"));
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    "/manifest.webmanifest",
    "/icon/192",
    "/icon/512",
    "/apple-icon",
    "/maskable-icon.png",
    "/unlock",
  ])("lets %s through so the app can be installed", (path) => {
    expect(visit(path).headers.get("location")).toBeNull();
  });

  it.each(["/", "/months/2026-12", "/search", "/iconic", "/icons/192"])(
    "sends %s to the PIN screen",
    (path) => {
      const location = visit(path).headers.get("location");
      expect(location).not.toBeNull();
      expect(new URL(location!).pathname).toBe("/unlock");
    },
  );
});
