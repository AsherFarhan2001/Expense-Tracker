import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid place-items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        That address doesn&apos;t match a month or page in your tracker.
      </p>
      <Button asChild>
        <Link href="/">Go to this month</Link>
      </Button>
    </div>
  );
}
