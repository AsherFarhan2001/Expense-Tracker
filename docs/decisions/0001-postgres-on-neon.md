# 0001: PostgreSQL on Neon, PGlite for tests

- Status: Accepted
- Date: 2026-11-21

## Context

The app is used by one person but will be hosted on Vercel, and a mobile client is planned later. Vercel functions have no persistent disk, so a plain SQLite file can't store data there. Hosted SQLite (Turso) and PostgreSQL were both considered. The data is relational (categories → items → expenses), and the analysis is mostly `SUM … GROUP BY` month, category or item.

## Decision

- PostgreSQL on **Neon**: branch `main` for production and branch `dev` for local development.
- **Drizzle ORM** for schema, queries and SQL migrations (`drizzle/`).
- **PGlite** (in-process Postgres) for automated tests and e2e, selected with `DATABASE_DRIVER=pglite`.
- Money is stored as `bigint` minor units. Each expense stores its PKR-per-QAR rate and both converted amounts.

## Consequences

- Same SQL dialect in production, development and tests, and tests need no network or credentials.
- Two drivers sit behind one `db` client, so code must avoid driver-specific APIs.
- Requires a Neon account; the free plan's limits must be checked when it is created.
- No sign-in, so the live site needs the PIN lock (Phase 6) to keep the data private.
