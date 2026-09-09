"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useRef } from "react";

import { WatchFilmButton } from "@/components/home/film-experience";
import { getAsset, getVideoAsset } from "@/content/assets";
import { homeTarget } from "@/content/home-target";

/**
 * HOME hero stage — `home-target-v1`.
 *
 * A 200svh stage holding one sticky mist plane, a 100svh wrapper with the
 * video/overlay/content, and two independent cloud wraps.
 *
 * Motion is **direct scroll linkage**, not a scrubbed tween. The measured
 * target resolves to its exact scroll-linked state on the next animation frame
 * after a jump or a mid-sequence reversal, with no catch-up and no overshoot,
 * so a `scrub` timeline would be the wrong mechanism. With `f = scrollY / vh`:
 *
 *   wrapper        translateY(100f svh)      clamp 200svh
 *   content/title  translateY(-30f svh)      clamp -60svh
 *   h1             blur(5f px)               clamp 10px
 *   cloud near     translateY(100 - 90f %)   clamp -80%
 *   cloud far      translateY(100 - 55f %)   clamp -10%
 *   mist           rotateX(90 -> 0deg) linearly across f 0.8..1.5, held outside
 *
 * The wrapper's positive lift cancels ordinary document scroll, which is what
 * keeps the one-viewport composition optically pinned across the two-viewport
 * stage.
 *
 * Under `prefers-reduced-motion: reduce` no listener, frame loop or tween is
 * created at all: every layer is left at its authored f=0 state, which is the
 * fully readable hero, and the video is not autoplayed. That is an intentional
 * deviation from the target, which ignores the preference entirely.
 */

const MIST_START = 0.8;
const MIST_END = 1.5;

function clampLow(value: number, low: number) {
  return value < low ? low : value;
}

export function HeroStage() {
  const scope = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hero = homeTarget.hero;
  const video = getVideoAsset(hero.videoId);
  const poster = getAsset("hero-poster");
  const mist = getAsset("mist-plate");
  const near = getAsset("cloud-near");
  const far = getAsset("cloud-far");
  const preview = getAsset(hero.watchFilmPosterId);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const pick = (id: string) =>
          root.querySelector<HTMLElement>(`[data-motion-layer="${id}"]`);
        const wrapper = pick("hero-wrapper");
        const content = pick("hero-content");
        const title = pick("hero-title");
        const cloudNear = pick("cloud-near");
        const cloudFar = pick("cloud-far");
        const mistPlane = pick("mist-plane");
        const player = videoRef.current;

        if (player) {
          player.autoplay = true;
          void player.play().catch(() => {
            /* autoplay refusal is non-fatal; the poster remains */
          });
        }

        let frame = 0;

        const apply = () => {
          frame = 0;
          // `innerHeight` changes when mobile browser chrome retracts, while
          // the CSS svh stage stays put. Use the stage's own coordinate system
          // and pixels so the wrapper continues cancelling document scroll.
          const vh = wrapper?.clientHeight || 1;
          const localScroll = Math.max(0, -root.getBoundingClientRect().top);
          const travel = Math.min(localScroll, 2 * vh);
          const f = travel / vh;

          if (wrapper) {
            wrapper.style.transform = `translate3d(0, ${travel}px, 0)`;
          }
          if (content) {
            content.style.transform = `translate3d(0, ${-0.3 * travel}px, 0)`;
          }
          if (title) {
            title.style.filter = `blur(${Math.min(5 * f, 10)}px)`;
          }
          if (cloudNear) {
            cloudNear.style.transform = `translate3d(0, ${clampLow(100 - 90 * f, -80)}%, 0)`;
          }
          if (cloudFar) {
            cloudFar.style.transform = `translate3d(0, ${clampLow(100 - 55 * f, -10)}%, 0)`;
          }
          if (mistPlane) {
            const progress = (f - MIST_START) / (MIST_END - MIST_START);
            const eased = progress < 0 ? 0 : progress > 1 ? 1 : progress;
            mistPlane.style.transform = `rotateX(${90 - 90 * eased}deg)`;
          }
        };

        // Direct linkage: one write per animation frame, never a queued tween.
        const onScroll = () => {
          if (frame === 0) frame = requestAnimationFrame(apply);
        };

        apply();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });

        return () => {
          if (frame !== 0) cancelAnimationFrame(frame);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
          for (const layer of [wrapper, content, cloudNear, cloudFar, mistPlane]) {
            layer?.style.removeProperty("transform");
          }
          title?.style.removeProperty("filter");
          if (player) {
            player.autoplay = false;
            player.pause();
          }
        };
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="home-hero"
      data-fidelity-section="hero"
      data-fidelity-landmark="hero"
      aria-labelledby="page-title"
    >
      <div className="home-hero__mist-stage" aria-hidden="true">
        <div className="home-hero__mist" data-motion-layer="mist-plane">
          <Image
            src={mist.src}
            alt=""
            width={mist.width}
            height={mist.height}
            sizes="100vw"
            className="home-hero__mist-image"
          />
        </div>
      </div>

      <div className="home-hero__wrapper" data-motion-layer="hero-wrapper">
        <div className="home-hero__bg">
          <video
            ref={videoRef}
            className="home-hero__video"
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster.src}
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        </div>

        <div className="home-hero__overlay" aria-hidden="true" />

        <div className="home-hero__content" data-motion-layer="hero-content">
          <div className="home-hero__layout">
            <WatchFilmButton className="home-hero__film" data-watch-film>
              <span className="home-hero__film-preview" aria-hidden="true">
                <Image
                  src={preview.src}
                  alt=""
                  width={preview.width}
                  height={preview.height}
                  sizes="200px"
                  className="home-hero__film-image"
                />
              </span>
              <span className="home-hero__film-label">{hero.watchFilmLabel}</span>
              <span className="home-hero__film-glyph" aria-hidden="true" />
            </WatchFilmButton>
          </div>

          {/* Measured: the blur is authored on the `h1` itself, not on its
              wrapper. The wrapper only carries the -30f svh content lift, which
              this implementation consolidates onto `home-hero__content`. */}
          <div className="home-hero__title-wrap">
            <h1
              className="home-hero__title"
              id="page-title"
              data-motion-layer="hero-title"
              data-fidelity-landmark="hero-title"
            >
              {hero.title}
            </h1>
          </div>
        </div>

        <div
          className="home-hero__cloud home-hero__cloud--near"
          data-motion-layer="cloud-near"
          aria-hidden="true"
        >
          <Image
            src={near.src}
            alt=""
            width={near.width}
            height={near.height}
            sizes="100vw"
          />
        </div>
        <div
          className="home-hero__cloud home-hero__cloud--far"
          data-motion-layer="cloud-far"
          aria-hidden="true"
        >
          <Image
            src={far.src}
            alt=""
            width={far.width}
            height={far.height}
            sizes="100vw"
          />
        </div>
      </div>
    </section>
  );
}
