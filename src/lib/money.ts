// Money is always an integer number of minor units (1 QAR = 100 dirham,
// 1 PKR = 100 paisa). Rates are decimal strings "PKR per 1 QAR" with up to six
// decimals and are applied with BigInt maths, so no floating point is involved.

export const CURRENCIES = ["QAR", "PKR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return value === "QAR" || value === "PKR";
}

/** Upper bound for a single amount: 100 billion (in major units). */
const MAX_MINOR = 10_000_000_000_000;
const RATE_SCALE = 1_000_000n;

const AMOUNT_RE = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/;
const RATE_RE = /^\d+(?:\.\d{1,6})?$/;

/** "1,234.5" → 123450. Returns null for anything that isn't a positive amount with ≤ 2 decimals. */
export function parseAmountToMinor(input: string): number | null {
  const value = input.trim();
  if (!AMOUNT_RE.test(value)) return null;
  const [whole = "0", fraction = ""] = value.replaceAll(",", "").split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_MINOR) {
    return null;
  }
  return minor;
}

/** "76.5" → "76.500000". Returns null unless it's a positive number with ≤ 6 decimals. */
export function normalizeRate(input: string): string | null {
  const value = input.trim();
  if (!RATE_RE.test(value)) return null;
  const [whole = "0", fraction = ""] = value.split(".");
  const normalized = `${BigInt(whole).toString()}.${fraction.padEnd(6, "0")}`;
  return rateToMicros(normalized) > 0n ? normalized : null;
}

function rateToMicros(rate: string): bigint {
  const [whole = "0", fraction = ""] = rate.split(".");
  return BigInt(whole) * RATE_SCALE + BigInt(fraction.padEnd(6, "0"));
}

/** Integer division rounding half up (non-negative operands). */
function roundDiv(numerator: bigint, denominator: bigint): bigint {
  return (2n * numerator + denominator) / (2n * denominator);
}

/** Convert minor units between QAR and PKR using a "PKR per 1 QAR" rate. */
export function convertMinor(
  amountMinor: number,
  from: Currency,
  to: Currency,
  pkrPerQar: string,
): number {
  if (from === to) return amountMinor;
  const rate = normalizeRate(pkrPerQar);
  if (rate === null) throw new Error(`Invalid exchange rate: ${pkrPerQar}`);
  const micros = rateToMicros(rate);
  const amount = BigInt(amountMinor);
  const converted =
    from === "QAR"
      ? roundDiv(amount * micros, RATE_SCALE)
      : roundDiv(amount * RATE_SCALE, micros);
  return Number(converted);
}

const integerFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export type FormatMoneyOptions = {
  /** Prefix with the currency code (default true). */
  code?: boolean;
  /** Prefix positive amounts with "+" (for deltas). */
  signed?: boolean;
};

/** 123450, "QAR" → "QAR 1,234.50"; PKR is shown as whole rupees. */
export function formatMoney(
  minor: number,
  currency: Currency,
  { code = true, signed = false }: FormatMoneyOptions = {},
): string {
  const abs = Math.abs(minor);
  const number =
    currency === "QAR"
      ? `${integerFormat.format(Math.floor(abs / 100))}.${String(abs % 100).padStart(2, "0")}`
      : integerFormat.format(Number(roundDiv(BigInt(abs), 100n)));
  const sign = minor < 0 ? "-" : signed && minor > 0 ? "+" : "";
  return `${sign}${code ? `${currency} ` : ""}${number}`;
}

/** 123450 → "1234.50" (for pre-filling inputs). */
export function formatMinorForInput(minor: number): string {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

/** "76.500000" → "76.50" (at least two decimals, trailing zeros trimmed). */
export function formatRate(rate: string): string {
  const [whole = "0", fraction = ""] = rate.split(".");
  const trimmed = fraction.replace(/0+$/, "").padEnd(2, "0");
  return `${whole}.${trimmed}`;
}

export function sumMinor(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
