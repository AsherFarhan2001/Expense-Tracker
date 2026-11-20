# Todo

Phases follow `SPEC.md` §9. Each phase ends with `npm run check` green and a review with the user.

## Phase 0: Scaffold & tooling ✅

- [x] Next.js 16 app (TypeScript, Tailwind 4, ESLint, App Router, `src/`)
- [x] shadcn/ui (radix-nova), Prettier + Tailwind plugin, eslint-config-prettier
- [x] Vitest (unit / component / integration projects) + Testing Library
- [x] Playwright (desktop + 375 px), runs on a production build at :3100
- [x] `CLAUDE.md` (root, `src/features`, `src/db`), `.claude/settings.json`, `.env.example`
- [x] `git init`, task list, ADR 0001

## Phase 1: Data layer

- [ ] **You:** create a Neon project with a `dev` branch and put its connection string in `.env.local` as `DATABASE_URL`
- [ ] Add dependencies listed in SPEC §2: drizzle-orm, drizzle-kit, @neondatabase/serverless, @electric-sql/pglite, zod, date-fns, @date-fns/tz, server-only, tsx
  - Verify: `npm run check`
- [ ] `src/lib/money.ts`: parse input → minor units, `convertMinor()` with scaled-integer rate, `formatMoney()`
  - Acceptance: 10,000 PKR @ 76.50 → 13,072 QAR minor units; no floats in stored values
  - Verify: `npx vitest run src/lib/money.test.ts`
- [ ] `src/lib/dates.ts`: `monthKey()`, `monthBounds()`, `currentMonthKey()` in Asia/Qatar, start-month clamp (2026-12)
  - Verify: unit tests incl. 23:30 UTC on the last day of a month (already next month in Qatar)
- [ ] `src/db/schema.ts` per SPEC §4 data model + first migration (`npm run db:generate`)
- [ ] `src/db/client.ts` (Neon or PGlite from env) + test helper that creates a migrated PGlite DB
- [ ] `scripts/seed.ts` + `src/db/seed-data.ts`: Qatar category, 18 fixed items, settings row; idempotent
  - Verify: integration test runs the seed twice → same row counts
- [ ] Apply migration + seed to the Neon `dev` branch (ask first)

## Phase 2: Month view (QAR)

- [ ] Month route `/months/[month]`, `/` redirects to the current month, switcher bounded at 2026-12
- [ ] Month query: categories → items → entries, with item/category/grand totals
- [ ] Add / edit expense dialog (Zod-validated Server Action), optimistic totals
- [ ] Delete with Undo toast (soft delete)
- [ ] Recurring items: suggestion from last month with Confirm / Edit
- [ ] E2E: add → totals update → refresh persists; delete + undo

## Phase 3: PKR support

- [ ] Rate provider (verify free API covers QAR/PKR) + daily cache in `fx_rates` + fallback to last rate
- [ ] Currency picker on entry (default from settings), editable rate, both amounts stored
- [ ] QAR/PKR display toggle for totals
- [ ] Tests: conversion, rate lock (past months unchanged), E2E PKR entry

## Phase 4: Categories & items

- [ ] Settings: add / rename / archive / reorder categories and items; fixed + recurring flags
- [ ] Default entry currency and display currency settings
- [ ] E2E: add "Pakistan" category with items → appears in month and totals

## Phase 5: History & analysis

- [ ] History list: month total, entry count, Δ vs previous
- [ ] Analysis: item comparison (grouped bars + table), category donut, trend line, top changes
- [ ] Unit tests for aggregations; E2E charts render

## Phase 6: Lock & deploy

- [ ] PIN gate in `src/proxy.ts` + `requireUnlocked()` in actions, 30-day signed cookie, rate-limited attempts
- [ ] Neon `main` branch, Vercel project, env vars (ask first)
- [ ] E2E PIN flow; live smoke test
