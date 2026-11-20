import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from "@/db/client";
import {
  CatalogEditor,
  CatalogLegend,
} from "@/features/catalog/components/catalog-editor";
import { getRateForDay, LIVE_SOURCE } from "@/features/currency/rates";
import { getCatalog } from "@/features/expenses/queries";
import { PinLockPanel } from "@/features/pin-lock/components/pin-lock-panel";
import { PreferencesForm } from "@/features/settings/components/preferences-form";
import { getSettings } from "@/features/settings/queries";
import { formatMonthLabel, formatShortDate, todayInQatar } from "@/lib/dates";
import { formatRate } from "@/lib/money";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Settings
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Choose what appears on your monthly list, and how amounts are shown.
        </p>
      </header>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  await connection();
  const db = await getDb();
  const today = todayInQatar();
  const [catalog, settings, rate] = await Promise.all([
    getCatalog(db),
    getSettings(db),
    getRateForDay(db, today),
  ]);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <section aria-labelledby="catalog-heading" className="grid gap-4">
        <h2 id="catalog-heading" className="sr-only">
          Categories and items
        </h2>
        <CatalogEditor catalog={catalog} />
      </section>

      <aside className="grid gap-8 lg:sticky lg:top-20">
        <Panel title="Preferences">
          <PreferencesForm
            defaultCurrency={settings.defaultCurrency}
            displayCurrency={settings.displayCurrency}
          />
        </Panel>

        <Panel title="Exchange rate">
          {rate ? (
            <div className="grid gap-1 text-sm">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                1 QAR = {formatRate(rate.pkrPerQar)} PKR
              </p>
              <p className="text-muted-foreground">
                {rate.stale
                  ? `Today's rate is unavailable. Showing the last known rate from ${formatShortDate(rate.rateDate)}.`
                  : `Rate for ${formatShortDate(rate.rateDate)}. Each expense keeps the rate from the day it was saved.`}
              </p>
              {rate.source === LIVE_SOURCE && (
                <p className="text-muted-foreground">
                  <a
                    href="https://www.exchangerate-api.com"
                    className="underline underline-offset-4 hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rates by Exchange Rate API
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No rate is available right now. You can type the rate when you add
              a PKR expense.
            </p>
          )}
        </Panel>

        <Panel title="How items work">
          <CatalogLegend />
          <p className="mt-3 text-sm text-muted-foreground">
            Tracking started in {formatMonthLabel(settings.startMonth)}.
          </p>
        </Panel>

        <PinLockPanel />
      </aside>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="border-b pb-2 text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SettingsSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12"
      aria-busy="true"
    >
      <div className="grid gap-4">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
      <div className="grid content-start gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
