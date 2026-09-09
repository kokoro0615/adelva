"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

// Original single-line cursive, authored for this project. Each path follows
// the pen rather than outlining a font, so letters can be written in sequence.
const letters = {
  k: "M0 78 C10 69 27 31 25 19 C23 7 13 21 12 39 L5 81 C9 65 20 50 29 51 C39 53 25 67 14 66 C23 65 22 85 32 80 L42 71",
  o: "M0 78 C7 74 9 55 21 53 C36 49 30 79 17 81 C3 83 6 59 21 53 C18 64 28 70 36 68",
  r: "M0 78 C8 71 13 58 16 51 C10 64 14 64 22 58 C33 51 29 69 25 77 C23 84 32 81 37 74",
  n: "M0 78 C8 70 12 58 15 53 L7 81 C18 59 28 49 32 56 C36 63 22 87 35 79 L43 72",
  a: "M0 78 C7 73 10 54 23 53 C36 51 26 79 15 81 C3 82 9 56 23 53 C29 52 30 54 30 56 L23 76 C21 85 31 81 38 73",
  g: "M0 78 C7 73 10 54 23 53 C36 51 26 79 15 81 C3 82 9 56 23 53 C29 52 30 54 30 56 C24 77 21 103 10 108 C-4 114 -2 99 12 93 C25 88 34 78 41 71",
  w: "M0 78 C7 73 12 61 15 53 C11 65 5 84 15 81 C23 78 28 62 30 56 C24 72 22 86 32 80 C44 72 47 55 43 53 C38 55 40 71 52 68",
} as const;

const signatureStrokes = [
  { letter: "k", x: 12 },
  { letter: "o", x: 52 },
  { letter: "k", x: 87 },
  { letter: "o", x: 127 },
  { letter: "r", x: 162 },
  { letter: "o", x: 197 },
  { letter: "n", x: 261 },
  { letter: "a", x: 302 },
  { letter: "k", x: 338 },
  { letter: "a", x: 378 },
  { letter: "g", x: 414 },
  { letter: "a", x: 453 },
  { letter: "w", x: 489 },
  { letter: "a", x: 539 },
] as const;

/** SSR and reduced-motion sessions always show the completed signature. */
export function FounderSignature() {
  const scope = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const wrapper = scope.current;
      if (!wrapper) {
        return;
      }

      gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);
      const paths = Array.from(wrapper.querySelectorAll<SVGPathElement>("path"));
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(paths, { drawSVG: "0%" });

        const lengths = paths.map((path) => path.getTotalLength());
        const totalLength = lengths.reduce((total, length) => total + length, 0);
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper.parentElement ?? wrapper,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });

        paths.forEach((path, index) => {
          const pause =
            index === 0 ? 0 : index === 6 ? 0.12 : index === 14 ? 0.1 : 0.025;
          timeline.to(
            path,
            {
              drawSVG: "100%",
              duration: (lengths[index] / totalLength) * 1.65,
              ease: "none",
            },
            `+=${pause}`,
          );
        });

        return () => {
          timeline.kill();
          gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
        };
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <svg
      ref={scope}
      className="founder__signature"
      viewBox="0 0 656.82 120.12"
      aria-hidden="true"
      data-motion-layer="founder-signature"
    >
      {signatureStrokes.map(({ letter, x }, index) => (
        <path
          key={index}
          d={letters[letter]}
          transform={`translate(${x} ${8 - x * 0.025})`}
        />
      ))}
      <path
        className="founder__signature-flourish"
        d="M89 107 C208 96 396 89 559 87 C600 86 625 80 636 74"
      />
    </svg>
  );
}
