"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { audiences, routeStatusOf } from "@/content/adelva-navigation";
import { getAsset } from "@/content/assets";
import { homeTarget } from "@/content/home-target";
import { DURATION } from "@/lib/motion";

import styles from "./who-we-support.module.css";

/** Owns only this scene; HOME's hero, signature and camp timelines stay independent. */
export function WhoWeSupport() {
  const scope = useRef<HTMLElement>(null);
  const landscape = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const content = homeTarget.ourSeason;
  const asset = getAsset(content.assetId);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-ambient-ready", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.5 },
    );
    root
      .querySelectorAll("[data-support-audience]")
      .forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const root = scope.current;
      const image = landscape.current;
      const introduction = copy.current;
      if (!root || !image || !introduction) return;

      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        let active = true;

        gsap.fromTo(
          image,
          { yPercent: -6, scale: 1.06 },
          {
            yPercent: 6,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        // Direct arrivals remain readable; only an approaching introduction animates.
        if (introduction.getBoundingClientRect().top > window.innerHeight * 0.88) {
          gsap.from(root.querySelectorAll("[data-support-reveal]"), {
            y: 28,
            opacity: 0.2,
            duration: DURATION.reveal * 0.75,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: introduction,
              start: "top 88%",
              once: true,
            },
            clearProps: "opacity,transform",
          });
        }

        for (const link of root.querySelectorAll("[data-support-audience]")) {
          const rule = link.querySelector("[data-support-rule]");
          if (!rule || link.getBoundingClientRect().top < window.innerHeight * 0.9)
            continue;
          gsap.from(rule, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: DURATION.reveal * 0.75,
            ease: "power3.out",
            scrollTrigger: { trigger: link, start: "top 90%", once: true },
            clearProps: "transform",
          });
        }

        void document.fonts.ready.then(() => {
          if (active) ScrollTrigger.refresh();
        });
        return () => {
          active = false;
        };
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className={`season ${styles.section}`}
      data-fidelity-section="our-season"
      data-support-section
      aria-labelledby="season-heading"
      lang="ja"
    >
      <div className={styles.background} aria-hidden="true">
        <div
          ref={landscape}
          className={styles.landscape}
          data-motion-layer="support-landscape"
        >
          <Image
            src={asset.src}
            alt=""
            fill
            sizes="(max-aspect-ratio: 4/3) 160vh, 100vw"
            className={styles.image}
            onLoad={() => ScrollTrigger.refresh()}
          />
        </div>
        <div className={styles.scrim} />
      </div>

      <div ref={copy} className={styles.copy}>
        <h2
          className={`season__heading ${styles.heading}`}
          id="season-heading"
          lang="en"
          data-support-reveal
        >
          {content.title}
        </h2>
        <p className={`season__label ${styles.subtitle}`} data-support-reveal>
          {content.label}
        </p>
        <p className={styles.introduction} data-support-reveal>
          {content.body.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>

        <ul className={styles.audiences}>
          {audiences.map((audience, index) => (
            <li key={audience.href}>
              <a
                className={styles.audience}
                href={audience.href}
                aria-labelledby={`support-audience-${index}-title`}
                aria-describedby={`support-audience-${index}-description`}
                data-route-status={routeStatusOf(audience.href)}
                data-support-audience
              >
                <span className={styles.rule} data-support-rule aria-hidden="true" />
                <span className={styles.audienceHeading}>
                  <span id={`support-audience-${index}-title`}>
                    {audience.label.split("・").map((part, partIndex) => (
                      <span className={styles.audienceWords} key={part}>
                        {part}
                        {partIndex === 0 ? "・" : ""}
                      </span>
                    ))}
                  </span>
                  <span className={styles.arrowFrame} aria-hidden="true">
                    <svg
                      className={styles.arrow}
                      width="36"
                      height="36"
                      viewBox="0 0 36 36"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 18h28M20 7l11 11-11 11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                </span>
                <span
                  className={styles.description}
                  id={`support-audience-${index}-description`}
                >
                  {audience.description
                    ?.split("、")
                    .map((phrase, phraseIndex, parts) => (
                      <span key={phrase}>
                        {phrase}
                        {phraseIndex < parts.length - 1 ? "、" : ""}
                      </span>
                    ))}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
