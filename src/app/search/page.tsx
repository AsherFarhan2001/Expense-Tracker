import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from "@/db/client";
import { getCatalog } from "@/features/expenses/queries";
import { CategoryFilter } from "@/features/search/components/category-filter";
import { SearchBox } from "@/features/search/components/search-box";
import {
  SearchMessage,
  SearchResultsView,
} from "@/features/search/components/search-results";
import { parseSearchTerms } from "@/features/search/params";
import { SEARCH_ROW_LIMIT, searchExpenses } from "@/features/search/queries";
import { DisplayCurrencyToggle } from "@/features/settings/components/display-currency-toggle";
import { getSettings } from "@/features/settings/queries";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const requested = typeof params.category === "string" ? params.category : "";

  const db = await getDb();
  const [settings, catalog] = await Promise.all([
    getSettings(db),
    getCatalog(db),
  ]);
  const currency = settings.displayCurrency;
  // Unknown or deleted category ids are simply ignored.
  const category = catalog.find((c) => c.id === requested) ?? null;
  const terms = parseSearchTerms(query);
  const results =
    category || terms.length > 0
      ? await searchExpenses(db, { categoryId: category?.id, terms })
      : null;

  const words = terms.length > 0 ? `“${terms.join(" ")}”` : "";
  const title = category
    ? words
      ? `${category.name}: ${words}`
      : category.name
    : words;
  const emptyTitle = category
    ? words
      ? `Nothing in ${category.name} matches ${words}`
      : `Nothing logged in ${category.name} yet`
    : `Nothing matches ${words}`;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Search
          </h1>
          <p className="text-muted-foreground">
            Find expenses from every month by category, item or note.
          </p>
        </div>
        <DisplayCurrencyToggle value={currency} />
      </header>

      <div className="grid gap-4">
        <SearchBox initialQuery={query} categoryId={category?.id ?? null} />
        <CategoryFilter
          categories={catalog}
          selectedId={category?.id ?? null}
          query={query}
        />
      </div>

      {results ? (
        <SearchResultsView
          results={results}
          currency={currency}
          title={title}
          emptyTitle={emptyTitle}
          rowLimit={SEARCH_ROW_LIMIT}
        />
      ) : (
        <SearchMessage title="Pick a category or type what you're looking for">
          Results include every month, with the total and a breakdown by item.
        </SearchMessage>
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading search">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-8 w-72 rounded-full" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
