import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MonthScreen } from "@/features/expenses/components/month-screen";
import { MonthSkeleton } from "@/features/expenses/components/month-skeleton";
import { formatMonthLabel, isMonthKey } from "@/lib/dates";

export async function generateMetadata({
  params,
}: PageProps<"/months/[month]">): Promise<Metadata> {
  const { month } = await params;
  return { title: isMonthKey(month) ? formatMonthLabel(month) : "Month" };
}

export default function MonthPage({ params }: PageProps<"/months/[month]">) {
  return (
    <Suspense fallback={<MonthSkeleton />}>
      <MonthFromParams params={params} />
    </Suspense>
  );
}

async function MonthFromParams({
  params,
}: Pick<PageProps<"/months/[month]">, "params">) {
  const { month } = await params;
  if (!isMonthKey(month)) notFound();
  return <MonthScreen month={month} />;
}
