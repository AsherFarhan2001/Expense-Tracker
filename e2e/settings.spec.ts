import { expect, test } from "@playwright/test";

test("a new category with its own item shows up on the month", async ({
  page,
}, testInfo) => {
  const category = `Pakistan ${testInfo.project.name}`;
  await page.goto("/settings");

  await page.getByPlaceholder("e.g. Pakistan").fill(category);
  await page.getByRole("button", { name: "Add category" }).click();
  const panel = page.getByRole("region", { name: category });
  await expect(panel).toBeVisible();

  await panel.getByLabel(`New item in ${category}`).fill("Family support");
  await panel.getByRole("button", { name: "Add item" }).click();
  await expect(panel.getByText("Family support")).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 2, name: category }),
  ).toBeVisible();
  await expect(page.getByTestId("item-Family support").first()).toBeVisible();
});

test("archiving an item hides it from the month", async ({ page }) => {
  await page.goto("/settings");
  const qatar = page.getByRole("region", { name: "Qatar" });
  const haircut = qatar.getByRole("listitem").filter({ hasText: "Haircut" });
  await haircut.getByRole("button", { name: "Haircut options" }).click();
  await page.getByRole("menuitem", { name: "Archive item" }).click();
  await expect(
    qatar.getByRole("button", { name: /Show archived items/ }),
  ).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("item-Haircut")).toHaveCount(0);

  // Restore for the other project's run.
  await page.goto("/settings");
  await qatar.getByRole("button", { name: /Show archived items/ }).click();
  await qatar
    .getByRole("listitem")
    .filter({ hasText: "Haircut" })
    .getByRole("button", { name: "Restore" })
    .click();
  await expect(
    qatar.getByRole("button", { name: "Haircut options" }),
  ).toBeVisible();
});
