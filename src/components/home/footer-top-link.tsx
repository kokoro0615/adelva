"use client";

import type { ReactNode } from "react";

/** An immediate jump also lets the existing focus listener synchronize Lenis. */
export function FooterTopLink({ children }: { children: ReactNode }) {
  return (
    <a
      href="#main-content"
      aria-label="ページの先頭へ戻る"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const main = document.getElementById("main-content");
        if (!main) return;
        event.preventDefault();
        if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
        main.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      {children}
    </a>
  );
}
