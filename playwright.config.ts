import { defineConfig, devices } from "@playwright/test";

// E2E runs against a production build on its own port, so it never collides
// with your `npm run dev` server (Next.js allows only one `next dev` per project).
// The server uses a fresh PGlite database and a fixed exchange rate, so tests
// never touch Neon or the network. Tests share one database, so they run
// serially and assert on changes relative to what they read first.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
const E2E_DB = ".data/pglite-e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `node -e "require('fs').rmSync('${E2E_DB}',{recursive:true,force:true})" && npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      DATABASE_DRIVER: "pglite",
      PGLITE_DIR: E2E_DB,
      FX_PROVIDER: "fixed",
      FX_FIXED_PKR_PER_QAR: "76.5",
      APP_PIN_HASH: "",
    },
  },
});
