"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatMoney, type Currency } from "@/lib/money";
import type { ItemComparison } from "../compare";
import { ChartTooltipCard } from "./chart-tooltip";

const CURRENT = "var(--primary)";
const PREVIOUS =
  "color-mix(in oklch, var(--muted-foreground) 45%, transparent)";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Props = {
  rows: ItemComparison[];
  currency: Currency;
  currentLabel: string;
  previousLabel: string;
};

/** Paired horizontal bars per item: this month (maroon) over last month (grey). */
export function ItemComparisonChart({
  rows,
  currency,
  currentLabel,
  previousLabel,
}: Props) {
  const config = {
    current: { label: currentLabel, color: CURRENT },
    previous: { label: previousLabel, color: PREVIOUS },
  } satisfies ChartConfig;
  const data = rows.map((r) => ({
    name: r.name,
    current: r.current / 100,
    previous: r.previous / 100,
    row: r,
  }));

  return (
    <div className="grid gap-3">
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label="Legend"
      >
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[3px]"
            style={{ background: CURRENT }}
            aria-hidden="true"
          />
          {currentLabel}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[3px]"
            style={{ background: PREVIOUS }}
            aria-hidden="true"
          />
          {previousLabel}
        </li>
      </ul>
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height: Math.max(160, rows.length * 44 + 32) }}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
          barGap={2}
          barCategoryGap={10}
          accessibilityLayer
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => compact.format(v)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={112}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const row = active
                ? (payload?.[0]?.payload as { row?: ItemComparison })?.row
                : undefined;
              if (!row) return null;
              return (
                <ChartTooltipCard
                  title={`${row.name} · ${row.categoryName}`}
                  rows={[
                    {
                      label: currentLabel,
                      value: formatMoney(row.current, currency),
                      color: CURRENT,
                    },
                    {
                      label: previousLabel,
                      value: formatMoney(row.previous, currency),
                      color: PREVIOUS,
                    },
                    {
                      label: "Change",
                      value: formatMoney(row.delta, currency, { signed: true }),
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="previous"
            fill={PREVIOUS}
            radius={[0, 4, 4, 0]}
            barSize={9}
          />
          <Bar
            dataKey="current"
            fill={CURRENT}
            radius={[0, 4, 4, 0]}
            barSize={9}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
