import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

const percentFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

type DeltaProps = {
  current: number;
  previous: number;
  currency: Currency;
  /** Text after the figures, e.g. "vs November". */
  suffix?: string;
  className?: string;
  showAmount?: boolean;
};

/** Spending change: red when it went up, green when it went down. */
export function Delta({
  current,
  previous,
  currency,
  suffix,
  className,
  showAmount = true,
}: DeltaProps) {
  const diff = current - previous;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const percent =
    previous > 0 ? percentFormat.format(Math.abs(diff) / previous) : null;

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-1.5 text-sm tabular-nums",
        diff > 0 && "text-increase",
        diff < 0 && "text-decrease",
        diff === 0 && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">
        {diff > 0 ? "Up" : diff < 0 ? "Down" : "No change"}
      </span>
      {percent && <span className="font-medium">{percent}</span>}
      {showAmount && (
        <span className={cn(percent && "opacity-80")}>
          {percent
            ? `(${formatMoney(diff, currency, { signed: true })})`
            : formatMoney(diff, currency, { signed: true })}
        </span>
      )}
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}
