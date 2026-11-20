import { defineConfig } from "drizzle-kit";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file is optional
  }
}

const usePglite =
  process.env.DATABASE_DRIVER === "pglite" ||
  (!process.env.DATABASE_DRIVER && !process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(usePglite
    ? {
        driver: "pglite",
        dbCredentials: { url: process.env.PGLITE_DIR || ".data/pglite" },
      }
    : { dbCredentials: { url: process.env.DATABASE_URL ?? "" } }),
});
