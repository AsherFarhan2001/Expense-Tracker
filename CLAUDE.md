# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal expense tracker for one user living in Qatar: monthly expenses in QAR/PKR, starting December 2026. **`SPEC.md` is the source of truth for scope and decisions**, and `tasks/todo.md` tracks which phase we're in. Update `SPEC.md` first when a decision changes.

@AGENTS.md

## Commands

```bash
npm run dev                  # http://localhost:3000 (only one `next dev` may run per project)
npm run check                # lint + typecheck + format:check + unit/component tests. Run before every commit.
npm test                     # vitest run (all projects)
npx vitest run src/lib/money.test.ts      # one file
npx vitest run -t "converts PKR"          # one test by name
npx vitest run --project unit             # one project: unit | component | integration
npm run test:e2e             # Playwright: builds, then serves on :3100 with PGlite (desktop + 375px mobile)
npm run typecheck            # runs `next typegen` first: LayoutProps/PageProps are generated globals
npm run format               # prettier --write .
npx shadcn@latest add <component>         # add a shadcn/ui primitive (ask first: it adds dependencies)
```

Database scripts (`db:generate`, `db:migrate`, `db:seed`, `db:studio`) arrive in Phase 1; see `SPEC.md` §3.

## Architecture

- **Next.js 16 App Router** with `cacheComponents: true`: uncached dynamic data must sit inside `<Suspense>` or use `"use cache"`. Read `node_modules/next/dist/docs/` before using a Next API you haven't checked. The request guard is `src/proxy.ts`; Next 16 renamed `middleware.ts`.
- **`src/app/`** holds route files only. They load data through feature `queries.ts` and render feature components. No business logic lives here.
- **`src/features/<feature>/`** is one folder per feature (expenses, catalog, currency, analysis, pin-lock). Reads go in `queries.ts` (server-only), writes in `actions.ts` (Server Actions returning `ActionResult`), and Zod schemas in `schemas.ts`, shared by the client form and the server. See `src/features/CLAUDE.md`.
- **`src/db/`** holds the Drizzle schema and client. The client is Neon (`@neondatabase/serverless`) by default, or PGlite when `DATABASE_DRIVER=pglite` (tests and e2e). See `src/db/CLAUDE.md`.
- **`src/lib/money.ts`** handles integer minor units, QAR↔PKR conversion with scaled-integer maths, and `formatMoney()`. **`src/lib/dates.ts`** handles month keys (`YYYY-MM`) and month bounds in `Asia/Qatar`. Vercel runs in UTC, so never use `new Date()` month logic directly.
- **Currency model:** every expense stores its own `pkr_per_qar` rate plus `amount_qar_minor` and `amount_pkr_minor`, computed once at save time. Totals are plain sums, so past months never change when rates move.
- **`src/components/ui/`** holds shadcn/ui primitives (radix-nova style; `cn` comes from the `cn` package). They're excluded from Prettier to keep upstream formatting.

## Rules that are easy to get wrong

- Money is **never** a float: store and sum integer minor units only, and format only at display time.
- Every Server Action validates input with Zod and calls `requireUnlocked()` before doing anything.
- Deleting an expense is a soft delete (`deleted_at`) so Undo works. Queries must filter `deleted_at IS NULL`.
- Tests must never touch Neon. Unit and integration tests use PGlite, and e2e starts its own server with PGlite.
- Ask before: adding or upgrading dependencies, schema changes and migrations, anything against the production Neon branch, deploying to Vercel, or changing the FX source, rounding, or the PIN mechanism.
- Never read or commit `.env*` values. `.env.example` documents the variables.
