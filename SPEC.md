# Spec: Expense Tracker (Qatar · QAR/PKR)

Status: **Approved 2026-11-21 · Built (Phases 0–6) · Live** at https://expense-tracker-personal-bice.vercel.app (Vercel Hobby, functions in Frankfurt `fra1`; Neon Free via the Vercel integration, Frankfurt). Last updated: 2026-11-25

> **Changes made while building** (decisions differ from the draft below where noted):
>
> - Local development needs no setup: without `DATABASE_URL` the app uses a local PGlite database in `.data/pglite`, auto-migrated and seeded. Neon is used whenever `DATABASE_URL` is set.
> - Production driver is `drizzle-orm/neon-http` (no interactive transactions).
> - Dropped `react-hook-form`, `date-fns` and `next-themes`: forms are small controlled components validated with the shared Zod schemas, dates use `Intl` with `Asia/Qatar`, and the theme uses a pre-paint inline script.
> - Category palette keys are `maroon, teal, amber, indigo, olive, rose, sky, coral, violet, brown`, validated for colour-blind separation in light and dark.
> - PIN hash format is `scrypt:<salt>:<hash>`, with no dollar signs, because `.env` loading would expand them as variables.
> - The home page (`/`) shows the current month directly instead of redirecting; while December 2026 is still ahead, it shows December.
> - 2026-11-21: categories for other countries (Pakistan, Saudi Arabia) and their items can now be added directly on the month page, not only in Settings (story 6).
> - 2026-11-21: a category can be **deleted permanently** (with its items and all their expenses) after a confirmation that shows what will be removed. Archive stays the gentle option (story 6). The seed now creates Qatar only on first run, so deleting every category doesn't bring it back.
> - 2026-11-21: new **Search** page (story 10): every expense of one category (e.g. _Umrah_) or matching a word, across all months, with totals.
> - 2026-11-21: the month page shows **today's date** and a **live calendar** of the month in the left column (story 11).
> - 2026-11-21: before tracking starts, the calendar shows **today's month** so today is always highlighted on the home page; categories on the month page can be **collapsed and expanded** (story 12).
> - 2026-11-25: deployed. Neon was created from Vercel's Storage tab (one `main` branch); local development stays on PGlite, so there is no Neon `dev` branch. The Vercel project's Framework Preset must be **Next.js** (it was auto-set to "Other" because the repo held only a README at import).
> - 2026-11-25: the app is an **installable web app (PWA)** (story 13): web app manifest, app icons generated from the logo, iPhone home-screen title. No service worker and no offline mode: the data lives in Neon, so the app needs a connection anyway.

## 1. Objective

A personal web app to record and review monthly spending while living in Qatar, starting **December 2026**.

|                       |                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Outcome**           | Each month opens with my usual expense items ready; I log each expense as it happens and always see the running total.                                 |
| **User**              | One person (the owner). No accounts, no sharing.                                                                                                       |
| **Why**               | Know where the money goes each month — in Qatar and for spending tied to Pakistan, Saudi Arabia, etc. — and compare month to month.                    |
| **Success**           | Logging an expense takes seconds; totals are always correct; any past month can be opened and compared with charts.                                    |
| **Constraint**        | Web app first (Next.js + React), hosted on Vercel, data in PostgreSQL. Mobile app comes later, so logic must not be locked inside UI components.       |
| **Out of scope (v1)** | Native mobile app, multiple users/sign-up, bank/SMS import, receipt photos, budgets & alerts, currencies other than QAR/PKR, offline mode, CSV export. |

### User stories & acceptance criteria

1. **Monthly screen with fixed items** — Every month shows the fixed item list (seeded below), even before anything is logged.
   - Items marked _same amount every month_ (Accommodation, Mobile Package) show last month's amount as a pending suggestion with **Confirm / Edit**. Nothing is recorded until confirmed.
2. **Add an expense** — Pick an item, enter amount, choose **QAR or PKR** (pre-selected from the default currency setting), date (defaults to today, must fall in the viewed month), optional note.
   - Each occurrence is its own dated entry (e.g. _Uber · 12 Dec · 25 QAR_). Items show their running monthly total.
