import { Skeleton } from "@/components/ui/skeleton";

export function MonthSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12"
      aria-busy="true"
      aria-label="Loading month"
    >
      <div className="grid content-start gap-6">
        <div className="flex justify-between">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-14 w-56" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.06]">
        <Skeleton className="h-7 w-40" />
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
