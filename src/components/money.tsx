import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

type MoneyProps = {
  minor: number;
  currency: Currency;
  signed?: boolean;
  className?: string;
  /** Classes for the currency code (it is quieter than the number by default). */
  codeClassName?: string;
};

/** Amount with a de-emphasised currency code and tabular figures. */
export function Money({
  minor,
  currency,
  signed,
  className,
  codeClassName,
}: MoneyProps) {
  const number = formatMoney(minor, currency, { code: false, signed });
  const sign =
    number.startsWith("-") || number.startsWith("+") ? number[0] : "";
  const digits = sign ? number.slice(1) : number;
  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      {sign}
      <span
        className={cn(
          "mr-[0.3em] text-[0.72em] font-medium text-muted-foreground",
          codeClassName,
        )}
      >
        {currency}
      </span>
      {digits}
    </span>
  );
}
