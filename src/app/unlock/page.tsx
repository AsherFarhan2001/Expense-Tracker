import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoMark } from "@/components/layout/logo";
import { safeNextPath } from "@/features/pin-lock/config";
import { UnlockForm } from "@/features/pin-lock/components/unlock-form";

export const metadata: Metadata = { title: "Unlock" };

export default function UnlockPage({ searchParams }: PageProps<"/unlock">) {
  return (
    <div className="mx-auto grid w-full max-w-sm gap-6 py-12 sm:py-20">
      <div className="grid justify-items-start gap-4">
        <LogoMark className="size-10" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Enter your PIN
        </h1>
        <p className="text-muted-foreground">
          Your expenses are private. This device will stay unlocked for 30 days.
        </p>
      </div>
      <Suspense fallback={<UnlockForm next="/" />}>
        <UnlockFormWithNext searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function UnlockFormWithNext({
  searchParams,
}: Pick<PageProps<"/unlock">, "searchParams">) {
  const { next } = await searchParams;
  return <UnlockForm next={safeNextPath(next)} />;
}
