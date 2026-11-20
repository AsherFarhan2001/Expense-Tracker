# Feature modules

Each folder here is one feature and owns its UI, data access and validation:

```
features/expenses/
├── components/          → React components ("use client" only on interactive leaves)
├── queries.ts           → reads; first line `import "server-only";`
├── actions.ts           → writes; `"use server"`; each export returns ActionResult
├── schemas.ts           → Zod schemas shared by the client form and the action
└── *.test.ts(x) / *.int.test.ts
```

- Actions take `unknown` input and parse it with the schema, then call `requireUnlocked()` (from `pin-lock`), then write and `revalidatePath()` the affected month. User errors come back as `{ ok: false, error }`, not thrown.
- Queries return plain serialisable objects with amounts as integer minor units. Components format them with `formatMoney()`.
- A feature may import another feature's `queries.ts`/`actions.ts`/`schemas.ts`, but never its components' internals. Shared UI goes in `src/components/`.
- Logic that doesn't need the DB (totals, deltas, shares) is a pure function in the feature or in `src/lib/`, with unit tests. Keep it out of components.
