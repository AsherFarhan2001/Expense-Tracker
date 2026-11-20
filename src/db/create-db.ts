// Driver selection, shared by the app (via client.ts) and CLI scripts.
// Not marked server-only so `tsx scripts/*.ts` can import it.
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
export type DatabaseDriver = "neon" | "pglite";

export type DatabaseHandle = {
  db: Database;
  driver: DatabaseDriver;
  migrate: () => Promise<void>;
  close: () => Promise<void>;
};

type Env = Record<string, string | undefined>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

/** Explicit DATABASE_DRIVER wins; otherwise Neon when DATABASE_URL is set, else local PGlite. */
export function resolveDriver(env: Env): DatabaseDriver {
  const explicit = env.DATABASE_DRIVER?.trim();
  if (explicit === "neon" || explicit === "pglite") return explicit;
  if (explicit) throw new Error(`Unknown DATABASE_DRIVER "${explicit}"`);
  return env.DATABASE_URL ? "neon" : "pglite";
}

export async function createDb(
  env: Env = process.env,
): Promise<DatabaseHandle> {
  const driver = resolveDriver(env);

  if (driver === "pglite") {
    if (env.VERCEL) {
      throw new Error(
        "DATABASE_URL is not set. PGlite cannot be used on Vercel; configure the Neon connection string.",
      );
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");

    const dataDir = env.PGLITE_DIR?.trim() || ".data/pglite";
    if (dataDir !== "memory://") mkdirSync(dataDir, { recursive: true });
    const client = new PGlite(dataDir);
    const db = drizzle({ client, schema });
    return {
      db: db as unknown as Database,
      driver,
      migrate: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
      close: () => client.close(),
    };
  }

  const url = env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for the neon driver");
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");

  const db = drizzle({ client: neon(url), schema });
  return {
    db: db as unknown as Database,
    driver,
    migrate: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: async () => {},
  };
}
