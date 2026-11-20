import type { ReactNode } from "react";

/** Tooltip shell matching popovers; charts pass formatted rows. */
export function ChartTooltipCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-w-44 gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="font-medium">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          {row.color && (
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: row.color }}
              aria-hidden="true"
            />
          )}
          <span className="text-muted-foreground">{row.label}</span>
          <span className="ml-auto font-medium tabular-nums">{row.value}</span>
        </div>
      ))}
      {footer}
    </div>
  );
}
