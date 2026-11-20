# Expense Tracker

Personal monthly expense tracker for life in Qatar:

- Each month starts with your fixed items already listed.
- Totals update as you add or remove expenses.
- Enter expenses in QAR or PKR, each converted at the day's rate.
- Group spending into your own categories, such as Pakistan or Saudi.
- See past months, and charts comparing each month with the one before.

Further reading:

- Scope, decisions and plan: [SPEC.md](SPEC.md)
- Progress: [tasks/todo.md](tasks/todo.md)
- Working with Claude Code: [CLAUDE.md](CLAUDE.md)

## Run it on your computer

Requires Node.js 22+.

```bash
npm install
npm run dev        # http://localhost:3000
```

No setup is needed. Without a `DATABASE_URL`, the app keeps its data in a local PostgreSQL file (PGlite) in `.data/pglite`, and creates the tables and your 18 fixed items on first start. That folder is git-ignored; copy it to back up your local data.

## Use your Neon database (recommended before going live)

1. Create a free project at [neon.tech](https://neon.tech). Add a branch called `dev` and keep `main` for the live site.
2. Copy `.env.example` to `.env.local`, then set `DATABASE_URL` to the **dev** branch connection string.
3. Create the tables and the fixed items:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Run `npm run dev`. The app now reads and writes Neon.

## Put it on Vercel

1. Push this repository to GitHub and import it in [Vercel](https://vercel.com/new).
2. Run `npm run db:migrate` and `npm run db:seed` once against the Neon **main** branch: temporarily point `DATABASE_URL` in `.env.local` at `main`, run both commands, then point it back at `dev`.
3. Create your PIN lock values (choose 6–12 digits):

   ```bash
   npm run pin:hash -- 482916
   ```

4. In Vercel → Project → Settings → Environment Variables, add:
   - `DATABASE_URL`: the Neon **main** branch connection string
   - `APP_PIN_HASH` and `SESSION_SECRET`: the two lines printed in step 3
5. Deploy. The live site asks for your PIN once per device and remembers it for 30 days.

## Quality checks

```bash
npm run check      # lint, typecheck, formatting, unit + integration tests
npm run test:e2e   # browser tests on desktop and phone sizes (first time: npx playwright install chromium)
```

Exchange rates are provided by [Exchange Rate API](https://www.exchangerate-api.com).
