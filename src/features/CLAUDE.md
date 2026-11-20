# Feature modules

Each folder here is one feature and owns its UI, data access and validation:

```
features/expenses/
├── components/          → React components ("use client" only on interactive leaves)
├── queries.ts           → reads: `import "server-only"`, take `db: Database` as the first argument
├── mutations.ts         → writes: same rules as queries; integration-tested on PGlite
├── actions.ts           → `"use server"` entry points; each returns ActionResult
├── schemas.ts           → Zod schemas shared by the client form and the action
├── types.ts / *.ts      → plain types and pure logic (e.g. ledger.ts, prepare.ts)
└── *.test.ts(x) / *.int.test.ts
```

- Each action takes `unknown` input and follows the same order:
  1. `await requireUnlocked()`
  2. `schema.safeParse(input)`; return `failFromZod(...)` if it fails
  3. `const db = await getDb()`
  4. call the mutation
  5. `refresh()` from `next/cache`

  User errors come back as `{ ok: false, error, field? }`, not thrown.

- Queries and mutations never call `getDb()` themselves. Taking `db` as an argument is what lets tests pass in an in-memory PGlite.
- Data crossing to the client is plain serialisable objects: amounts as integer minor units, dates as `YYYY-MM-DD` strings, timestamps as ISO strings. Components format amounts with `formatMoney()` or `<Money>`.
- Interactive components use `useOptimistic` and `startTransition(async () => …)`. Keep the optimistic reducer pure and reuse the same pure function the server uses (`buildLedger`, `prepareExpense`).
- A feature may import another feature's `queries`, `mutations`, `actions`, `schemas` or `types`, but not its components' internals. Shared UI goes in `src/components/`.
- A type that a client component needs from a server-only module goes in a plain `types.ts`, e.g. `currency/types.ts`.
- Logic that doesn't need the DB (totals, deltas, shares) is a pure function with unit tests. Keep it out of components.
