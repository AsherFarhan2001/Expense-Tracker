import "./load-env";
import { createDb, resolveDriver } from "../src/db/create-db";
import { seedDatabase } from "../src/db/seed";

// No top-level await: tsx runs these scripts as CommonJS (package.json has no "type").
async function main() {
  const driver = resolveDriver(process.env);
  console.log(`Seeding (${driver})…`);
  const handle = await createDb();
  try {
    await seedDatabase(handle.db);
    console.log("Seed complete.");
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
