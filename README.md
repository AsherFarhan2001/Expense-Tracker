# Expense Tracker

Personal monthly expense tracker for life in Qatar: fixed monthly items, live totals, QAR/PKR, custom categories, history and month-over-month charts.

- Scope, decisions and plan: [SPEC.md](SPEC.md)
- Progress: [tasks/todo.md](tasks/todo.md)
- Working with Claude Code: [CLAUDE.md](CLAUDE.md)

## Getting started

Requires Node.js 22+.

```bash
npm install
cp .env.example .env.local   # fill in values (database arrives in Phase 1)
npm run dev                  # http://localhost:3000
```

## Quality checks

```bash
npm run check      # lint, typecheck, formatting, unit + component tests
npm run test:e2e   # end-to-end tests (first time: npx playwright install chromium)
```
