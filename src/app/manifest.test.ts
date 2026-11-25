import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("opens full-screen at the home page", () => {
    expect(m).toMatchObject({
      id: "/",
      name: "Expense Tracker",
      short_name: "Expenses",
      start_url: "/",
      scope: "/",
      display: "standalone",
    });
  });

  it("lists 192 and 512 px icons plus a maskable one for Android", () => {
    expect(m.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
    for (const icon of m.icons ?? []) expect(icon.type).toBe("image/png");
  });

  it("keeps a home-screen name short enough not to be cut off", () => {
    expect(m.short_name?.length).toBeLessThanOrEqual(12);
  });
});
