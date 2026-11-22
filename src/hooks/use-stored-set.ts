"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const CHANGE_EVENT = "stored-set-change";
/** Fallback when browser storage is unavailable (private mode, blocked site data). */
const memory = new Map<string, string>();

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? "[]";
  } catch {
    return memory.get(key) ?? "[]";
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory copy keeps working for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parse(raw: string): ReadonlySet<string> {
  try {
    const value: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

/**
 * A set of strings remembered in this browser (per-device preference, e.g.
 * which categories are collapsed). The server always renders it empty.
 */
export function useStoredSet(
  key: string,
): [ReadonlySet<string>, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) onChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(CHANGE_EVENT, onChange);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => "[]",
  );
  const set = useMemo(() => parse(raw), [raw]);

  const toggle = useCallback(
    (value: string) => {
      const next = new Set(parse(read(key)));
      if (next.has(value)) next.delete(value);
      else next.add(value);
      write(key, JSON.stringify([...next]));
    },
    [key],
  );

  return [set, toggle];
}
