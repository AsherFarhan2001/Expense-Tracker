"use client";

import { Check, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InlineNameFormProps = {
  initial: string;
  label: string;
  onSave: (name: string) => void;
  onCancel: () => void;
};

/** Small rename form: Enter saves, Escape cancels. */
export function InlineNameForm({
  initial,
  label,
  onSave,
  onCancel,
}: InlineNameFormProps) {
  const [value, setValue] = useState(initial);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name || name === initial) onCancel();
    else onSave(name);
  };
  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-1">
      <Input
        aria-label={label}
        value={value}
        maxLength={40}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        className="h-8 min-w-0 flex-1"
      />
      <Button type="submit" size="icon-sm" aria-label="Save name">
        <Check />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Cancel"
        onClick={onCancel}
      >
        <X />
      </Button>
    </form>
  );
}
