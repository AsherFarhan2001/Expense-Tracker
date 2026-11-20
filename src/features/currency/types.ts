import type { DateKey } from "@/lib/dates";

/** Today's PKR-per-QAR rate as shown in the expense dialog. */
export type RateInfo = {
  pkrPerQar: string;
  rateDate: DateKey;
  /** True when today's rate couldn't be fetched and an older cached rate is shown. */
  stale: boolean;
};
