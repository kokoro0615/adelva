"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

/** The existing content root owns the two cross-section scroll reveals. */
export function HomeMotion({ children }: { readonly children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        let active = true;
        const quote = root.querySelector<HTMLElement>(".last-continent__quote");
        const longform = root.querySelector<HTMLElement>(".longform");

        if (quote) {
          gsap.fromTo(
            quote,
            { "--home-copy-reveal": -40 },
            {
              "--home-copy-reveal": 100,
              ease: "none",
              scrollTrigger: {
                trigger: quote,
                start: "top 80%",
                end: "bottom 60%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
        if (longform) {
          gsap.fromTo(
            longform,
            { clipPath: "inset(0px 10%)" },
            {
              clipPath: "inset(0px 0%)",
              ease: "none",
              scrollTrigger: {
                trigger: longform,
                start: "top bottom",
                end: "top top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }

        void document.fonts.ready.then(() => {
          if (active) ScrollTrigger.refresh();
        });
        return () => {
          active = false;
        };
      });
      root.dataset.homeMotionReady = "true";
      return () => {
        media.revert();
        delete root.dataset.homeMotionReady;
      };
    },
    { scope },
  );

  return (
    <div className="page-content" data-page-content ref={scope}>
      {children}
    </div>
  );
}
