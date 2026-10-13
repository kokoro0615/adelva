"use client";

import { useEffect, useRef } from "react";

import { prefersMotion } from "@/lib/motion";

/** An element arrives once its top has risen this far into the screen. */
const ARRIVAL_LINE = 0.92;

/**
 * The footer's arrival: the call rises, and the site's one orange line is drawn.
 *
 * Every page ends differently, and the footer is where all of them land, so it
 * arrives the same way each time: the two lines of the call rise out of their
 * own baseline as they come onto the screen, and when the rule beneath them
 * follows, the orange line is drawn along it towards the circle that opens the
 * conversation. This element is that line; every `[data-arrive]` element in
 * the footer arrives on its own, as it enters, so nothing waits off-beat for
 * something else to scroll in.
 *
 * The footer is complete without this. An element is armed (its arrival state
 * hidden) only after hydration, only while motion is allowed, and only while
 * it is still below the fold, so nothing the reader can already see is ever
 * hidden and shown again (R8). One IntersectionObserver, disconnected once
 * everything has arrived; the gesture itself is CSS transitions on transform.
 *
 * It also owns the colour beyond the end of the document. Most pages leave the
 * root canvas to the body's paper, so on a phone every flick to the end
 * bounced a pale band out from under the near-black footer. While the
 * footer's last row is on screen the root takes the footer's colour instead;
 * at the top the canvas stays whatever the page chose.
 */
export function FooterArrival({ className }: { className?: string }) {
  const line = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const footer = line.current?.closest<HTMLElement>("[data-site-footer]");
    const last = footer?.querySelector<HTMLElement>("[data-footer-end]");
    if (!last || typeof IntersectionObserver === "undefined") {
      return;
    }
    const root = document.documentElement;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        root.dataset.footerEnd = "";
      } else {
        delete root.dataset.footerEnd;
      }
    });
    observer.observe(last);
    return () => {
      observer.disconnect();
      delete root.dataset.footerEnd;
    };
  }, []);

  useEffect(() => {
    const footer = line.current?.closest<HTMLElement>("[data-site-footer]");
    if (!footer || !prefersMotion() || typeof IntersectionObserver === "undefined") {
      return;
    }
    // Already in view (a short page, a reload at the end): leave it settled.
    const pending = [...footer.querySelectorAll<HTMLElement>("[data-arrive]")].filter(
      (element) =>
        element.getBoundingClientRect().top >= window.innerHeight * ARRIVAL_LINE,
    );
    if (pending.length === 0) {
      return;
    }

    for (const element of pending) {
      element.dataset.arrive = "armed";
    }
    let remaining = pending.length;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting && element.dataset.arrive === "armed") {
            element.dataset.arrive = "arrived";
            observer.unobserve(element);
            remaining -= 1;
          }
        }
        if (remaining === 0) {
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - ARRIVAL_LINE) * 100)}% 0px` },
    );
    for (const element of pending) {
      observer.observe(element);
    }
    return () => {
      observer.disconnect();
      for (const element of pending) {
        element.dataset.arrive = "";
      }
    };
  }, []);

  return <span ref={line} className={className} aria-hidden="true" data-arrive="" />;
}
