"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { lockScroll } from "@/lib/motion";

const steps = [
  {
    title: "1. Consultation",
    body: (
      <>
        An adventure to Antarctica requires a lot of planning and our team can easily
        guide you through the process. Send us an enquiry or{" "}
        <a
          href="https://meetings-eu1.hubspot.com/meghan-sales/booktime"
          target="_blank"
          rel="noreferrer"
        >
          book a call directly
        </a>{" "}
        at your preferred time, with no obligation. We&apos;ll talk through the
        adventures you can expect, your ideal experience and preferred dates, then
        review availability.
      </>
    ),
  },
  {
    title: "2. Confirmation",
    body: (
      <>
        After you confirm your dates, secured by a deposit, we’ll assist you in
        completing the necessary forms, such as travel insurance and a medical check
        completed within 30 days, to ensure your safety on ice.
      </>
    ),
  },
  {
    title: "3. Planning",
    body: (
      <>
        Book flexible flights, arriving in Cape Town at least two days prior to your
        scheduled Antarctic trip, and departing two days after your arrival, in case of
        weather delays. Our team can also arrange accommodation, private transfers in
        our electric BMW fleet, and curated experiences in Cape Town and the Winelands.
        If you wish to book a safari or explore more of Southern Africa, we are happy to
        assist.
      </>
    ),
  },
  {
    title: "4. On-Boarding",
    body: (
      <>
        As your departure date approaches, our team will guide you through every
        necessary step — most importantly, what to pack. You can purchase recommended
        items through our online Boutique featuring exclusive co-branded polar gear, or
        have our team prepare a full kit ready for your arrival in Cape Town.
      </>
    ),
  },
  {
    title: "5. Safety Briefing",
    body: (
      <>
        After arriving in Cape Town, our vehicles will transfer you to a safety briefing
        at our offices at 16 Loop Street, where we will go through the itinerary,
        updated flight schedule and answer any questions. The team will then check your
        kit, assist with anything you may have forgotten, and help pack the first polar
        outfit you’ll need to change into on the flight south.
      </>
    ),
  },
  {
    title: "6. Departure",
    body: (
      <>
        On departure day, our drivers will collect you from your hotel and escort you to
        the airport, where our team will fast-track you through security and customs.
        You’ll then head to the lounge before boarding your direct flight to Antarctica.
      </>
    ),
  },
] as const;

const focusableSelector =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function setPageInert(inert: boolean) {
  for (const selector of [
    // The navigation's own class names are module-scoped and hashed, so the
    // shell is addressed through the stable landmark and data hooks it exposes.
    '[data-fidelity-landmark="header-nav"]',
    "[data-site-nav-shelf]",
    "#site-menu",
    "#main-content",
    "[data-site-footer]",
    "[data-skip-link]",
  ]) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.inert = inert;
  }
}

/** Global, reversible six-step planning flyout measured from the target shell. */
export function HowItWorks() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    const release = lockScroll();
    setPageInert(true);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = [
        triggerRef.current,
        ...Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
        ),
      ].filter((node): node is HTMLElement => Boolean(node));
      if (nodes.length === 0) return;
      const active = document.activeElement;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      setPageInert(false);
      release();
    };
  }, [close, open]);

  return (
    <div className="how-it-works" data-open={open}>
      <button
        ref={triggerRef}
        className="how-it-works__trigger"
        type="button"
        aria-expanded={open}
        aria-controls="how-it-works-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{open ? "Close" : "How it works"}</span>
        <span className="how-it-works__glyph" aria-hidden="true" />
      </button>

      <button
        className="how-it-works__backdrop"
        type="button"
        aria-label="Close How it works"
        tabIndex={open ? 0 : -1}
        onClick={close}
      />

      <aside
        id="how-it-works-panel"
        ref={panelRef}
        className="how-it-works__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="how-it-works__content">
          <h2 id={titleId}>How it works</h2>
          <ol className="how-it-works__steps">
            {steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
