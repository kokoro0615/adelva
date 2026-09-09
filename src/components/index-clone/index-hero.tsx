"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { indexClouds, type IndexHero as IndexHeroData } from "@/content/index-target";

import styles from "./index-clone.module.css";

const MIST_START = 0.8;
const MIST_END = 1.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The index hero is a two-viewport direct-scroll stage measured from the live
 * White Desert pages. Each layer is updated from the same scroll fraction, so
 * a jump, interruption, or reversal resolves to the current state on the next
 * frame without a queued tween.
 */
export function IndexHero({ hero }: { readonly hero: IndexHeroData }) {
  const scope = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const layer = (name: string) =>
      root.querySelector<HTMLElement>(`[data-motion-layer="${name}"]`);
    const wrapper = layer("hero-wrapper");
    const mid = layer("hero-mid");
    const bottom = layer("hero-bottom");
    const title = layer("hero-title");
    const near = layer("cloud-near");
    const far = layer("cloud-far");
    const mist = layer("mist-plane");
    let frame = 0;

    const apply = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const fraction = window.scrollY / vh;

      wrapper?.style.setProperty(
        "transform",
        `translate3d(0, ${Math.min(100 * fraction, 200)}svh, 0)`,
      );
      const contentY = Math.max(-60, -30 * fraction);
      mid?.style.setProperty("transform", `translate3d(0, ${contentY}svh, 0)`);
      bottom?.style.setProperty("transform", `translate3d(0, ${contentY}svh, 0)`);
      title?.style.setProperty("filter", `blur(${Math.min(5 * fraction, 10)}px)`);
      near?.style.setProperty(
        "transform",
        `translate3d(0, ${Math.max(-80, 100 - 90 * fraction)}%, 0)`,
      );
      far?.style.setProperty(
        "transform",
        `translate3d(0, ${Math.max(-10, 100 - 55 * fraction)}%, 0)`,
      );
      const mistProgress = clamp(
        (fraction - MIST_START) / (MIST_END - MIST_START),
        0,
        1,
      );
      mist?.style.setProperty("transform", `rotateX(${90 - 90 * mistProgress}deg)`);
    };

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      for (const element of [wrapper, mid, bottom, near, far, mist]) {
        element?.style.removeProperty("transform");
      }
      title?.style.removeProperty("filter");
    };
  }, []);

  return (
    <section
      ref={scope}
      className={`${styles.hero} hero-banner`}
      data-index-stage="hero"
      data-fidelity-section="hero"
      data-fidelity-landmark="hero"
      aria-labelledby="index-page-title"
    >
      <div
        className={`${styles.mist} mist-transition`}
        data-motion-layer="mist"
        aria-hidden="true"
      >
        <div
          className={`${styles.mistPlane} mist-transition_image-container visible`}
          data-motion-layer="mist-plane"
        >
          <Image
            src={indexClouds.mist.src}
            alt={indexClouds.mist.alt}
            width={indexClouds.mist.width}
            height={indexClouds.mist.height}
            sizes="100vw"
            priority
          />
        </div>
      </div>

      <div
        className={`${styles.wrapper} hero-banner_wrapper`}
        data-motion-layer="hero-wrapper"
      >
        <div className={`${styles.background} hero-banner_bg`}>
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="100vw"
            className={styles.backgroundImage}
            style={{ objectPosition: hero.image.focal }}
          />
        </div>
        <div className={`${styles.overlay} hero-banner_overlay`} aria-hidden="true" />

        <div className={`${styles.content} hero-banner_content`}>
          <div
            className={`${styles.contain} ${styles.containMid} hero-banner_contain mid`}
            data-motion-layer="hero-mid"
            data-scroll-speed="-60svh"
          >
            <h2>{hero.eyebrow}</h2>
          </div>
          <div
            className={`${styles.contain} ${styles.containBottom} hero-banner_contain bot`}
            data-motion-layer="hero-bottom"
            data-scroll-speed="-60svh"
          >
            <div className={styles.titleWrap} data-motion-layer="hero-title">
              <h1 id="index-page-title" data-fidelity-landmark="hero-title">
                {hero.title}
              </h1>
            </div>
          </div>
        </div>

        <div
          className={`${styles.cloud} ${styles.cloudNear} clouds-overlay_wrap`}
          data-motion-layer="cloud-near"
          data-scroll-speed="-80%"
          aria-hidden="true"
        >
          <Image
            src={indexClouds.near.src}
            alt={indexClouds.near.alt}
            width={indexClouds.near.width}
            height={indexClouds.near.height}
            sizes="100vw"
            className={styles.cloudImage}
          />
        </div>
        <div
          className={`${styles.cloud} ${styles.cloudFar} clouds-overlay_wrap`}
          data-motion-layer="cloud-far"
          data-scroll-speed="-10%"
          aria-hidden="true"
        >
          <Image
            src={indexClouds.far.src}
            alt={indexClouds.far.alt}
            width={indexClouds.far.width}
            height={indexClouds.far.height}
            sizes="100vw"
            className={styles.cloudImage}
          />
        </div>
      </div>
    </section>
  );
}
