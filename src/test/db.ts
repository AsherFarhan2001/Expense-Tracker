import { createDb, type Database } from "@/db/create-db";
import { seedDatabase } from "@/db/seed";

export type TestDb = { db: Database; close: () => Promise<void> };

/** Fresh in-memory Postgres (PGlite) with all migrations applied. */
export async function createTestDb({
  seed = true,
}: { seed?: boolean } = {}): Promise<TestDb> {
  const handle = await createDb({
    DATABASE_DRIVER: "pglite",
    PGLITE_DIR: "memory://",
  });
  await handle.migrate();
  if (seed) await seedDatabase(handle.db);
  return { db: handle.db, close: handle.close };
}
