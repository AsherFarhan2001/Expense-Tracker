# Database (Drizzle + PostgreSQL)

- `schema.ts` is the only place tables are defined. To change the schema: edit `schema.ts`, run `npm run db:generate`, review the SQL in `drizzle/`, commit both. **Ask the user before any schema change.**
- Never edit a migration in `drizzle/` once it has been applied anywhere. Add a new one instead.
- `npm run db:migrate` and `npm run db:seed` run against whatever `.env.local` points to: Neon if `DATABASE_URL` is set, else local PGlite. Confirm it's the Neon **dev** branch, and never run them against production without asking.
- Driver selection lives in `create-db.ts` (`resolveDriver`): an explicit `DATABASE_DRIVER` wins; otherwise Neon if `DATABASE_URL` is set, else PGlite in `PGLITE_DIR` (default `.data/pglite`). On Vercel without `DATABASE_URL` it throws on purpose.
  - `client.ts` (server-only) wraps it in a lazy singleton. For PGlite it also migrates and seeds on first use.
  - Scripts import `create-db.ts` directly, because `server-only` throws outside React Server Components. To run a script that imports server-only modules, use `node --conditions=react-server --import tsx`.
- Production uses `drizzle-orm/neon-http`, which has **no interactive transactions**. Don't use `db.transaction()`; keep writes single-statement or tolerate sequential updates (as the reorder code does).
- `@electric-sql/pglite` is in `serverExternalPackages` (`next.config.ts`). Bundling breaks its WASM file loading.
- Money columns are `bigint` minor units (`amount_minor`, `amount_qar_minor`, `amount_pkr_minor`), read in `mode: "number"`. Rates are `numeric(18,6)`, read as strings. `sum()` comes back as a string, so wrap it in `Number()`. No `real` or `double precision` for money.
- `expenses.spent_on` is a `date` (`mode: "string"`, calendar day in Asia/Qatar), not a timestamp.
- Soft delete: `expenses.deleted_at`. Every read filters `deleted_at IS NULL`, and the indexes are partial on that condition.
- Archive, don't delete, categories and items (`archived_at`), so past months keep their history. Names are unique case-insensitively (expression indexes on `lower(name)`).
  - Exception: `deleteCategory` permanently removes a category with its items and expenses after the user confirms. Foreign keys are `restrict`, so it deletes all three tables in **one statement** (data-modifying CTEs); never split it into separate deletes, which could leave half the data behind on neon-http.
- `seed.ts` is idempotent and only inserts when nothing exists, so user edits survive re-seeding. The default catalog (Qatar + items) is created only on first run, when the settings row is inserted, so deleting every category doesn't bring Qatar back.
