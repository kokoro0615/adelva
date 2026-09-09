"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { prefersMotion } from "@/lib/motion";

/**
 * Route change choreography and activation feedback.
 *
 * Three separate jobs, deliberately kept out of every link so navigation
 * correctness is never routed through a component wrapper:
 *
 *  1. Activation — a document-level listener marks the control the reader just
 *     activated, so a click or an Enter key is acknowledged immediately instead
 *     of leaving the page looking inert. The audited target has no pressed or
 *     pending state at all.
 *  2. Pending — a determinate-looking progress rule reports that a navigation
 *     is in flight. It never blocks input.
 *  3. Arrival — a full-viewport plane is painted in the same frame as the new
 *     route and lifts away, so the swap reads as one continuous movement rather
 *     than a cut. Browser back/forward produce the same arrival because they
 *     also change `pathname`; a cold load does not, because the hero entrance
 *     already owns that moment.
 *
 * Nothing here intercepts or delays the navigation itself: `next/link` still
 * performs it, so deep links, modified clicks and history all behave normally.
 */

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Longest a pending indicator may stay up if a navigation never resolves. */
const PENDING_TIMEOUT_MS = 6000;

function isPlainInternalActivation(
  event: MouseEvent,
  anchor: HTMLAnchorElement,
): boolean {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }
  if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }
  // A same-document hash is an in-page move, not a route change.
  return (
    url.pathname !== window.location.pathname || url.search !== window.location.search
  );
}

export function RouteTransition() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  const activated = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [arrivalKey, setArrivalKey] = useState<string | null>(null);

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
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        !isPlainInternalActivation(event, anchor)
      ) {
        return;
      }

      clearPending();
      activated.current = anchor;
      anchor.dataset.activating = "true";
      document.documentElement.dataset.navigating = "true";
      timer.current = setTimeout(clearPending, PENDING_TIMEOUT_MS);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearPending();
    };
  }, [clearPending]);

  // Paint the arrival plane in the same commit as the new route so there is no
  // frame in which the reader sees the new page un-composed.
  useIsomorphicLayoutEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;

    if (previous === null || previous === pathname) {
      return;
    }
    clearPending();
    if (prefersMotion()) {
      setArrivalKey(`${pathname}:${Date.now()}`);
    }
  }, [clearPending, pathname]);

  return (
    <>
      <div className="route-progress" aria-hidden="true" />
      {arrivalKey ? (
        <div
          key={arrivalKey}
          className="route-curtain"
          aria-hidden="true"
          onAnimationEnd={() => setArrivalKey(null)}
        />
      ) : null}
    </>
  );
}
