import {
  BarChart3,
  CalendarDays,
  History,
  Search,
  Settings,
} from "lucide-react";

export const NAV_LINKS = [
  { href: "/", label: "This month", icon: CalendarDays },
  { href: "/history", label: "History", icon: History },
  { href: "/search", label: "Search", icon: Search },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/months/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
