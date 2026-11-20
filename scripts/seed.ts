import "./load-env";
import { createDb, resolveDriver } from "../src/db/create-db";
import { seedDatabase } from "../src/db/seed";

const driver = resolveDriver(process.env);
console.log(`Seeding (${driver})…`);
const handle = await createDb();
try {
  await seedDatabase(handle.db);
  console.log("Seed complete.");
} finally {
  await handle.close();
}
