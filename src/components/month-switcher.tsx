import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { addMonths, formatMonthLabel, type MonthKey } from "@/lib/dates";

type MonthSwitcherProps = {
  month: MonthKey;
  range: { min: MonthKey; max: MonthKey };
  /** Builds the link for a month, e.g. (m) => `/months/${m}`. */
  hrefFor: (month: MonthKey) => string;
};

export function MonthSwitcher({ month, range, hrefFor }: MonthSwitcherProps) {
  const previous = addMonths(month, -1);
  const next = addMonths(month, 1);
  const hasPrevious = previous >= range.min;
  const hasNext = next <= range.max;

  return (
    <div className="flex items-center gap-1">
      {hasPrevious ? (
        <Button asChild variant="outline" size="icon-sm">
          <Link
            href={hrefFor(previous)}
            aria-label={`Previous month, ${formatMonthLabel(previous)}`}
          >
            <ChevronLeft />
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon-sm"
          disabled
          aria-label="No earlier months"
        >
          <ChevronLeft />
        </Button>
      )}
      {hasNext ? (
        <Button asChild variant="outline" size="icon-sm">
          <Link
            href={hrefFor(next)}
            aria-label={`Next month, ${formatMonthLabel(next)}`}
          >
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon-sm"
          disabled
          aria-label="No later months"
        >
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}
