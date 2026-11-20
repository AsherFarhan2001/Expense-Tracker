import type { z } from "zod";

export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; error: string; field?: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, field?: string): ActionResult<never> {
  return { ok: false, error, field };
}

/** First Zod issue as a user-facing error, tagged with the field it belongs to. */
export function failFromZod(error: z.ZodError): ActionResult<never> {
  const issue = error.issues[0];
  const field = typeof issue?.path[0] === "string" ? issue.path[0] : undefined;
  return fail(issue?.message ?? "Check the highlighted fields", field);
}
