# Implementation Plan

Derived from `SPEC.md` (approved 2026-11-21). The task checklist lives in `todo.md`.

## Order and why

1. **Data layer before UI.** The money and date rules (minor units, rate stored per expense, Asia/Qatar months) are the parts most expensive to get wrong later, so they're built and tested first.
2. **Month view in QAR only.** This is the core loop (add, see total, remove) and becomes usable on its own.
3. **PKR** is layered on the month view. The schema already stores both amounts from Phase 1, so this phase is UI plus the rate provider.
4. **Categories & items settings** turn the seeded catalogue into something the user controls.
5. **History & analysis** come last because they only read data the earlier phases write.
6. **Lock & deploy** goes last too, because local development has no PIN, and deploying needs the user's Vercel and Neon accounts.

Phases 4 and 5 are independent of each other and could run in parallel after Phase 3.

## Risks

| Risk                                                                                               | Mitigation                                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| PGlite (WASM) inside the Next.js server/build for e2e                                              | Add `@electric-sql/pglite` to `serverExternalPackages` if bundling fails, and verify in Phase 1 with `npm run test:e2e`.      |
| `cacheComponents: true` + DB reads: uncached data must sit inside `<Suspense>`                     | Follow `node_modules/next/dist/docs` cache-components guides, and keep the month data in a Suspense-wrapped server component. |
| Transactions on Neon over HTTP are limited                                                         | Use the Neon WebSocket `Pool` driver (`drizzle-orm/neon-serverless`) wherever a transaction is needed.                        |
| Free FX API coverage or reliability for QAR/PKR                                                    | Cache the rate per day, fall back to the last known rate, and always allow a manual override.                                 |
| Project lives in OneDrive: syncing `node_modules`/`.next` can lock files (EPERM) and slow installs | If it causes trouble, move the repo outside OneDrive (e.g. `C:\dev\expense-tracker`), with git + GitHub as the backup.        |
| Timezone bugs (Vercel runs in UTC)                                                                 | All month logic goes through `lib/dates.ts` with Asia/Qatar, with tests at month boundaries.                                  |

## Checkpoints

At the end of each phase: `npm run check` and `npm run test:e2e` pass, then a demo/review with the user before starting the next phase.
