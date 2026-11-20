"use client";

import { startTransition, useOptimistic } from "react";
import { toast } from "sonner";
import { CurrencyToggle } from "@/components/currency-toggle";
import type { Currency } from "@/lib/money";
import { setDefaultCurrency, setDisplayCurrency } from "../actions";

type PreferencesFormProps = {
  defaultCurrency: Currency;
  displayCurrency: Currency;
};

export function PreferencesForm(props: PreferencesFormProps) {
  const [prefs, setOptimistic] = useOptimistic(
    props,
    (state, patch: Partial<PreferencesFormProps>) => ({ ...state, ...patch }),
  );

  const update = (
    patch: Partial<PreferencesFormProps>,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) =>
    startTransition(async () => {
      setOptimistic(patch);
      const result = await action();
      if (!result.ok)
        toast.error(result.error ?? "Couldn't save that setting.");
    });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <p className="font-medium">New expenses in</p>
          <p className="text-sm text-muted-foreground">
            Pre-selected when you add an expense.
          </p>
        </div>
        <CurrencyToggle
          label="Default currency for new expenses"
          value={prefs.defaultCurrency}
          onChange={(currency) =>
            update({ defaultCurrency: currency }, () =>
              setDefaultCurrency(currency),
            )
          }
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <p className="font-medium">Show totals in</p>
          <p className="text-sm text-muted-foreground">
            Used for monthly totals, history and charts.
          </p>
        </div>
        <CurrencyToggle
          label="Currency for totals"
          value={prefs.displayCurrency}
          onChange={(currency) =>
            update({ displayCurrency: currency }, () =>
              setDisplayCurrency(currency),
            )
          }
        />
      </div>
    </div>
  );
}
