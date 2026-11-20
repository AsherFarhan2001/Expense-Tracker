import { defineConfig } from "vitest/config";

// Three projects so each kind of test gets the right environment:
//   unit        → src/**/*.test.ts       (node)
//   component   → src/**/*.test.tsx      (jsdom + Testing Library)
//   integration → src/**/*.int.test.ts   (node + PGlite, added in Phase 1)
// Run one project:  npx vitest run --project unit
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
        },
      },
    ],
  },
});
