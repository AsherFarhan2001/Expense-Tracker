import { expect, test } from "@playwright/test";
import { addForItem } from "./helpers";

test("history lists the month with its total", async ({ page }) => {
  await page.goto("/");
  await addForItem(page, "Fruits", "12");

  await page.goto("/history");
  await expect(
    page.getByRole("heading", { level: 1, name: "History" }),
  ).toBeVisible();
  const december = page.getByRole("link", { name: /December 2026/ });
  await expect(december).toBeVisible();
  await december.click();
  await expect(page).toHaveURL(/\/months\/2026-12$/);
});

test("analysis compares items and shows category shares", async ({ page }) => {
  await page.goto("/");
  await addForItem(page, "Restaurant", "85");

  await page.goto("/analysis");
  await expect(
    page.getByRole("heading", { level: 1, name: "Analysis" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Item by item" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Where the money went" }),
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "Restaurant" }),
  ).toBeVisible();
});
