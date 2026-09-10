"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useRef } from "react";

import { WatchFilmButton } from "@/components/home/film-experience";
import { getAsset, getVideoAsset } from "@/content/assets";
import { homeTarget } from "@/content/home-target";

/** Native sticky owns the pin; scroll updates only move the inner scene.
 * Keeping document motion on the compositor prevents touch scrolling from
 * outrunning a JavaScript translateY correction. The 200svh story and measured
 * cloud/content/mist trajectories remain reversible; reduced motion is static.
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
        let height = 1;
        let top = 0;
        let lastTravel = -1;
        const measure = () => {
          height = wrapper?.clientHeight || 1;
          top = root.getBoundingClientRect().top + window.scrollY;
          lastTravel = -1;
          onScroll();
        };

        const apply = () => {
          frame = 0;
          const travel = Math.min(Math.max(0, window.scrollY - top), 2 * height);
          if (travel === lastTravel) return;
          lastTravel = travel;
          const f = travel / height;

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

        const geometry = new ResizeObserver(measure);
        geometry.observe(root);
        if (wrapper) geometry.observe(wrapper);
        const visibility = new IntersectionObserver(([entry]) => {
          if (!player) return;
          if (entry.isIntersecting && !document.hidden)
            void player.play().catch(() => {});
          else player.pause();
        });
        visibility.observe(root);
        measure();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", measure, { passive: true });

        return () => {
          if (frame !== 0) cancelAnimationFrame(frame);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", measure);
          geometry.disconnect();
          visibility.disconnect();
          for (const layer of [content, cloudNear, cloudFar, mistPlane]) {
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

      <div className="home-hero__pin-stage">
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
      </div>
    </section>
  );
}
