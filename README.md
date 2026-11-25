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

## The live site

https://expense-tracker-personal-bice.vercel.app asks for your PIN once per device and remembers it for 30 days.

Install it like an app: on iPhone, open it in Safari and tap **Share → Add to Home Screen**; on Android, open it in Chrome and tap **⋮ → Install app**. It opens full-screen and updates itself with every deploy.

## How it's deployed (Vercel + Neon, free plans)

1. The GitHub repository is imported in [Vercel](https://vercel.com/new). In the project settings, **Framework Preset** must be **Next.js** and **Function Region** is **Frankfurt (`fra1`)**, next to the database.
2. The database was created from Vercel → **Storage → Create Database → Neon** (Free, Frankfurt). This adds `DATABASE_URL` to the project.
3. Create the tables and the fixed items once (and run `db:migrate` again before deploying any schema change): put the `DATABASE_URL=…` line in `.env.local`, then run

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   and delete `.env.local` again, so local development goes back to PGlite.

4. Create the PIN values (choose 6–12 digits) and add both printed lines in Vercel → **Settings → Environment Variables** as Secrets:

   ```bash
   npm run pin:hash -- 482916
   ```

5. Every push to `main` deploys automatically. Changing a setting in Vercel needs a new deploy (a push or **Redeploy**) to take effect.

## Quality checks

```bash
npm run check      # lint, typecheck, formatting, unit + integration tests
npm run test:e2e   # browser tests on desktop and phone sizes (first time: npx playwright install chromium)
```

Exchange rates are provided by [Exchange Rate API](https://www.exchangerate-api.com).
