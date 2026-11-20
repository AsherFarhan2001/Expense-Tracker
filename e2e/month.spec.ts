import { expect, test } from "@playwright/test";
import { addForItem, dialog, expectTotal, readTotal } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "December",
  );
});

test("shows the fixed monthly items", async ({ page }) => {
  for (const item of [
    "Mobile Package",
    "Accommodation",
    "Grocery",
    "Uber",
    "Haircut",
  ]) {
    await expect(page.getByTestId(`item-${item}`)).toBeVisible();
  }
});

test("adding an expense updates the total and survives a reload", async ({
  page,
}) => {
  const before = await readTotal(page);
  await addForItem(page, "Tea", "2.50", { note: "Karak" });
  await expectTotal(page, before + 250);

  await page.reload();
  await expectTotal(page, before + 250);
  await expect(page.getByTestId("item-Tea")).toContainText("2.50");
});

test("deleting an expense can be undone", async ({ page }) => {
  await addForItem(page, "Uber", "31.75");
  const withExpense = await readTotal(page);

  await page
    .getByTestId("item-Uber")
    .getByRole("button", { name: /^Uber/ })
    .click();
  await page
    .getByRole("button", { name: /Delete Uber expense of QAR 31\.75/ })
    .first()
    .click();
  await expectTotal(page, withExpense - 3175);

  await page.getByRole("button", { name: "Undo" }).click();
  await expectTotal(page, withExpense);
  await page.reload();
  await expectTotal(page, withExpense);
});

test("a PKR expense counts in the QAR total at the saved rate", async ({
  page,
}) => {
  const before = await readTotal(page);
  await addForItem(page, "Grocery", "10000", { currency: "PKR" });
  // 10,000 PKR at 76.50 PKR/QAR = QAR 130.72
  await expectTotal(page, before + 13072);

  await page
    .getByRole("group", { name: "Show totals in" })
    .getByRole("radio", { name: "PKR" })
    .click();
  await expect(page.getByTestId("item-Grocery")).toContainText("10,000");
  await page
    .getByRole("group", { name: "Show totals in" })
    .getByRole("radio", { name: "QAR" })
    .click();
  await expectTotal(page, before + 13072);
});

test("validates the amount before saving", async ({ page }) => {
  await page.getByRole("button", { name: "Add Lunch expense" }).click();
  const form = dialog(page);
  await form.getByLabel("Amount", { exact: true }).fill("12.345");
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(
    form.getByText("Enter an amount above 0 with up to 2 decimals"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
