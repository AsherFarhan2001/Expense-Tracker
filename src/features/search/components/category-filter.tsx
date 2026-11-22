import { X } from "lucide-react";
import Link from "next/link";
import type { CatalogCategory } from "@/features/expenses/types";
import { categoryColor } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { searchHref } from "../params";

type CategoryFilterProps = {
  categories: readonly Pick<
    CatalogCategory,
    "id" | "name" | "color" | "archived"
  >[];
  selectedId: string | null;
  query: string;
};

/** One chip per category; tapping the selected one clears it. Archived ones come last. */
export function CategoryFilter({
  categories,
  selectedId,
  query,
}: CategoryFilterProps) {
  const ordered = [
    ...categories.filter((c) => !c.archived),
    ...categories.filter((c) => c.archived),
  ];
  if (ordered.length === 0) return null;

  return (
    <nav aria-label="Categories">
      <ul className="flex flex-wrap gap-2">
        {ordered.map((category) => {
          const selected = category.id === selectedId;
          return (
            <li key={category.id}>
              <Link
                href={searchHref({
                  category: selected ? null : category.id,
                  q: query,
                })}
                replace
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected &&
                    "border-transparent bg-foreground text-background hover:bg-foreground/85",
                  category.archived && !selected && "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ background: categoryColor(category.color) }}
                />
                {category.name}
                {category.archived && (
                  <span className="sr-only"> (archived)</span>
                )}
                {selected && <X aria-hidden="true" className="size-3.5" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
