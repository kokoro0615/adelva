"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

/**
 * Implements the supplied V3 motion score; Figma has no baked keyframe tracks.
 *
 * Every tween starts from the finished state, so the page a visitor gets with
 * `prefers-reduced-motion`, with a failed script, or before hydration is the
 * complete one. Nothing here is load-bearing for reading the page.
 */
export function AudienceMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const element = root.current;
      const mm = gsap.matchMedia();
      const editorial = CustomEase.create("audience-editorial", ".16,1,.3,1");
      const standard = CustomEase.create("audience-standard", ".2,0,0,1");
      mm.add(
        {
          desktop: "(min-width: 1100px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop, motion } = context.conditions!;
          if (!motion) return;
          const hero = element.querySelector<HTMLElement>('[data-section="hero"]');
          const heroPicture = hero?.querySelector<HTMLElement>("picture");
          const heroImage = heroPicture?.querySelector<HTMLElement>("img");
          if (heroImage)
            gsap.fromTo(
              heroImage,
              { scale: 1.03 },
              { scale: 1, duration: 0.72, ease: editorial },
            );
          const monument = element.querySelector<HTMLElement>("[data-monument]");
          if (monument)
            gsap.from(monument, {
              clipPath: "inset(100% 0 0 0)",
              y: 16,
              delay: 0.16,
              duration: 0.42,
              ease: editorial,
              clearProps: "transform,clipPath",
            });
          /* A transform on the frame composites; `object-position` repaints a
             1672px photograph on every scroll frame. The extra scale is the
             travel room the translation needs. */
          if (desktop && heroPicture)
            gsap.fromTo(
              heroPicture,
              { yPercent: -2.6, scale: 1.06 },
              {
                yPercent: 2.6,
                scale: 1.06,
                ease: "none",
                scrollTrigger: {
                  trigger: hero,
                  start: "top top",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          element.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => {
            const rules = [...section.querySelectorAll<HTMLElement>("[data-rule]")];
            const vertical = rules.filter(
              (rule) =>
                rule.getBoundingClientRect().height >
                rule.getBoundingClientRect().width,
            );
            const horizontal = rules.filter((rule) => !vertical.includes(rule));
            for (const [axis, group] of [
              ["scaleX", horizontal],
              ["scaleY", vertical],
            ] as const)
              if (group.length)
                gsap.from(group, {
                  [axis]: 0,
                  transformOrigin: "top left",
                  duration: 0.26,
                  stagger: { each: 0.04, amount: 0.16 },
                  ease: standard,
                  scrollTrigger: { trigger: section, start: "top 60%", once: true },
                });
            const photo = [
              ...section.querySelectorAll<HTMLElement>('[data-photo="reveal"]'),
            ].find((node) => node.getBoundingClientRect().width > 0);
            if (photo)
              gsap.from(photo, {
                ...(desktop ? { clipPath: "inset(0 0 0 24%)" } : { opacity: 0.65 }),
                duration: desktop ? 0.42 : 0.16,
                ease: editorial,
                clearProps: "clipPath,opacity",
                scrollTrigger: { trigger: photo, start: "top 55%", once: true },
              });
          });
          element.querySelectorAll<HTMLElement>("[data-panorama]").forEach((frame) => {
            const picture = frame.querySelector("picture");
            if (picture && frame.getBoundingClientRect().width > 0)
              gsap.from(picture, {
                scale: 1.03,
                duration: 0.72,
                ease: editorial,
                scrollTrigger: { trigger: frame, start: "top 80%", once: true },
              });
          });
          /* The one authored moment: the six steps fill in reading order as the
             section is read, so the sequence states its own progression instead
             of parking a permanent accent on one arbitrary step. */
          const process = element.querySelector<HTMLElement>("[data-process]");
          const steps = process
            ? [...process.querySelectorAll<HTMLElement>("li[data-step]")]
            : [];
          if (process && steps.length) {
            const progress = process.querySelector<HTMLElement>(
              "[data-process-progress]",
            );
            const railed = !!progress && progress.getBoundingClientRect().width > 0;
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: process,
                start: railed ? "top 78%" : "top 82%",
                end: railed ? "bottom 52%" : "bottom 58%",
                scrub: 0.5,
              },
            });
            if (railed && progress) {
              timeline.fromTo(
                progress,
                { scaleX: 0 },
                { scaleX: 1, ease: "none", duration: steps.length },
                0,
              );
              steps.forEach((step, index) => {
                const dot = step.querySelector<HTMLElement>("i");
                if (dot)
                  timeline.fromTo(
                    dot,
                    { scale: 0.55, opacity: 0.45 },
                    { scale: 1, opacity: 1, duration: 0.22, ease: standard },
                    Math.max(0, index - 0.18),
                  );
              });
            } else {
              steps.forEach((step, index) => {
                const connector = step.querySelector<HTMLElement>("i");
                if (connector)
                  timeline.fromTo(
                    connector,
                    { clipPath: "inset(0 100% 0 0)" },
                    { clipPath: "inset(0 0% 0 0)", ease: "none", duration: 0.82 },
                    index,
                  );
                timeline.fromTo(
                  step.querySelector<HTMLElement>("[class*='stepNumber']") || step,
                  { opacity: 0.42 },
                  { opacity: 1, duration: 0.3, ease: standard },
                  Math.max(0, index - 0.2),
                );
              });
            }
          }
          const ticks = element.querySelectorAll<HTMLElement>("[data-tick]");
          gsap.from(ticks, {
            scaleY: 0,
            transformOrigin: "top",
            duration: 0.2,
            stagger: 0.04,
            ease: standard,
            scrollTrigger: {
              trigger: element.querySelector('[data-section="verification"]'),
              start: "top 70%",
              once: true,
            },
          });
          /* Keyboard travel can outrun a scroll-linked reveal, so anything the
             focused section is still animating jumps to its end state. */
          const focus = (event: FocusEvent) => {
            if (!(event.target instanceof Element)) return;
            const section = event.target.closest("[data-section]");
            section
              ?.querySelectorAll<HTMLElement>(
                "[data-rule], [data-tick], [data-photo], [data-monument], [data-step] i, [data-process-progress]",
              )
              .forEach((target) =>
                gsap.getTweensOf(target).forEach((tween) => tween.progress(1)),
              );
          };
          element.addEventListener("focusin", focus);
          return () => element.removeEventListener("focusin", focus);
        },
        root,
      );
      return () => mm.revert();
    },
    { scope: root },
  );
  return <div ref={root}>{children}</div>;
}
