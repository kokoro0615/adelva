"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep the HOME replacement independent of the legacy route footer contract. */
export function RouteFooter({ home, legacy }: { home: ReactNode; legacy: ReactNode }) {
  const pathname = usePathname();
  return pathname === "/" ? home : legacy;
}
