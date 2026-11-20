# Todo

Phases follow `SPEC.md` §9. Each phase ended with `npm run check` and the e2e suite green.

## Phase 0: Scaffold & tooling ✅

- [x] Next.js 16 app (TypeScript, Tailwind 4, ESLint, App Router, `src/`)
- [x] shadcn/ui (radix-nova), Prettier + Tailwind plugin, eslint-config-prettier
- [x] Vitest (unit / component / integration projects) + Testing Library
- [x] Playwright (desktop + 375 px), runs on a production build at :3100
- [x] `CLAUDE.md` (root, `src/features`, `src/db`), `.claude/settings.json`, `.env.example`
- [x] `git init`, task list, ADR 0001

## Phase 1: Data layer ✅

- [x] Dependencies: drizzle-orm, drizzle-kit, @neondatabase/serverless, @electric-sql/pglite, zod, server-only, tsx
- [x] `src/lib/money.ts` (10,000 PKR @ 76.50 → 13,072 QAR minor units) and `src/lib/dates.ts` (Asia/Qatar month boundaries)
- [x] Schema + first migration, Neon/PGlite client, idempotent seed (Qatar + 18 fixed items)
- [ ] **You:** create a Neon project with a `dev` branch, set `DATABASE_URL` in `.env.local`, run `npm run db:migrate && npm run db:seed`

## Phase 2: Month view ✅

- [x] `/` shows the current month; `/months/[month]`; switcher bounded by the start month
- [x] Ledger with item / category / grand totals, animated running total, change vs last month
- [x] Add / edit dialog (Zod-validated Server Actions), optimistic totals, save-and-add-another
- [x] Delete with Undo toast (soft delete)
- [x] Recurring items: last month's amount offered with Confirm / Change amount
- [x] E2E: add → totals → reload persists; delete + undo; validation

## Phase 3: PKR support ✅

- [x] open.er-api.com rate, cached per day in `fx_rates`, stale fallback, manual override
- [x] Currency per entry (default from settings), both amounts stored, rate locked per expense
- [x] QAR/PKR totals toggle (shared by month, history, analysis)
- [x] Tests: conversion, rate cache/fallback, E2E PKR entry

## Phase 4: Categories & items ✅

- [x] Settings: add / rename / recolour / reorder / archive / restore categories and items; "every month" and "same amount" switches
- [x] Default entry currency and totals currency
- [x] E2E: new category + item appears on the month; archiving hides an item

## Phase 5: History & analysis ✅

- [x] History: month total, entries, change vs previous, total tracked and monthly average
- [x] Analysis: KPI strip, paired bars per item, category donut, monthly trend, breakdown table
- [x] Unit + integration tests for aggregations; E2E pages render
- [x] Palette validated for colour-blind separation (light and dark)

## Phase 6: Lock & deploy

- [x] PIN gate in `src/proxy.ts` + `requireUnlocked()` in every action, 30-day signed cookie, 5 tries then 15-minute lockout
- [x] Verified on a production build: redirect, wrong PIN, unlock, "Lock this device"
- [ ] **You:** Neon `main` branch, Vercel project and environment variables (steps in README → "Put it on Vercel")
- [ ] Live smoke test after the first deploy

## Open choices (defaults applied, see SPEC §10)

- Extra fixed items (Kahramaa, internet, Karwa, food delivery, gym, subscriptions, money sent home…): none added; add any in Settings
- Only "Qatar" is seeded; add Pakistan / Saudi in Settings
