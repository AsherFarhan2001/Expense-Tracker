"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { Money } from "@/components/money";
import { ChartContainer } from "@/components/ui/chart";
import { formatMoney, type Currency } from "@/lib/money";
import { categoryColor } from "@/lib/palette";
import type { CategoryShare } from "../compare";
import { ChartTooltipCard } from "./chart-tooltip";

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

type Props = { shares: CategoryShare[]; currency: Currency; total: number };

export function CategoryDonut({ shares, currency, total }: Props) {
  const data = shares.map((s) => ({ ...s, value: s.total }));
  return (
    <div className="grid gap-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center lg:grid-cols-1 xl:grid-cols-[11rem_minmax(0,1fr)]">
      <div className="relative mx-auto size-44">
        <ChartContainer config={{}} className="aspect-square size-44">
          <PieChart accessibilityLayer>
            <Tooltip
              content={({ active, payload }) => {
                const share = active
                  ? (payload?.[0]?.payload as CategoryShare | undefined)
                  : undefined;
                if (!share) return null;
                return (
                  <ChartTooltipCard
                    title={share.name}
                    rows={[
                      {
                        label: "Spent",
                        value: formatMoney(share.total, currency),
                        color: categoryColor(share.color),
                      },
                      { label: "Share", value: percent.format(share.share) },
                    ]}
                  />
                );
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={data.length > 1 ? 1.5 : 0}
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.categoryId} fill={categoryColor(s.color)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <Money
            minor={total}
            currency={currency}
            className="text-sm font-semibold"
          />
        </div>
      </div>
      <ul className="grid gap-2 text-sm">
        {shares.map((s) => (
          <li key={s.categoryId} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: categoryColor(s.color) }}
              aria-hidden="true"
            />
            <span className="truncate">{s.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {percent.format(s.share)}
            </span>
            <Money className="ml-auto" minor={s.total} currency={currency} />
          </li>
        ))}
      </ul>
    </div>
  );
}
