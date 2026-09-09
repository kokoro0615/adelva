"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** ADELVA compositions own their shell; other routes retain the legacy layout. */
export function RouteShell({
  children,
  legacy,
}: {
  children: ReactNode;
  legacy: ReactNode;
}) {
  const pathname = usePathname();
  return pathname === "/challenges" ||
    pathname === "/challenges/owner" ||
    pathname === "/challenges/owners" ||
    pathname === "/challenges/general-managers" ||
    pathname === "/about" ||
    pathname === "/contact"
    ? children
    : legacy;
}
