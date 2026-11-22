import { expect, test } from "@playwright/test";

test("a category can be collapsed and stays collapsed after a reload", async ({
  page,
}) => {
  await page.goto("/");
  const qatar = page.getByRole("region", { name: "Qatar", exact: true });
  const toggle = qatar.getByRole("button", { name: "Qatar", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(qatar.getByTestId("item-Tea")).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(qatar.getByTestId("item-Tea")).toBeHidden();
  // The heading, total and menu stay visible.
  await expect(qatar.getByText(/items hidden/)).toBeAttached();
  await expect(
    qatar.getByRole("button", { name: "Qatar options" }),
  ).toBeVisible();

  await page.reload();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(qatar.getByTestId("item-Tea")).toBeHidden();

  await toggle.click();
  await expect(qatar.getByTestId("item-Tea")).toBeVisible();
});
