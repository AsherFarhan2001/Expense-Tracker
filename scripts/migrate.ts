import "./load-env";
import { createDb, resolveDriver } from "../src/db/create-db";

// No top-level await: tsx runs these scripts as CommonJS (package.json has no "type").
async function main() {
  const driver = resolveDriver(process.env);
  console.log(`Applying migrations (${driver})…`);
  const handle = await createDb();
  try {
    await handle.migrate();
    console.log("Migrations applied.");
  } finally {
    await handle.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
