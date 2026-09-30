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
    pathname === "/services/management-operations" ||
    pathname === "/services/revenue-brand" ||
    pathname === "/services/dx-it-procurement" ||
    pathname === "/approach" ||
    pathname === "/contact" ||
    pathname === "/contact/thanks"
    ? children
    : legacy;
}
