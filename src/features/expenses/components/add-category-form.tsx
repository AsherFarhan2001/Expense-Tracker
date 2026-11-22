"use client";

import { Plus } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory } from "@/features/catalog/actions";
import { missingCountrySuggestions } from "@/features/catalog/suggestions";
import { nextCategoryColor } from "@/lib/palette";

type AddCategoryFormProps = {
  /** Every category, archived ones included (names must stay unique). */
  existing: readonly { name: string; color: string }[];
  onCreated: (id: string) => void;
};

/**
 * "Add a category" box under the month ledger: one tap for Pakistan or
 * Saudi Arabia when they're missing, or any other name.
 */
export function AddCategoryForm({ existing, onCreated }: AddCategoryFormProps) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const suggestions = missingCountrySuggestions(existing.map((c) => c.name));

  const create = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || pending) return;
    startTransition(async () => {
      const result = await createCategory({
        name: trimmed,
        color: nextCategoryColor(existing.map((c) => c.color)),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      onCreated(result.data.id);
      toast.success(`Added ${trimmed}`);
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create(name);
  };

  return (
    <section
      aria-labelledby="add-category-heading"
      className="border-t border-dashed border-foreground/15 pt-6"
    >
      <h2 id="add-category-heading" className="font-semibold tracking-tight">
        Add a category
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep spending in another country, or anything else, in its own section
        with its own items.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={`Add ${suggestion}`}
            onClick={() => create(suggestion)}
          >
            <Plus data-icon="inline-start" />
            {suggestion}
          </Button>
        ))}
        <form
          onSubmit={submit}
          className="flex min-w-60 flex-1 items-center gap-2"
        >
          <label htmlFor="month-new-category" className="sr-only">
            Category name
          </label>
          <Input
            id="month-new-category"
            value={name}
            maxLength={40}
            placeholder={
              suggestions.length > 0 ? "Or type a name" : "e.g. UAE, Family"
            }
            onChange={(e) => setName(e.target.value)}
            className="h-8 min-w-0 flex-1"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!name.trim() || pending}
          >
            Add category
          </Button>
        </form>
      </div>
    </section>
  );
}
