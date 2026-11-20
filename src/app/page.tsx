import { Suspense } from "react";
import { MonthScreen } from "@/features/expenses/components/month-screen";
import { MonthSkeleton } from "@/features/expenses/components/month-skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<MonthSkeleton />}>
      <MonthScreen month={null} />
    </Suspense>
  );
}
