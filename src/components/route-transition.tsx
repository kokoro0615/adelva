"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { leavesPage } from "@/lib/navigation";

/**
 * Activation and pending feedback for page changes, on every route.
 *
 * Two jobs, deliberately kept out of every link so navigation correctness is
 * never routed through a component wrapper:
 *
 *  1. Activation — a document-level listener marks the link the reader just
 *     followed, so a tap is acknowledged at once instead of leaving the page
 *     looking inert while the next one loads.
 *  2. Pending — the site's orange line runs along the top edge while a
 *     navigation is in flight: a client-side route change until the new
 *     pathname commits, a full document load until the browser replaces the
 *     page. It never covers, dims or blocks anything.
 *
 * The full-viewport arrival curtain this component used to paint belonged to
 * the retired White Desert routes; the ADELVA pages each own their entrance,
 * and a plane lifting over them would hide it.
 *
 * Nothing here intercepts or delays the navigation itself: `next/link` and the
 * browser still perform it, so deep links, modified clicks and history all
 * behave normally.
 */

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Longest a pending indicator may stay up if a navigation never resolves. */
const PENDING_TIMEOUT_MS = 6000;

export function RouteTransition() {
  const pathname = usePathname();
  const activated = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    delete document.documentElement.dataset.navigating;
    if (activated.current?.isConnected) {
      delete activated.current.dataset.activating;
    }
    activated.current = null;
  }, []);

  // Acknowledge the activation itself, before the router has done anything.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || !leavesPage(event, anchor)) {
        return;
      }

      clearPending();
      activated.current = anchor;
      anchor.dataset.activating = "true";
      document.documentElement.dataset.navigating = "true";
      timer.current = setTimeout(clearPending, PENDING_TIMEOUT_MS);
    };

    // A page restored from the back/forward cache must not come back mid-load.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        clearPending();
      }
    };

    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onPageShow);
      clearPending();
    };
  }, [clearPending]);

  // The new route has committed: the line has arrived.
  useIsomorphicLayoutEffect(() => {
    clearPending();
  }, [clearPending, pathname]);

  return <div className="route-progress" aria-hidden="true" />;
}
