// Usage: npm run pin:hash -- <pin>
// Prints the env vars to set on Vercel (Settings → Environment Variables).
import { randomBytes } from "node:crypto";
import { hashPin } from "../src/features/pin-lock/crypto";

const pin = process.argv[2] ?? "";
if (!/^\d{6,12}$/.test(pin)) {
  console.error("Choose a PIN of 6–12 digits: npm run pin:hash -- 482916");
  process.exit(1);
}

console.log(`APP_PIN_HASH=${hashPin(pin)}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
