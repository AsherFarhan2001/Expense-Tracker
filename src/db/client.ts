import "server-only";
import { createDb, type Database } from "./create-db";
import { seedDatabase } from "./seed";

export type { Database } from "./create-db";

let ready: Promise<Database> | undefined;

async function init(): Promise<Database> {
  const handle = await createDb();
  // Local PGlite databases set themselves up so `npm run dev` works with zero config.
  // Neon is migrated and seeded explicitly (`npm run db:migrate && npm run db:seed`).
  if (handle.driver === "pglite") {
    await handle.migrate();
    await seedDatabase(handle.db);
  }
  return handle.db;
}

/** Process-wide database connection (lazy). */
export function getDb(): Promise<Database> {
  ready ??= init().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}
