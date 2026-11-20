import { expect, type Locator, type Page } from "@playwright/test";

/** "QAR 1,234.50" → 123450 (minor units). */
export function parseMinor(text: string | null): number {
  const digits = (text ?? "").replace(/[^\d.-]/g, "");
  const [whole = "0", fraction = ""] = digits.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  return (
    sign *
    (Math.abs(Number(whole)) * 100 +
      Number(fraction.padEnd(2, "0").slice(0, 2)))
  );
}

export async function readTotal(page: Page): Promise<number> {
  return parseMinor(await page.getByTestId("month-total").textContent());
}

export async function expectTotal(page: Page, minor: number, currency = "QAR") {
  const whole = Math.floor(Math.abs(minor) / 100).toLocaleString("en-US");
  const text =
    currency === "QAR"
      ? `${currency} ${whole}.${String(Math.abs(minor) % 100).padStart(2, "0")}`
      : `${currency} ${Math.round(minor / 100).toLocaleString("en-US")}`;
  await expect(page.getByTestId("month-total")).toHaveText(text);
}

export function dialog(page: Page): Locator {
  return page.getByRole("dialog");
}

/** Opens the add dialog for an item from its row and saves an amount. */
export async function addForItem(
  page: Page,
  item: string,
  amount: string,
  options: { currency?: "QAR" | "PKR"; note?: string } = {},
) {
  await page.getByRole("button", { name: `Add ${item} expense` }).click();
  const form = dialog(page);
  await expect(form).toBeVisible();
  await form.getByLabel("Amount", { exact: true }).fill(amount);
  if (options.currency) {
    await form.getByRole("radio", { name: options.currency }).click();
  }
  if (options.note) await form.getByLabel(/^Note/).fill(options.note);
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(form).toBeHidden();
}
