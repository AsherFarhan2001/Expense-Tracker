import { NextResponse, type NextRequest } from "next/server";
import {
  getSessionSecret,
  isPinEnabled,
  SESSION_COOKIE,
} from "@/features/pin-lock/config";
import { verifySessionToken } from "@/features/pin-lock/crypto";

/**
 * Install files (manifest and app icons) must load on a locked device, or a phone can't
 * add the app to its home screen. Generated icon URLs have no file extension, so the
 * matcher below can't skip them.
 */
function isInstallFile(pathname: string): boolean {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname === "/apple-icon" ||
    pathname === "/maskable-icon.png" ||
    pathname.startsWith("/icon/")
  );
}

/**
 * Optimistic PIN check: sends locked devices to /unlock. Server Actions still
 * verify the session themselves (requireUnlocked), since this is only a redirect.
 */
export function proxy(request: NextRequest) {
  if (!isPinEnabled()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname === "/unlock" || isInstallFile(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token, getSessionSecret())) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search =
    pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next.js internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webmanifest)$).*)",
  ],
};
