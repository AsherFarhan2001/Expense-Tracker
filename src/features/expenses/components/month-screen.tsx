import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getRateForDay } from "@/features/currency/rates";
import type { RateInfo } from "@/features/currency/types";
import { getSettings } from "@/features/settings/queries";
import { navigableRange } from "@/features/settings/range";
import { clampMonth, todayInQatar, type MonthKey } from "@/lib/dates";
import { getMonthData } from "../queries";
import { MonthBoard } from "./month-board";

/** Loads a month and renders the interactive board. `month: null` = the current month. */
export async function MonthScreen({ month }: { month: MonthKey | null }) {
  await connection();
  const db = await getDb();
  const today = todayInQatar();
  const settings = await getSettings(db);
  const range = navigableRange(settings.startMonth, today);
  const target = month ? clampMonth(month, range) : range.max;

  const [data, rate] = await Promise.all([
    getMonthData(db, target),
    getRateForDay(db, today),
  ]);
  const todayRate: RateInfo | null = rate
    ? { pkrPerQar: rate.pkrPerQar, rateDate: rate.rateDate, stale: rate.stale }
    : null;

  return (
    <MonthBoard
      key={target}
      data={data}
      today={today}
      range={range}
      todayRate={todayRate}
      displayCurrency={settings.displayCurrency}
      defaultCurrency={settings.defaultCurrency}
    />
  );
}
