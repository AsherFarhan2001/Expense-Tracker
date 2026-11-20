// Placeholder until Phase 2, when "/" redirects to the current month.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Expense Tracker</h1>
      <p className="text-muted-foreground">
        Monthly expenses in QAR and PKR, starting December 2026.
      </p>
    </main>
  );
}
