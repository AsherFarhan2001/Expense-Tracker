"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CURRENCIES, isCurrency, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

type CurrencyToggleProps = {
  value: Currency;
  onChange: (currency: Currency) => void;
  label?: string;
  size?: "sm" | "default";
  className?: string;
};

export function CurrencyToggle({
  value,
  onChange,
  label = "Currency",
  size = "sm",
  className,
}: CurrencyToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size={size}
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (isCurrency(next)) onChange(next);
      }}
      aria-label={label}
      className={cn("bg-card", className)}
    >
      {CURRENCIES.map((currency) => (
        <ToggleGroupItem
          key={currency}
          value={currency}
          aria-label={currency}
          className="px-3 font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {currency}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
