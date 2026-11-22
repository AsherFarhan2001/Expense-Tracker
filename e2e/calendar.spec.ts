import { expect, test } from "@playwright/test";
import { dialog } from "./helpers";

test.beforeEach(async ({ page }) => {
  // The browser believes it is 15 December 2026, 10:00 in Qatar. The calendar
  // reads today from the browser's clock, so this works whatever the real date.
  await page.clock.setFixedTime(new Date("2026-12-15T07:00:00Z"));
  await page.goto("/months/2026-12");
});

test("shows today's date and every day of the month by weekday", async ({
  page,
}) => {
  await expect(
    page.getByText("Today is Tuesday, 15 December 2026"),
  ).toBeVisible();

  const calendar = page.getByRole("region", { name: "Calendar" });
  await expect(calendar.getByRole("columnheader")).toHaveText([
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);
  await expect(calendar.getByRole("button")).toHaveCount(31);
  await expect(
    calendar.getByRole("button", { name: /^Tuesday, 15 December 2026, today/ }),
  ).toHaveAttribute("aria-current", "date");
  await expect(calendar.locator("[aria-current=date]")).toHaveCount(1);
});

test("tapping a day adds an expense on that date and marks the day", async ({
  page,
}) => {
  const calendar = page.getByRole("region", { name: "Calendar" });
  await calendar
    .getByRole("button", { name: /^Sunday, 20 December 2026/ })
    .click();

  const form = dialog(page);
  await expect(form.getByLabel("Date")).toHaveValue("2026-12-20");
  await form.getByRole("combobox", { name: "What was it for?" }).click();
  await page.getByRole("option", { name: "Tea", exact: true }).click();
  await form.getByLabel("Amount", { exact: true }).fill("12");
  await form.getByRole("button", { name: "Add expense" }).click();
  await expect(form).toBeHidden();

  await expect(
    calendar.getByRole("button", {
      name: /^Sunday, 20 December 2026: QAR [\d,.]+ spent/,
    }),
  ).toBeVisible();
});

test.describe("before tracking starts", () => {
  test.beforeEach(async ({ page }) => {
    // 21 November 2026, 10:00 in Qatar: tracking starts on 1 December.
    await page.clock.setFixedTime(new Date("2026-11-21T07:00:00Z"));
  });

  test("the calendar shows today's month with today highlighted", async ({
    page,
  }) => {
    await page.goto("/");
    const calendar = page.getByRole("region", { name: "Calendar" });
    await expect(
      calendar.getByRole("heading", { name: "November 2026" }),
    ).toBeVisible();
    const today = calendar.locator("[aria-current=date]");
    await expect(today).toHaveCount(1);
    await expect(today).toHaveAccessibleName(
      "Saturday, 21 November 2026, today",
    );
    // Days before tracking starts can't take expenses.
    await expect(today).toBeDisabled();
    await expect(calendar).toContainText(
      "Tracking starts on Tuesday, 1 December 2026.",
    );
  });
});