3. **Remove / edit an expense** — Deleting removes it immediately with an **Undo** toast (~5 s). Editing updates in place.
4. **Live totals** — Item totals, category subtotals and the month's grand total update instantly on add/edit/delete (optimistic UI), and persist after refresh.
5. **Currency** — Every expense is entered in QAR or PKR. On save, the app looks up that day's PKR-per-QAR rate (editable before saving) and stores it with the expense, plus the amount in both currencies. The month has **one grand total**, viewable in QAR (default) or PKR via a toggle. Changing rates later never changes past totals.
6. **Custom categories (other countries)** — User can add categories for spending in other countries (e.g. _Pakistan_, _Saudi Arabia_) or anything else, and add their own items ("fields") inside each one. Any item can be marked _fixed_ (appears every month). All categories count toward the month total and appear in history and analysis.
   - Both can be done **straight from the month page**: an _Add a category_ box under the ledger (with one-tap _Pakistan_ and _Saudi Arabia_ when they don't exist yet) and an _Add item_ action inside every category. Items added there show every month. Settings keeps the full editor (rename, recolour, reorder, archive, flags).
   - **Remove a category:** _Archive_ hides it from new months and keeps its history. _Delete_ (category menu on the month page or in Settings, including archived ones) wipes the category, its items and every expense logged under it, from all months, History and Analysis. It asks first, stating how many items and expenses (and their total) will go, and offers _Archive instead_ when there are expenses. It can't be undone.
7. **History** — A list of every month since December 2026 with total, number of entries, and change vs the previous month. Clicking opens that month (past months stay editable).
8. **Analysis** — For a selected month:
   - **Item comparison:** each item, this month vs previous month (grouped bars + table with Δ and Δ%).
   - **Category share:** donut chart of the month's spending by category.
   - **Trend:** monthly totals over time since December 2026.
   - Biggest increases / decreases vs previous month.
   - All charts respect the QAR/PKR toggle.
9. **Lock on the live site** — The deployed app asks for a PIN (no account, no email) on a new device/browser, then remembers that device for 30 days. No PIN in local development.
10. **Search** — A _Search_ page (in the main navigation) finds expenses across **all months**:
    - Pick a category (e.g. _Umrah_) to see only its expenses, and/or type words. Each word must match the category, item or note (case-insensitive), e.g. "umrah hotel".
    - Shows the total (QAR/PKR toggle), number of expenses, the months they span, a breakdown by item, and the expenses grouped by month, newest first. Each month links to that month's page for editing.
    - The search lives in the URL (`/search?category=…&q=…`), so a search can be bookmarked or reopened. Each category's ⋯ menu on the month page has _See all expenses_, which opens it.
    - Shows the latest 500 matching expenses; totals and the item breakdown always cover every match.
11. **Today and the month calendar** — The left column of the month page shows:
    - **Today's date** in Qatar time under the month name (e.g. "Today is Saturday, 21 November 2026"), on every month page.
    - A **calendar of the month being viewed**: weekday names (week starts on Sunday, the Qatari work week; Friday and Saturday shown as the weekend) and every date. Today is highlighted when it's in that month. Days with expenses show a dot, and hovering or a screen reader gives that day's total. Tapping a day opens _Add expense_ with that date filled in.
    - It is **live**: today's date and highlight move at Qatar midnight and when the tab comes back into view, and the home page switches to the new month when a month begins.
    - **Before tracking starts** (until 1 December 2026) the home page lists December, but the calendar shows **today's month with today highlighted**; its days are greyed out with a note saying when tracking starts.
    - On a **past month**, the calendar shows that month and a _Today_ link back to the current month.
12. **Collapse categories** — Each category heading on the month page is a toggle (chevron + name) that hides or shows its items. Its total, share and menu stay visible while collapsed. Collapsed categories are remembered on that device (browser storage) and apply to every month.
13. **Install as an app** — The site can be added to the phone's home screen and opens full-screen like an app (no browser bar):
    - Name "Expense Tracker", short name **"Expenses"** under the icon.
    - The icon is the logo (maroon tile with the serrated white band) at the sizes phones and desktops expect, including an Android "maskable" version that survives circle/squircle cropping and a 180 px iPhone icon.
    - The install files (manifest and icons) load **without the PIN**, so a locked phone can still install it; every page stays behind the PIN.
    - Updates arrive with each deploy; there is no store and no offline mode.

### Seed data

Category **Qatar** with these fixed items (in this order):

Mobile Package\*, Accommodation\*, Breakfast, Lunch, Dinner, Tea, Water, Eggs/Bread, Fruits, Frozen items, Grocery, Misc drinks/chips, Restaurant, Uber, Metro, Shopping, Outing, Haircut

\* _same amount every month_ (pre-filled from last month).

Settings: default entry currency **QAR**, display currency **QAR**, start month **2026-12**.

## 2. Tech Stack

Latest stable versions as of 2026-11-21; exact versions are pinned in `package.json` at scaffold time.

| Concern                  | Choice                                                                                        | Version                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Runtime                  | Node.js                                                                                       | 22.x (installed: 22.15.0)                                                  |
| Framework                | Next.js (App Router, Server Components, Server Actions, Turbopack)                            | 16.4.x                                                                     |
| UI library               | React                                                                                         | 19.3.x                                                                     |
| Language                 | TypeScript, `strict: true`                                                                    | as installed by `create-next-app` (TS 7 compatibility checked at scaffold) |
| Styling                  | Tailwind CSS                                                                                  | 4.3.x                                                                      |
| Components               | shadcn/ui (Radix primitives), lucide-react icons, sonner toasts                               | latest                                                                     |
| Charts                   | Recharts (via shadcn chart components)                                                        | 3.11.x                                                                     |
| Validation               | Zod                                                                                           | 4.6.x                                                                      |
| Dates                    | `Intl` APIs (all month logic in `Asia/Qatar`)                                                 | built in                                                                   |
| Database                 | PostgreSQL on **Neon** (via Vercel Marketplace)                                               | —                                                                          |
| ORM / migrations         | Drizzle ORM + drizzle-kit                                                                     | 0.45.x / 0.31.x                                                            |
| DB drivers               | `@neondatabase/serverless` (dev + prod), `@electric-sql/pglite` (tests, optional offline dev) | 1.2.x / 0.5.x                                                              |
| Unit / integration tests | Vitest + Testing Library (jsdom)                                                              | 5.1.x                                                                      |
| E2E tests                | Playwright                                                                                    | 1.65.x                                                                     |
| Hosting                  | Vercel                                                                                        | —                                                                          |
| Package manager          | npm                                                                                           | 10.x                                                                       |

**Databases:** Neon branch `main` = production; Neon branch `dev` = local development when `DATABASE_URL` is set, otherwise a local PGlite file; PGlite (in-process Postgres) = automated tests, so tests need no network and never touch real data.

**Exchange rates:** `open.er-api.com` (free, no key, covers QAR→PKR; attribution shown in Settings). Rates are cached per day in the DB; if the fetch fails the last cached rate is used; the user can always override the rate manually.

## 3. Commands

```bash
npm install                     # install dependencies
npm run dev                     # dev server at http://localhost:3000
npm run build                   # production build
npm run start                   # serve the production build
npm run lint                    # eslint .
npm run lint:fix                # eslint . --fix
npm run typecheck               # tsc --noEmit
npm run format                  # prettier --write .
npm test                        # vitest run (unit + integration, PGlite)
npx vitest run src/lib/money.test.ts            # single test file
npx vitest run -t "converts PKR to QAR"         # single test by name
npm run test:watch              # vitest (watch mode)
npm run test:e2e                # playwright test (starts dev server on PGlite)
npm run db:generate             # drizzle-kit generate  → new SQL migration in drizzle/
npm run db:migrate              # drizzle-kit migrate   → apply to DATABASE_URL
npm run db:seed                 # tsx scripts/seed.ts   → idempotent seed
npm run db:studio               # drizzle-kit studio    → browse data
npm run check                   # lint + typecheck + test (run before every commit)
```

Environment variables (documented in `.env.example`; real values only in `.env.local` / Vercel):

| Variable          | Purpose                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`    | Neon connection string (dev branch locally, main branch on Vercel)          |
| `DATABASE_DRIVER` | optional override: `neon` or `pglite` (default: neon if `DATABASE_URL` set) |
| `PGLITE_DIR`      | PGlite data dir when `DATABASE_DRIVER=pglite` (e.g. `.data/pglite`)         |
| `APP_PIN_HASH`    | scrypt hash of the PIN. **Unset = lock disabled** (local dev)               |
| `SESSION_SECRET`  | Secret for signing the 30-day device cookie                                 |

## 4. Project Structure

Organized so both humans and Claude Code can find things fast: route files are thin, each feature lives in one folder, and rules live next to the code they govern (nested `CLAUDE.md` files load automatically when Claude works in that folder).

```
Expense-Tracker/
├── CLAUDE.md                  → Claude's entry point: commands, architecture, rules (points to SPEC.md)
├── SPEC.md                    → this file — source of truth for scope
├── .claude/
│   ├── settings.json          → shared permissions (allow npm scripts, deny reading .env*)
│   └── commands/              → project slash commands (added as workflows emerge)
├── docs/
│   └── decisions/             → short ADRs, e.g. 0001-postgres-on-neon.md
├── tasks/
│   ├── plan.md                → implementation plan (from approved spec)
│   └── todo.md                → task checklist
├── drizzle/                   → generated SQL migrations (committed, never hand-edited once applied)
├── e2e/                       → Playwright specs
├── scripts/
│   └── seed.ts                → idempotent seed (Qatar category + fixed items + settings)
├── public/
└── src/
    ├── app/                   → routes only: load data via feature queries, render feature components
    │   ├── layout.tsx
    │   ├── manifest.ts                → PWA manifest (/manifest.webmanifest)
    │   ├── icon.tsx, apple-icon.tsx   → app icons generated from the logo (/icon/192, /icon/512, /apple-icon)
    │   ├── maskable-icon.png/route.tsx → Android maskable icon
    │   ├── page.tsx                   → redirects to current month (Asia/Qatar)
    │   ├── months/[month]/page.tsx    → month view, month = YYYY-MM
    │   ├── history/page.tsx
    │   ├── analysis/page.tsx          → ?month=YYYY-MM
    │   ├── search/page.tsx            → ?category=<id>&q=words
    │   ├── settings/page.tsx          → categories, items, currency defaults
    │   └── unlock/page.tsx            → PIN screen
    ├── features/              → one folder per feature (see src/features/CLAUDE.md)
    │   ├── expenses/          → components/, actions.ts, queries.ts, schemas.ts, *.test.ts
    │   ├── catalog/           → categories + items management
    │   ├── currency/          → rate fetch + cache, currency toggle
    │   ├── analysis/          → aggregations + chart components
    │   ├── search/            → cross-month expense search + results
    │   └── pin-lock/          → PIN verify, cookie, guard
    ├── components/
    │   ├── ui/                → shadcn/ui generated primitives
    │   └── layout/            → app shell, nav, month switcher
    ├── db/
    │   ├── CLAUDE.md          → schema & migration rules
    │   ├── schema.ts          → Drizzle tables
    │   ├── client.ts          → returns Neon or PGlite Drizzle client from env
    │   └── seed-data.ts
    ├── lib/
    │   ├── money.ts           → minor units, conversion, formatting
    │   └── dates.ts           → month keys & bounds in Asia/Qatar
    └── proxy.ts               → Next.js 16 request proxy: enforces PIN cookie when APP_PIN_HASH is set
```

### Data model

```
categories   id · name (unique, case-insensitive) · color · sort_order · archived_at · created_at
items        id · category_id → categories · name (unique per category) · is_fixed · amount_mode ('variable' | 'recurring')
             · sort_order · archived_at · created_at
expenses     id · item_id → items · spent_on (date, Asia/Qatar) · amount_minor (bigint) · currency ('QAR' | 'PKR')
             · pkr_per_qar (numeric 18,6) · rate_source ('auto' | 'manual')
             · amount_qar_minor (bigint) · amount_pkr_minor (bigint) · note · deleted_at · created_at · updated_at
             indexes: (spent_on) where deleted_at is null · (item_id, spent_on)
fx_rates     rate_date (pk) · pkr_per_qar · source · fetched_at
settings     single row: default_currency · display_currency · start_month
pin_attempts window_start · failed_count   (rate-limits PIN guesses on the live site)
```

Rules baked into the model:

- Money is stored as **integer minor units** (1 QAR = 100 dirham, 1 PKR = 100 paisa). Never floats.
- Both converted amounts are computed **once at save time** with the stored rate, so totals in either currency are plain sums and history never shifts.
- Archiving an item/category hides it from future months; past months still show its entries.
- Deleting a category (only after the confirmation dialog) removes it, its items and their expenses in **one SQL statement**, so it never half-finishes (the production driver has no transactions).
- A month view shows: all active fixed items + any item that has entries in that month.

## 5. Code Style

Representative Server Action — validation at the boundary, money in minor units, thin and testable:

```ts
// src/features/expenses/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { getPkrPerQar } from "@/features/currency/rates";
import { requireUnlocked } from "@/features/pin-lock/guard";
import { convertMinor, toMinorUnits } from "@/lib/money";
import { monthKey } from "@/lib/dates";
import { addExpenseSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addExpense(input: unknown): Promise<ActionResult> {
  await requireUnlocked();

  const parsed = addExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { itemId, amount, currency, spentOn, note, pkrPerQar } = parsed.data;
  const rate = pkrPerQar ?? (await getPkrPerQar(spentOn));
  const amountMinor = toMinorUnits(amount);

  await db.insert(expenses).values({
    itemId,
    spentOn,
    currency,
    note,
    amountMinor,
    pkrPerQar: rate,
    rateSource: pkrPerQar ? "manual" : "auto",
    amountQarMinor: convertMinor(amountMinor, currency, "QAR", rate),
    amountPkrMinor: convertMinor(amountMinor, currency, "PKR", rate),
  });

  revalidatePath(`/months/${monthKey(spentOn)}`);
  return { ok: true };
}
```

Conventions:

- TypeScript `strict`; no `any`; no non-null assertions to silence errors.
- File names kebab-case (`add-expense-dialog.tsx`); components PascalCase; hooks `use-*.ts`; imports via `@/`.
- Server Components by default; `"use client"` only on interactive leaves (forms, toggles, charts).
- Per feature: reads in `queries.ts` (import `server-only`), writes in `actions.ts` (Server Actions), Zod schemas in `schemas.ts`, shared by client form and server.
- Server Actions return `ActionResult`; they don't throw for user errors. Every action calls `requireUnlocked()`.
- Format money only at the display edge via `formatMoney()`; all maths on integer minor units (rate conversion uses scaled-integer arithmetic in `lib/money.ts`).
- All "which month / today" logic goes through `lib/dates.ts` with `Asia/Qatar` — Vercel servers run in UTC.
- Prettier formatting; ESLint (Next.js config) must pass with zero warnings.

## 6. Testing Strategy

| Level       | Tool                                             | Lives in                     | Covers                                                                                                                                              |
| ----------- | ------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest                                           | next to source (`*.test.ts`) | `lib/money` (parse, convert, round, format), `lib/dates` (month bounds in Asia/Qatar), Zod schemas, analysis calculations (Δ, Δ%, shares)           |
| Integration | Vitest + PGlite                                  | `src/**/*.int.test.ts`       | Queries & actions against real Postgres with migrations applied: month totals, soft delete + undo, archived items, rate locking, recurring pre-fill |
| Component   | Vitest + Testing Library                         | next to component            | Add-expense form validation, currency toggle, optimistic total update                                                                               |
| E2E         | Playwright (Chromium, desktop + 375 px viewport) | `e2e/`                       | Add → totals update → refresh persists; delete + undo; PKR entry; month navigation; analysis renders; PIN gate                                      |

- `npm run check` must pass before every commit; `npm run test:e2e` before deploying.
- Coverage target: ≥ 90 % lines on `src/lib/**` and feature `queries.ts`/`actions.ts`; no hard target on UI.
- Bugs get a failing test first, then the fix.

## 7. Boundaries

**Always**

- Store and calculate money as integer minor units; convert with the rate stored on the expense.
- Validate every Server Action input with Zod and call `requireUnlocked()`.
- Change the schema only via `schema.ts` → `npm run db:generate` → commit the migration.
- Run `npm run check` before committing; keep `SPEC.md` updated when a decision changes.
- Keep `src/app/**` thin; logic lives in `src/features/**` and `src/lib/**`.

**Ask first**

- Adding or upgrading a dependency.
- Any schema change or migration, and running migrations/seeds against the **production** Neon branch.
- Deploying to Vercel or changing Vercel/Neon settings or environment variables.
- Changing the exchange-rate source, rounding rules, or the PIN mechanism.
- Changing anything listed as out of scope.

**Never**

- Commit `.env*` files, connection strings, the PIN or its hash, or `SESSION_SECRET`.
- Use floating-point numbers for stored money or totals.
- Hard-delete user data without explicit confirmation (UI deletes are soft + undo).
- Edit a migration that has already been applied; delete or skip failing tests to get green.
- Point tests at a Neon database.

## 8. Success Criteria

- [ ] Adding an expense updates item, category and grand totals instantly, and the values survive a page refresh.
- [ ] Deleting an expense removes it from all totals instantly; **Undo** within 5 s restores it exactly.
- [ ] Opening a new month (e.g. Jan 2027) lists all fixed items at 0; Accommodation and Mobile Package show last month's amount as a suggestion; nothing is recorded until confirmed.
- [ ] Entering **10,000 PKR** at a rate of **76.50 PKR/QAR** stores **130.72 QAR**; the QAR total includes it; switching to PKR shows 10,000 for that entry.
- [ ] Changing or refreshing today's rate does not change any previous month's totals.
- [ ] Navigation cannot go before December 2026; the home page opens the current month in Qatar time.
- [ ] Analysis shows every item's this-month vs previous-month amount and change; category shares add up to 100 % of the month total; trend shows all months since Dec 2026.
- [ ] A new category ("Pakistan") with its own items can be added, from Settings or directly on the month page; its expenses appear in the month total and in the charts.
- [ ] Archiving an item hides it from future months; past months still show its entries and totals.
- [ ] Deleting a category asks first, then removes it with its items and expenses everywhere; month totals drop by exactly its amount, and the name can be reused.
- [ ] Search for a category (e.g. Umrah) lists every one of its expenses from all months, and its total equals the sum of that category across those months; searching a word matches category, item and note.
- [ ] The month page shows today's date and a calendar of all the month's days with weekday names; today is highlighted when it's in that month (and on the home page before tracking starts); tapping a day opens Add expense on that date.
- [ ] Collapsing a category hides its items but keeps its total; it stays collapsed after a reload on the same device.
- [ ] Works in current Chrome and Edge on desktop and at 375 px width with no horizontal scrolling.
- [ ] The site serves a valid manifest (standalone, start URL `/`, 192 and 512 px icons plus a maskable one) and a 180 px iPhone icon; all of them load on a locked device.
- [ ] Live site requires the PIN on a new device, remembers it for 30 days, and slows down repeated wrong guesses; local dev has no PIN.
- [ ] `npm run check`, `npm run test:e2e` and `npm run build` all pass.

## 9. Implementation Plan (phases)

Each phase ends with a working, tested app and a review point. Detailed tasks go into `tasks/plan.md` / `tasks/todo.md` after this spec is approved.

| #   | Phase                  | Delivers                                                                                                                                                                               | Verify                                                          |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 0   | **Scaffold & tooling** | `create-next-app` (TS, Tailwind, ESLint, App Router, `src/`), shadcn/ui, Prettier, Vitest, Playwright, `git init`, `CLAUDE.md` + nested rules, `.claude/settings.json`, `.env.example` | dev server runs; `npm run check` passes                         |
| 1   | **Data layer**         | Drizzle schema, Neon + PGlite client, first migration, seed, `lib/money` + `lib/dates` with tests                                                                                      | migrate + seed on Neon `dev`; integration tests green on PGlite |
| 2   | **Month view (QAR)**   | Month screen, month switcher, add/edit/delete + undo, live totals, recurring pre-fill                                                                                                  | E2E: add/remove updates totals and persists                     |
| 3   | **PKR support**        | Currency per entry, default currency setting, rate fetch/cache/override, QAR/PKR total toggle                                                                                          | conversion + rate-lock tests; E2E PKR entry                     |
| 4   | **Categories & items** | Settings: add/rename/archive/reorder categories & items, fixed + recurring flags                                                                                                       | E2E: add "Pakistan" category, items appear in month             |
| 5   | **History & analysis** | History list, item comparison, category donut, trend, top changes                                                                                                                      | aggregation tests; E2E charts render                            |
| 6   | **Lock & deploy**      | PIN gate + rate limiting, Neon `main`, Vercel project & env vars (**ask first**)                                                                                                       | E2E PIN flow; live smoke test                                   |

Mobile later: the responsive layout and the feature-module split (queries/actions separate from UI) let a PWA or a native client reuse the same logic without a rewrite.

## 10. Open Questions (defaults apply unless you say otherwise)

1. **Extra fixed items** (Kahramaa bill, internet, Karwa, food delivery, gym, subscriptions, money sent home, committee/BC, charity, …) — _default: none for now; add any time in Settings._
2. **Starting categories** — _default: only "Qatar" is seeded; you add "Pakistan", "Saudi Arabia" yourself (one tap each on the month page)._
3. **Saudi expenses currency** — SAR isn't supported in v1; Saudi items are entered in QAR or PKR. _Default: OK._
4. **Same-amount-every-month items** — _default: Accommodation and Mobile Package only._
5. **PIN on the live site** — _default: yes, at least 6 digits._
6. **Number format** — _default: international grouping (PKR 1,000,000) rather than lakh grouping (PKR 10,00,000)._
