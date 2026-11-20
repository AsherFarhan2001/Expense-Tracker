"use client";

import { startTransition, useOptimistic } from "react";
import { toast } from "sonner";
import { CurrencyToggle } from "@/components/currency-toggle";
import type { Currency } from "@/lib/money";
import { setDisplayCurrency } from "../actions";

/** Switches the totals currency for every screen (saved in settings). */
export function DisplayCurrencyToggle({ value }: { value: Currency }) {
  const [currency, setOptimistic] = useOptimistic(value);
  return (
    <CurrencyToggle
      label="Show totals in"
      value={currency}
      onChange={(next) =>
        startTransition(async () => {
          setOptimistic(next);
          const result = await setDisplayCurrency(next);
          if (!result.ok) toast.error(result.error);
        })
      }
    />
  );
}
