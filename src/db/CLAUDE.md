# Database (Drizzle + PostgreSQL)

- `schema.ts` is the only place tables are defined. To change the schema: edit `schema.ts`, run `npm run db:generate`, review the SQL in `drizzle/`, commit both. **Ask the user before any schema change.**
- Never edit a migration in `drizzle/` once it has been applied anywhere. Add a new one instead.
- `npm run db:migrate` and `npm run db:seed` run against whatever `DATABASE_URL` points to. Confirm it's the Neon **dev** branch, and never run them against production without asking.
- Money columns are `bigint` minor units (`amount_minor`, `amount_qar_minor`, `amount_pkr_minor`). Rates are `numeric(18,6)` (`pkr_per_qar`). No `real`/`double precision` for money.
- `expenses.spent_on` is a `date` (calendar day in Asia/Qatar), not a timestamp.
- Soft delete: `expenses.deleted_at`. Every read filters `deleted_at IS NULL`; indexes are partial on that condition.
- Archive, don't delete, categories and items (`archived_at`), so past months keep their history.
- `client.ts` picks the driver from `DATABASE_DRIVER`: `neon` (default) or `pglite` (tests and e2e). Both are real Postgres, so write plain Drizzle queries and avoid driver-specific APIs.
- `seed.ts` must be idempotent (upsert by name), so it is safe to run repeatedly.
