import { describe, expect, it } from "vitest";
import { prepareExpense } from "./prepare";
import { expenseFormSchema } from "./schemas";

const ITEM = "3f1c2a1e-8d4b-4c6e-9a2f-1b2c3d4e5f60";

describe("prepareExpense", () => {
  it("stores a PKR expense with both converted amounts (spec success criterion)", () => {
    const prepared = prepareExpense(
      {
        itemId: ITEM,
        amount: "10,000",
        currency: "PKR",
        spentOn: "2026-12-03",
      },
      "76.5",
      "manual",
    );
    expect(prepared).toMatchObject({
      amountMinor: 1_000_000,
      currency: "PKR",
      pkrPerQar: "76.500000",
      amountQarMinor: 13_072,
      amountPkrMinor: 1_000_000,
      rateSource: "manual",
      note: null,
    });
  });

  it("keeps QAR amounts exact and converts to PKR", () => {
    const prepared = prepareExpense(
      {
        itemId: ITEM,
        amount: "25",
        currency: "QAR",
        spentOn: "2026-12-03",
        note: "Karak",
      },
      "75.947268",
      "auto",
    );
    expect(prepared.amountQarMinor).toBe(2500);
    expect(prepared.amountPkrMinor).toBe(189_868);
    expect(prepared.note).toBe("Karak");
  });
});

describe("expenseFormSchema", () => {
  const valid = {
    itemId: ITEM,
    amount: "12.50",
    currency: "QAR",
    spentOn: "2026-12-01",
  };

  it("accepts a valid expense", () => {
    expect(expenseFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ amount: "0" }, "amount"],
    [{ amount: "12.345" }, "amount"],
    [{ spentOn: "2026-02-30" }, "spentOn"],
    [{ currency: "USD" }, "currency"],
    [{ itemId: "nope" }, "itemId"],
    [{ pkrPerQar: "-1" }, "pkrPerQar"],
    [{ note: "x".repeat(201) }, "note"],
  ])("rejects %j", (patch, field) => {
    const result = expenseFormSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });
});
