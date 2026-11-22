import { describe, expect, it } from "vitest";
import { describeCategoryDeletion } from "./deletion";

describe("describeCategoryDeletion", () => {
  it("keeps it short for an empty category", () => {
    expect(
      describeCategoryDeletion({
        name: "Saudi Arabia",
        itemCount: 0,
        archived: false,
        usage: undefined,
        currency: "QAR",
      }),
    ).toEqual({
      title: "Delete Saudi Arabia?",
      body: "Saudi Arabia will be removed. This can't be undone.",
      offerArchive: false,
    });
  });

  it("names the items when nothing was logged", () => {
    expect(
      describeCategoryDeletion({
        name: "Pakistan",
        itemCount: 1,
        archived: false,
        usage: undefined,
        currency: "QAR",
      }).body,
    ).toBe("Pakistan and its 1 item will be removed. This can't be undone.");
  });

  it("spells out the expenses and their total, and offers archiving", () => {
    expect(
      describeCategoryDeletion({
        name: "Pakistan",
        itemCount: 2,
        archived: false,
        usage: { expenseCount: 5, qarMinor: 123000, pkrMinor: 9409500 },
        currency: "PKR",
      }),
    ).toEqual({
      title: "Delete Pakistan?",
      body: "This permanently removes Pakistan, its 2 items and 5 expenses (PKR 94,095) from every month, History and Analysis. This can't be undone.",
      offerArchive: true,
    });
  });

  it("doesn't offer archiving for a category that is already archived", () => {
    const text = describeCategoryDeletion({
      name: "Pakistan",
      itemCount: 2,
      archived: true,
      usage: { expenseCount: 1, qarMinor: 1500, pkrMinor: 114750 },
      currency: "QAR",
    });
    expect(text.body).toContain("1 expense (QAR 15.00)");
    expect(text.offerArchive).toBe(false);
  });
});
