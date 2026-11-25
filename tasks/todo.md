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

## Change request: other countries on the month page ✅

- [x] "Add a category" box under the month ledger, with one-tap Pakistan / Saudi Arabia when missing
- [x] "Add item" inside each category on the month page (new items show every month)
- [x] A new, empty category shows "No items yet" with the item form open and focused
- [x] Name clashes with an archived category or item say to restore it in Settings
- [x] E2E: add a country and an item from the month page, log an expense in it, totals include it

## Change request: delete a category ✅

- [x] `deleteCategory`: removes the category, its items and all their expenses in one SQL statement
- [x] Confirmation dialog states what goes (items, expenses, total) and offers "Archive instead"
- [x] "Delete category…" in the category menu on the month page and in Settings; Delete on archived categories
- [x] Seed creates Qatar only on first run, so deleting every category doesn't bring it back
- [x] Tests: integration (delete, usage, seed), unit (wording), E2E (cancel, delete, totals, reload)

## Change request: search expenses by category ✅

- [x] `searchExpenses` query: category filter + words matched against category, item and note; exact totals and item breakdown
- [x] Search page with category chips, search box (updates as you type), totals, by-item breakdown, results by month
- [x] "Search" in the main navigation; "See all expenses" in each category's menu on the month page
- [x] Tests: integration (matching, filters, deleted rows, totals), unit (grouping), E2E (Umrah category search, no overflow)

## Change request: today's date and a live month calendar ✅

- [x] Date helpers: calendar weeks (Sunday first), weekday, long date, time to next Qatar midnight
- [x] `useToday`: today in Qatar that updates at midnight and when the tab is shown again; home page refreshes into a new month
- [x] "Today is …" under the month name; calendar card with weekday names, today highlighted, dots on days with spending
- [x] Tapping a day opens Add expense with that date
- [x] Tests: unit (dates, daily totals), E2E (fixed clock: today highlighted, tap a day, dot after adding)

## Change request: highlight today before tracking starts; collapsible categories ✅

- [x] Calendar month rule: today's month before tracking starts, else the viewed month; out-of-range days disabled; Today link on past months
- [x] Category heading toggles collapse/expand; remembered per device
- [x] Tests: unit (calendar month rule), E2E (pre-start highlight, collapse survives reload)

## Change request: install as an app (PWA) ✅

- [x] Manifest: name, short name "Expenses", standalone, start URL `/`, brand colours, icons
- [x] Icons generated from the logo: 192/512 (any), 512 maskable (Android), 180 apple-icon (iPhone)
- [x] iPhone home-screen title; theme colours already follow light/dark
- [x] PIN lock lets the manifest and icons through, so a locked phone can install the app
- [x] Tests: unit (manifest, proxy allows install files but still locks pages), E2E (manifest + icons served as PNGs at the right sizes)

## Open choices (defaults applied, see SPEC §10)

- Extra fixed items (Kahramaa, internet, Karwa, food delivery, gym, subscriptions, money sent home…): none added; add any in Settings
- Only "Qatar" is seeded; add Pakistan / Saudi Arabia with one tap at the bottom of the month page
