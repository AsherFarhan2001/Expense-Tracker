"use client";

import { useSyncExternalStore } from "react";
import { msUntilNextQatarDay, todayInQatar, type DateKey } from "@/lib/dates";

/** Notifies at each Qatar midnight, and when the tab is shown again (timers sleep in background tabs). */
function subscribe(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    // A second past midnight, so the new date is certainly in effect.
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, msUntilNextQatarDay() + 1000);
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };

  schedule();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * Today's date in Qatar, kept current while the page stays open.
 * `serverToday` is what the server rendered with, so hydration matches.
 */
export function useToday(serverToday: DateKey): DateKey {
  return useSyncExternalStore(
    subscribe,
    () => todayInQatar(),
    () => serverToday,
  );
}
