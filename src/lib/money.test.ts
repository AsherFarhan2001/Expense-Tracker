import { describe, expect, it } from "vitest";
import {
  convertMinor,
  formatMinorForInput,
  formatMoney,
  normalizeRate,
  parseAmountToMinor,
  sumMinor,
} from "./money";

describe("parseAmountToMinor", () => {
  it.each([
    ["25", 2500],
    ["25.5", 2550],
    ["0.01", 1],
    ["1,234.50", 123450],
    [" 10 ", 1000],
    ["1000000", 100000000],
  ])("parses %j as %i minor units", (input, expected) => {
    expect(parseAmountToMinor(input)).toBe(expected);
  });

  it.each(["", "abc", "0", "0.00", "-5", "12.345", "1.2.3", "1e5", "∞"])(
    "rejects %j",
    (input) => {
      expect(parseAmountToMinor(input)).toBeNull();
    },
  );
});

describe("normalizeRate", () => {
  it("normalizes to six decimals", () => {
    expect(normalizeRate("76.5")).toBe("76.500000");
    expect(normalizeRate("76.123456")).toBe("76.123456");
  });

  it.each(["0", "-1", "abc", "1.1234567", ""])("rejects %j", (input) => {
    expect(normalizeRate(input)).toBeNull();
  });
});

describe("convertMinor", () => {
  it("returns the same amount for the same currency", () => {
    expect(convertMinor(12345, "QAR", "QAR", "76.5")).toBe(12345);
  });

  it("converts PKR to QAR (10,000 PKR @ 76.50 → 130.72 QAR)", () => {
    expect(convertMinor(1_000_000, "PKR", "QAR", "76.500000")).toBe(13072);
  });

  it("converts QAR to PKR (130.72 QAR @ 76.50 → 10,000.08 PKR)", () => {
    expect(convertMinor(13072, "QAR", "PKR", "76.5")).toBe(1_000_008);
  });

  it("rounds half up", () => {
    // 1 paisa / 2 = 0.5 dirham-cents → rounds to 1
    expect(convertMinor(1, "PKR", "QAR", "2")).toBe(1);
    // 3 / 2 = 1.5 → 2
    expect(convertMinor(3, "PKR", "QAR", "2")).toBe(2);
  });

  it("is exact for large amounts (no float drift)", () => {
    // 9,999,999.99 QAR @ 76.543210
    expect(convertMinor(999_999_999, "QAR", "PKR", "76.543210")).toBe(
      76_543_209_923,
    );
  });

  it("throws on an invalid rate", () => {
    expect(() => convertMinor(100, "QAR", "PKR", "0")).toThrow();
  });
});

describe("formatMoney", () => {
  it("formats QAR with two decimals", () => {
    expect(formatMoney(123450, "QAR")).toBe("QAR 1,234.50");
    expect(formatMoney(0, "QAR")).toBe("QAR 0.00");
  });

  it("formats PKR as whole rupees with international grouping", () => {
    expect(formatMoney(100_000_000, "PKR")).toBe("PKR 1,000,000");
    expect(formatMoney(1_000_050, "PKR")).toBe("PKR 10,001");
  });

  it("can omit the currency code", () => {
    expect(formatMoney(123450, "QAR", { code: false })).toBe("1,234.50");
  });

  it("formats negative amounts and signed deltas", () => {
    expect(formatMoney(-2500, "QAR")).toBe("-QAR 25.00");
    expect(formatMoney(2500, "QAR", { signed: true })).toBe("+QAR 25.00");
  });
});

describe("helpers", () => {
  it("formatMinorForInput renders a plain decimal", () => {
    expect(formatMinorForInput(123450)).toBe("1234.50");
    expect(formatMinorForInput(1)).toBe("0.01");
  });

  it("sumMinor adds integers", () => {
    expect(sumMinor([100, 250, 1])).toBe(351);
    expect(sumMinor([])).toBe(0);
  });
});
