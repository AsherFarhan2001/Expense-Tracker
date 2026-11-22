"use client";

import { Loader2, Search, X } from "lucide-react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { searchHref } from "../params";

const TYPING_PAUSE_MS = 300;

type SearchBoxProps = {
  initialQuery: string;
  /** Kept in the URL while typing, so a chosen category stays selected. */
  categoryId: string | null;
};

/**
 * Updates the results as you type (after a short pause). Enter also works,
 * and without JavaScript it is a plain GET form.
 */
export function SearchBox({ initialQuery, categoryId }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (value: string) => {
    clearTimeout(timer.current);
    startTransition(() => {
      router.replace(searchHref({ category: categoryId, q: value }), {
        scroll: false,
      });
    });
  };

  return (
    <Form
      action="/search"
      replace
      scroll={false}
      role="search"
      className="relative"
    >
      {categoryId && <input type="hidden" name="category" value={categoryId} />}
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <label htmlFor="search-query" className="sr-only">
        Search expenses
      </label>
      <Input
        id="search-query"
        name="q"
        value={query}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Category, item or note, e.g. Umrah"
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => search(value), TYPING_PAUSE_MS);
        }}
        className="h-12 rounded-xl pr-11 pl-11 text-base md:text-base"
      />
      {pending ? (
        <Loader2
          aria-hidden="true"
          className="absolute top-1/2 right-3.5 size-5 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
        />
      ) : (
        query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              search("");
            }}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        )
      )}
    </Form>
  );
}
