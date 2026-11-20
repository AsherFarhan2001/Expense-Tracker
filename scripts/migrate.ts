import "./load-env";
import { createDb, resolveDriver } from "../src/db/create-db";

const driver = resolveDriver(process.env);
console.log(`Applying migrations (${driver})…`);
const handle = await createDb();
try {
  await handle.migrate();
  console.log("Migrations applied.");
} finally {
  await handle.close();
}
