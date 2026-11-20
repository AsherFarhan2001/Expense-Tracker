import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { settings, type Settings } from "@/db/schema";
import { DEFAULT_START_MONTH } from "@/db/seed-data";

export async function getSettings(db: Database): Promise<Settings> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);
  if (row) return row;
  const [created] = await db
    .insert(settings)
    .values({ id: 1, startMonth: DEFAULT_START_MONTH })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [existing] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!existing) throw new Error("Settings row missing");
  return existing;
}

export async function updateSettings(
  db: Database,
  patch: Partial<Pick<Settings, "defaultCurrency" | "displayCurrency">>,
): Promise<void> {
  await db.update(settings).set(patch).where(eq(settings.id, 1));
}
