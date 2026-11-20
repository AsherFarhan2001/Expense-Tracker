"use client";

import { Check } from "lucide-react";
import {
  CATEGORY_COLORS,
  categoryColor,
  type CategoryColor,
} from "@/lib/palette";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
  value: string;
  onChange: (color: CategoryColor) => void;
  label: string;
  className?: string;
};

export function ColorPicker({
  value,
  onChange,
  label,
  className,
}: ColorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {CATEGORY_COLORS.map((color) => {
        const selected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-background transition-shadow focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
              selected && "ring-2 ring-foreground/70",
            )}
            style={{ background: categoryColor(color) }}
          >
            {selected && (
              <Check className="size-3.5 text-white" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
