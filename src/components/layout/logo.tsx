import { cn } from "@/lib/utils";

/** Maroon tile with a serrated edge — a nod to the Qatar flag and a torn receipt. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <path
        d="M4 4h4l2 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2H4z"
        className="fill-primary-foreground"
      />
    </svg>
  );
}
