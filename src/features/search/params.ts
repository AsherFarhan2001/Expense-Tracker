const MAX_TERMS = 5;
const MAX_TERM_LENGTH = 40;

/**
 * Words from the search box. Every word must match the category, item or
 * note, so "umrah hotel" narrows results rather than widening them.
 */
export function parseSearchTerms(query: string | undefined): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const raw of (query ?? "").trim().split(/\s+/)) {
    const term = raw.slice(0, MAX_TERM_LENGTH);
    const key = term.toLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
    if (terms.length === MAX_TERMS) break;
  }
  return terms;
}

/** Escapes LIKE wildcards so `%`, `_` and `\` in a search match literally. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Link to the search page; empty parts are left out. */
export function searchHref({
  category,
  q,
}: {
  category?: string | null;
  q?: string | null;
}): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q?.trim()) params.set("q", q.trim());
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}
