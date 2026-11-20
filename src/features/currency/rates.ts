import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { fxRates } from "@/db/schema";
import type { DateKey } from "@/lib/dates";
import { normalizeRate } from "@/lib/money";

export type FetchedRate = { pkrPerQar: string; source: string };
export type RateProvider = () => Promise<FetchedRate | null>;

export type DayRate = {
  pkrPerQar: string;
  source: string;
  rateDate: DateKey;
  /** True when today's rate couldn't be fetched and an older cached rate is used. */
  stale: boolean;
};

const LIVE_URL = "https://open.er-api.com/v6/latest/QAR";
export const LIVE_SOURCE = "open.er-api.com";

/** Free, key-less daily rates from ExchangeRate-API (attribution shown in Settings). */
export const liveProvider: RateProvider = async () => {
  try {
    const response = await fetch(LIVE_URL, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    const pkr = body.rates?.PKR;
    if (body.result !== "success" || typeof pkr !== "number") return null;
    const rate = normalizeRate(pkr.toFixed(6));
    return rate ? { pkrPerQar: rate, source: LIVE_SOURCE } : null;
  } catch {
    return null;
  }
};

export function fixedProvider(rate: string): RateProvider {
  const normalized = normalizeRate(rate);
  if (!normalized) throw new Error(`Invalid FX_FIXED_PKR_PER_QAR: ${rate}`);
  return async () => ({ pkrPerQar: normalized, source: "fixed" });
}

export function providerFromEnv(
  env: Record<string, string | undefined> = process.env,
): RateProvider {
  return env.FX_PROVIDER === "fixed"
    ? fixedProvider(env.FX_FIXED_PKR_PER_QAR ?? "76.5")
    : liveProvider;
}

/**
 * The PKR-per-QAR rate for `day`: cached row → provider (then cached) →
 * most recent cached rate (stale) → null when nothing is available.
 */
export async function getRateForDay(
  db: Database,
  day: DateKey,
  provider: RateProvider = providerFromEnv(),
): Promise<DayRate | null> {
  const [cached] = await db
    .select()
    .from(fxRates)
    .where(eq(fxRates.rateDate, day))
    .limit(1);
  if (cached) {
    return {
      pkrPerQar: cached.pkrPerQar,
      source: cached.source,
      rateDate: cached.rateDate,
      stale: false,
    };
  }

  const fetched = await provider();
  if (fetched) {
    await db
      .insert(fxRates)
      .values({ rateDate: day, ...fetched })
      .onConflictDoNothing();
    return { ...fetched, rateDate: day, stale: false };
  }

  const [latest] = await db
    .select()
    .from(fxRates)
    .orderBy(desc(fxRates.rateDate))
    .limit(1);
  return latest
    ? {
        pkrPerQar: latest.pkrPerQar,
        source: latest.source,
        rateDate: latest.rateDate,
        stale: true,
      }
    : null;
}
