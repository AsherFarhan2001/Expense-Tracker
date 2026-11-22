"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_LINKS } from "./nav-links";

type NavProps = { pathname: string | null };

export function DesktopNavLinks({ pathname }: NavProps) {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname !== null && isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              active &&
                "font-medium text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks({ pathname }: NavProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname !== null && isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active && "font-medium text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Reads the pathname at request time; render inside <Suspense> with a pathname={null} fallback. */
export function ActiveDesktopNav() {
  return <DesktopNavLinks pathname={usePathname()} />;
}

export function ActiveMobileNav() {
  return <MobileNavLinks pathname={usePathname()} />;
}
