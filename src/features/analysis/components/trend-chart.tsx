"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { formatMonthLabel, type MonthKey } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import type { MonthTotal } from "../compare";
import { ChartTooltipCard } from "./chart-tooltip";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Props = {
  months: MonthTotal[];
  currency: Currency;
  selected: MonthKey;
};

/** Monthly totals over time; the selected month is marked. */
export function TrendChart({ months, currency, selected }: Props) {
  const data = months.map((m) => ({
    month: m.month,
    label: formatMonthLabel(m.month, "short"),
    total: m.totals[currency] / 100,
    minor: m.totals[currency],
    entries: m.entryCount,
  }));
  const selectedPoint = data.find((d) => d.month === selected);

  return (
    <ChartContainer
      config={{ total: { label: "Total", color: "var(--primary)" } }}
      className="aspect-auto h-56 w-full"
    >
      <AreaChart
        data={data}
        margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="2 4"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => compact.format(v)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{
            stroke: "var(--muted-foreground)",
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
          content={({ active, payload }) => {
            const point = active
              ? (payload?.[0]?.payload as (typeof data)[number] | undefined)
              : undefined;
            if (!point) return null;
            return (
              <ChartTooltipCard
                title={formatMonthLabel(point.month)}
                rows={[
                  {
                    label: "Spent",
                    value: formatMoney(point.minor, currency),
                    color: "var(--primary)",
                  },
                  { label: "Expenses", value: String(point.entries) },
                ]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#trend-fill)"
          dot={{
            r: 4,
            fill: "var(--card)",
            stroke: "var(--primary)",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 5,
            fill: "var(--primary)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
        {selectedPoint && (
          <ReferenceDot
            x={selectedPoint.label}
            y={selectedPoint.total}
            r={6}
            fill="var(--primary)"
            stroke="var(--card)"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
}
