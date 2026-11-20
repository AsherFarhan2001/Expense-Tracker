"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { lockoutMinutesLeft, recordFailure, resetAttempts } from "./attempts";
import {
  getPinHash,
  getSessionSecret,
  isPinEnabled,
  safeNextPath,
  SESSION_COOKIE,
  SESSION_DAYS,
} from "./config";
import { createSessionToken, verifyPin } from "./crypto";

export type UnlockState = { error: string | null };

const PIN_RE = /^\d{4,12}$/;

export async function unlock(
  _previous: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const next = safeNextPath(formData.get("next"));
  if (!isPinEnabled()) redirect(next);

  const pin = String(formData.get("pin") ?? "").trim();
  if (!PIN_RE.test(pin)) return { error: "Enter your PIN (4–12 digits)." };

  const db = await getDb();
  const wait = await lockoutMinutesLeft(db);
  if (wait > 0) {
    return { error: `Too many wrong PINs. Try again in ${wait} min.` };
  }

  if (!verifyPin(pin, getPinHash())) {
    const left = await recordFailure(db);
    return {
      error:
        left === 0
          ? "Too many wrong PINs. Try again in 15 min."
          : `That PIN isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`,
    };
  }

  await resetAttempts(db);
  (await cookies()).set(
    SESSION_COOKIE,
    createSessionToken(getSessionSecret()),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    },
  );
  redirect(next);
}

export async function lockDevice(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/unlock");
}
