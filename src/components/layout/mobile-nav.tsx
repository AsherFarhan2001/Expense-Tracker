import { Suspense } from "react";
import { ActiveMobileNav, MobileNavLinks } from "./nav";

export function MobileNav() {
  return (
    <Suspense fallback={<MobileNavLinks pathname={null} />}>
      <ActiveMobileNav />
    </Suspense>
  );
}
