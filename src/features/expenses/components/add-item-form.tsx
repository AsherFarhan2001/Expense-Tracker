"use client";

import { Plus, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createItem } from "@/features/catalog/actions";

type AddItemFormProps = {
  categoryId: string;
  categoryName: string;
  /** Start with the form open, e.g. for a category with no items yet. */
  defaultOpen?: boolean;
  /** Focus the name field, e.g. right after the category was created. */
  autoFocus?: boolean;
};

/**
 * Adds an item to a category from the month page. Items added here show every
 * month; the full editor (flags, order, archive) stays in Settings.
 * The form stays open after saving so several items can be added in a row.
 */
export function AddItemForm({
  categoryId,
  categoryName,
  defaultOpen = false,
  autoFocus = false,
}: AddItemFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `month-new-item-${categoryId}`;

  // The new category can render before or after its id arrives, so focus on
  // either.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 text-muted-foreground hover:text-primary"
        aria-label={`Add item to ${categoryName}`}
        onClick={() => {
          setFocusOnOpen(true);
          setOpen(true);
        }}
      >
        <Plus data-icon="inline-start" />
        Add item
      </Button>
    );
  }

  const close = () => {
    setName("");
    setOpen(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    startTransition(async () => {
      const result = await createItem({
        categoryId,
        name: trimmed,
        isFixed: true,
        amountMode: "variable",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
    });
  };

  return (
    <form onSubmit={submit} className="mt-2 flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        New item in {categoryName}
      </label>
      <Input
        ref={inputRef}
        id={inputId}
        value={name}
        maxLength={40}
        autoFocus={focusOnOpen}
        placeholder="New item, e.g. Family support"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
        className="h-8 min-w-0 flex-1"
      />
      <Button type="submit" size="sm" disabled={!name.trim() || pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={`Stop adding items to ${categoryName}`}
        onClick={close}
      >
        <X />
      </Button>
    </form>
  );
}
