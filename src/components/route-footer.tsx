"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Keep the HOME replacement independent of the legacy route footer contract. */
export function RouteFooter({ home, legacy }: { home: ReactNode; legacy: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") return;
    const footer = document.querySelector("[data-home-footer]");
    const utility = document.querySelector(".how-it-works");
    if (!footer || !utility) return;
    const observer = new IntersectionObserver(([entry]) => {
      utility.toggleAttribute("data-footer-visible", entry.isIntersecting);
    });
    observer.observe(footer);
    return () => {
      observer.disconnect();
      utility.removeAttribute("data-footer-visible");
    };
  }, [pathname]);
  return pathname === "/" ? home : legacy;
}
