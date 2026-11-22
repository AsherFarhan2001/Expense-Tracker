import { expect, test, type Locator, type Page } from "@playwright/test";
import { dialog, parseMinor } from "./helpers";

async function logExpense(
  page: Page,
  section: Locator,
  item: string,
  amount: string,
  options: { currency?: "PKR"; note?: string } = {},
) {
  await section.getByRole("button", { name: `Add ${item} expense` }).click();
  const form = dialog(page);
  await form.getByLabel("Amount", { exact: true }).fill(amount);
  if (options.currency) {
    await form.getByRole("radio", { name: options.currency }).click();
  }
  if (options.note) await form.getByLabel(/^Note/).fill(options.note);
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(form).toBeHidden();
}

const searchTotal = async (page: Page) =>
  parseMinor(await page.getByTestId("search-total").textContent());

test("a category's expenses can be searched and narrowed", async ({
  page,
}, testInfo) => {
  // Desktop and mobile share one database, so names are per project.
  const umrah = `Umrah ${testInfo.project.name}`;
  await page.goto("/");
  const addCategory = page.getByRole("region", { name: "Add a category" });
  await addCategory.getByLabel("Category name").fill(umrah);
  await addCategory.getByRole("button", { name: "Add category" }).click();
  const section = page.getByRole("region", { name: umrah, exact: true });
  const newItem = section.getByLabel(`New item in ${umrah}`);
  await newItem.fill("Hotel");
  await newItem.press("Enter");
  await expect(section.getByTestId("item-Hotel")).toBeVisible();
  await newItem.fill("Flights");
  await newItem.press("Enter");
  await expect(section.getByTestId("item-Flights")).toBeVisible();

  await logExpense(page, section, "Hotel", "800", { note: "Makkah" });
  // 1,530 PKR at the fixed test rate of 76.5 is 20.00 QAR.
  await logExpense(page, section, "Flights", "1530", { currency: "PKR" });

  // The category menu opens the search for just this category.
  await section.getByRole("button", { name: `${umrah} options` }).click();
  await page.getByRole("menuitem", { name: "See all expenses" }).click();
  await expect(page).toHaveURL(/\/search\?category=/);
  await expect(page.getByRole("heading", { name: umrah })).toBeVisible();
  expect(await searchTotal(page)).toBe(80000 + 2000);
  const byMonth = page.getByRole("region", { name: "Expenses by month" });
  await expect(byMonth.getByText("Makkah")).toBeVisible();
  await expect(byMonth.getByText("PKR 1,530")).toBeVisible();

  // Typing narrows the results within the category.
  await page.getByLabel("Search expenses").fill("makkah");
  await expect(
    page.getByRole("heading", { name: `${umrah}: “makkah”` }),
  ).toBeVisible();
  expect(await searchTotal(page)).toBe(80000);
  await expect(byMonth.getByText("Flights")).toHaveCount(0);

  // Clearing the category keeps the words and searches everything.
  await page.getByRole("link", { name: umrah }).click();
  await expect(page).toHaveURL(/\/search\?q=makkah$/);
  await expect(page.getByRole("heading", { name: "“makkah”" })).toBeVisible();

  await page.getByLabel("Search expenses").fill("no-such-expense");
  await expect(
    page.getByText("Nothing matches “no-such-expense”"),
  ).toBeVisible();
});
