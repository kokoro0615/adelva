"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { startCamera } from "./camera-motion";
import { startDesktop } from "./desktop-motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Client root of /services/management-operations. The page reads completely
 * without it (spec §7): this picks the choreography for the viewport and the
 * motion preference, and restarts it when either changes.
 *
 *   ≥ 1024 px   desktop stage (B-hq `hq.js`)
 *   < 1024 px   one camera over the photograph (B-hq-mobile `m.js`)
 */
export function ManagementOperationsMotion() {
  useGSAP(() => {
    const root = document.querySelector<HTMLElement>("[data-mo-root]");
    if (!root) return;
    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 1024px)",
        // gsap.matchMedia runs the handler only while one condition matches;
        // this one always does, so narrow viewports start too.
        narrow: "(max-width: 1023.98px)",
        reduced: "(prefers-reduced-motion: reduce)",
        fine: "(pointer: fine)",
      },
      (context) => {
        const { desktop, reduced, fine } = context.conditions as Record<
          string,
          boolean
        >;
        const stop = desktop
          ? startDesktop(root, { reduced: Boolean(reduced), snap: Boolean(fine) })
          : startCamera(root, { reduced: Boolean(reduced) });
        return stop;
      },
    );
    return () => media.revert();
  });
  return null;
}
