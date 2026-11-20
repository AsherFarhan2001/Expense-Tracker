import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "./logo";
import { ActiveDesktopNav, DesktopNavLinks } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <LogoMark />
          <span>Expense Tracker</span>
        </Link>
        <Suspense fallback={<DesktopNavLinks pathname={null} />}>
          <ActiveDesktopNav />
        </Suspense>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
