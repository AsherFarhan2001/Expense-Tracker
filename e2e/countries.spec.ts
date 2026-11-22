import { expect, test } from "@playwright/test";
import { dialog, expectTotal, readTotal } from "./helpers";

test("a country and its items can be added from the month page", async ({
  page,
}, testInfo) => {
  // Desktop and mobile share one database, so names are per project.
  const country = `Saudi ${testInfo.project.name}`;
  await page.goto("/");
  const before = await readTotal(page);

  const addCategory = page.getByRole("region", { name: "Add a category" });
  await addCategory.getByLabel("Category name").fill(country);
  await addCategory.getByRole("button", { name: "Add category" }).click();

  const section = page.getByRole("region", { name: country, exact: true });
  await expect(section.getByText("No items yet")).toBeVisible();
  const newItem = section.getByLabel(`New item in ${country}`);
  await expect(newItem).toBeFocused();

  await newItem.fill("Hotel");
  await section.getByRole("button", { name: "Add", exact: true }).click();
  await expect(section.getByTestId("item-Hotel")).toBeVisible();
  await expect(newItem).toHaveValue("");

  await newItem.fill("Umrah travel");
  await newItem.press("Enter");
  await expect(section.getByTestId("item-Umrah travel")).toBeVisible();

  await section.getByRole("button", { name: "Add Hotel expense" }).click();
  const form = dialog(page);
  await form.getByLabel("Amount", { exact: true }).fill("150");
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(form).toBeHidden();

  await expectTotal(page, before + 15000);
  await expect(section.getByTestId("item-Hotel")).toContainText("150.00");

  await page.reload();
  await expectTotal(page, before + 15000);
  await expect(section.getByTestId("item-Umrah travel")).toBeVisible();
  // Items in an existing category are added from a collapsed link.
  await expect(
    section.getByRole("button", { name: `Add item to ${country}` }),
  ).toBeVisible();
});

test("deleting a category asks first, then wipes it and its expenses", async ({
  page,
}, testInfo) => {
  const country = `Oman ${testInfo.project.name}`;
  await page.goto("/");
  const before = await readTotal(page);

  const addCategory = page.getByRole("region", { name: "Add a category" });
  await addCategory.getByLabel("Category name").fill(country);
  await addCategory.getByRole("button", { name: "Add category" }).click();
  const section = page.getByRole("region", { name: country, exact: true });
  await section.getByLabel(`New item in ${country}`).fill("Visa");
  await section.getByRole("button", { name: "Add", exact: true }).click();
  await section.getByRole("button", { name: "Add Visa expense" }).click();
  const form = dialog(page);
  await form.getByLabel("Amount", { exact: true }).fill("200");
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(form).toBeHidden();
  await expectTotal(page, before + 20000);

  await section.getByRole("button", { name: `${country} options` }).click();
  await page.getByRole("menuitem", { name: "Delete category…" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText(`Delete ${country}?`);
  await expect(confirm).toContainText("its 1 item and 1 expense (QAR 200.00)");

  // Cancelling keeps everything.
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(section).toBeVisible();

  await section.getByRole("button", { name: `${country} options` }).click();
  await page.getByRole("menuitem", { name: "Delete category…" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete permanently" })
    .click();
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(section).toHaveCount(0);
  await expectTotal(page, before);

  await page.reload();
  await expect(section).toHaveCount(0);
  await expectTotal(page, before);
});
