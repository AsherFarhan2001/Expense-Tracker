import { expect, test } from "@playwright/test";

test("pages do not scroll horizontally", async ({ page }) => {
  for (const path of ["/", "/history", "/analysis", "/settings"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `${path} overflows horizontally`).toBe(false);
  }
});

test("unknown months show the not-found page", async ({ page }) => {
  await page.goto("/months/not-a-month");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
