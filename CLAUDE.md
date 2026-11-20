# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal expense tracker for one user living in Qatar: monthly expenses in QAR/PKR, starting December 2026. **`SPEC.md` is the source of truth for scope and decisions**, and `tasks/todo.md` tracks what's done and what's left. Update `SPEC.md` first when a decision changes.

@AGENTS.md

## Commands

```bash
npm run dev                  # http://localhost:3000; with no DATABASE_URL it uses a local PGlite DB in .data/pglite
npm run check                # lint + typecheck + format:check + unit/component/integration tests. Run before every commit.
npm test                     # vitest run (all projects)
npx vitest run src/lib/money.test.ts      # one file
npx vitest run -t "converts PKR"          # one test by name
npx vitest run --project unit             # one project: unit | component | integration
npm run test:e2e             # Playwright: fresh PGlite DB + fixed FX rate, builds, serves on :3100 (desktop + 375px)
npm run typecheck            # runs `next typegen` first: LayoutProps/PageProps are generated globals
npm run db:generate          # after editing src/db/schema.ts → new SQL in drizzle/
npm run db:migrate           # apply migrations to DATABASE_URL (ask before running against production)
npm run db:seed              # idempotent seed (Qatar category + 18 fixed items + settings)
npm run pin:hash -- <pin>    # prints APP_PIN_HASH and a SESSION_SECRET for the live site
npx shadcn@latest add <component>         # add a shadcn/ui primitive (ask first: it adds dependencies)
```

Only one `next dev` may run per project (Next 16 lockfile). `next build` can run alongside it.

## Architecture

- **Next.js 16 App Router** with `cacheComponents: true`. Any route that reads the DB, `params`, `searchParams`, cookies or the current time must do it inside `<Suspense>` after `await connection()`. Client hooks like `usePathname()` in the layout also need a Suspense boundary (see `src/components/layout/nav.tsx`), otherwise `next build` fails on dynamic routes. Read `node_modules/next/dist/docs/` before using a Next API you haven't checked.
- **`src/app/`** holds route files only (`/`, `/months/[month]`, `/history`, `/analysis`, `/settings`, `/unlock`). They load data through feature queries and render feature components.
- **`src/features/<feature>/`**: `expenses`, `catalog` (categories + items), `currency` (daily rate), `analysis`, `settings`, `pin-lock`. Each has:
  - `queries.ts`: server-only reads that take a `db` argument
  - `mutations.ts`: server-only writes that take a `db` argument; integration-tested on PGlite
  - `actions.ts`: Server Actions that run the guard, validate with Zod, call mutations, then `refresh()`
  - `schemas.ts`: Zod, shared with client forms
  - `components/`

  See `src/features/CLAUDE.md`.

- **Mutation flow:** client components call a Server Action inside `startTransition`, apply `useOptimistic` changes first, and the action's `refresh()` re-renders the page with server data. `src/features/expenses/ledger.ts` (`buildLedger`) is the pure totals function used on both server and client, so optimistic totals match what the server computes.
- **`src/db/`**: the Drizzle schema, and `create-db.ts`, which picks the driver. It uses `neon-http` when `DATABASE_URL` is set, PGlite otherwise. Local PGlite auto-migrates and seeds on first use. `neon-http` has no interactive transactions, so don't use `db.transaction`. See `src/db/CLAUDE.md`.
- **`src/lib/money.ts`** handles integer minor units, QAR↔PKR conversion with BigInt scaled rates (half-up), and `formatMoney()`. **`src/lib/dates.ts`** handles `YYYY-MM` / `YYYY-MM-DD` keys in `Asia/Qatar`. Servers run in UTC, so never derive "today" or "this month" from Date getters.
- **Currency model:** every expense stores its own `pkr_per_qar` plus `amount_qar_minor` and `amount_pkr_minor`, computed once at save. Totals are plain sums, so past months never change. Today's rate comes from open.er-api.com, cached per day in `fx_rates`, with a stale fallback. `FX_PROVIDER=fixed` is for tests and offline use.
- **Navigable months:** from `settings.start_month` (2026-12) up to the current month in Qatar time (`features/settings/range.ts`). Expense dates must fall inside that range.
- **PIN lock:** off unless `APP_PIN_HASH` is set. `src/proxy.ts` redirects locked requests to `/unlock`, and every Server Action also calls `requireUnlocked()`. The hash format is `scrypt:<salt>:<hash>` with no `$`, because `.env` loading expands `$VARS`.
- **UI:** shadcn/ui (radix-nova) primitives in `src/components/ui/` (excluded from Prettier) and Recharts via `components/ui/chart`. Theme tokens and the category palette are in `src/app/globals.css`. The light/dark theme is applied before paint by the inline script in `layout.tsx`; next-themes is deliberately not used because it triggers React 19 script warnings. Category colors are palette keys (`src/lib/palette.ts`) that were validated for colour-blind separation, so don't add colours casually.

## Rules that are easy to get wrong

- Money is **never** a float. Store and sum integer minor units, and format only at display time.
- Every Server Action validates input with Zod and calls `requireUnlocked()` first.
- Deleting an expense is a soft delete (`deleted_at`) so Undo works. Every query filters `deleted_at IS NULL`.
- Archive categories and items rather than deleting them, so past months keep their history.
- Tests never touch Neon or the network. Integration tests use in-memory PGlite (`src/test/db.ts`); e2e uses `.data/pglite-e2e` with a fixed rate of 76.5. Desktop and mobile e2e runs share one DB, so assert relative changes.
- Ask before:
  - adding or upgrading dependencies
  - schema changes and migrations
  - anything against the production Neon branch
  - deploying to Vercel
  - changing the FX source, rounding, or the PIN mechanism
- Never read or commit `.env*` values. `.env.example` documents the variables.
