"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef } from "react";

import { getAsset } from "@/content/assets";
import { homeTarget } from "@/content/home-target";

/**
 * HOME / Our Camps.
 *
 * The target does not map one horizontal pixel to one document-scroll pixel.
 * Its measured pin intervals are 8550 / 6340 / 4450px while horizontal travel
 * is 4200 / 2520 / 1560px at the three release viewports. This component keeps
 * the target's tall CSS scroll reserve and derives a direct, reversible mapping
 * from that reserve to the real rendered track width. There is deliberately no
 * scrub tween: a jump or direction reversal resolves on the next frame.
 *
 * Measured mapping (sampled at 16 pin fractions per viewport against the live
 * target `.horizontal-scroll_container`):
 *
 *   - the track holds at x=0 for a viewport-dependent lead-in, then travels
 *     linearly and reaches its terminal -4200 / -2520 / -1560px exactly at the
 *     end of the pin — never before it;
 *   - the lead-in is 1.239 / 1.371 / 1.448 viewport heights at 1440 / 768 / 390
 *     CSS px of viewport width. Those three measurements are collinear in
 *     viewport width, so widths between them are linearly interpolated and
 *     widths outside the measured range hold the nearest measured value rather
 *     than extrapolating unobserved behaviour.
 */

/** Measured lead-in, in viewport heights, at the widest release viewport. */
const HOLD_VH_AT_1440 = 1.239;
/** Measured lead-in, in viewport heights, at the narrowest release viewport. */
const HOLD_VH_AT_390 = 1.448;
const HOLD_MEASURED_MAX_WIDTH = 1440;
const HOLD_MEASURED_MIN_WIDTH = 390;

/** Lead-in before horizontal travel starts, in viewport heights. */
function holdViewportHeights(viewportWidth: number) {
  const width = gsap.utils.clamp(
    HOLD_MEASURED_MIN_WIDTH,
    HOLD_MEASURED_MAX_WIDTH,
    viewportWidth,
  );
  const span = HOLD_MEASURED_MAX_WIDTH - HOLD_MEASURED_MIN_WIDTH;
  const t = (width - HOLD_MEASURED_MIN_WIDTH) / span;
  return HOLD_VH_AT_390 + (HOLD_VH_AT_1440 - HOLD_VH_AT_390) * t;
}

export function CampsFlow() {
  const scope = useRef<HTMLDivElement>(null);
  const maskId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const introPrimaryRef = useRef<HTMLDivElement>(null);
  const introCopyRef = useRef<HTMLDivElement>(null);
  const camps = homeTarget.ourCamps;

  useGSAP(
    () => {
      const root = scope.current;
      const track = trackRef.current;
      const introPrimary = introPrimaryRef.current;
      const introCopy = introCopyRef.current;
      if (!root || !track) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        let frame = 0;
        const viewport = root.querySelector<HTMLElement>(".camps__viewport");
        const secondary = root.querySelector<HTMLElement>(".camps__intro-secondary");
        const maskStrips = root.querySelectorAll<SVGRectElement>(".camps__mask rect");

        const apply = () => {
          frame = 0;

          const viewportHeight = viewport?.clientHeight || 1;
          const rootTop = root.getBoundingClientRect().top + window.scrollY;
          const localScroll = window.scrollY - rootTop;
          const pinDistance = Math.max(1, root.offsetHeight - viewportHeight);
          const horizontalDistance = Math.max(0, track.scrollWidth - window.innerWidth);

          // The target holds the intro before horizontal travel begins, then
          // reaches its terminal offset exactly at the end of the pin.
          const movementStart = holdViewportHeights(window.innerWidth) * viewportHeight;
          const movementEnd = Math.max(movementStart + 1, pinDistance);
          const progress = gsap.utils.clamp(
            0,
            1,
            (localScroll - movementStart) / (movementEnd - movementStart),
          );
          const x = -horizontalDistance * progress;
          const introProgress = localScroll / viewportHeight;
          const mobile = window.innerWidth < 768;
          const titleProgress = gsap.utils.clamp(
            0,
            1,
            localScroll / (movementStart * (5 / 7)),
          );
          const entryProgress = gsap.utils.clamp(0, 1, -introProgress);

          track.style.transform = `translate3d(${x}px, 0, 0)`;

          // The blue-ice plate stays optically fixed while its parent panel
          // travels, then progressively closes from the right near the end.
          if (introPrimary) {
            const clipProgress = gsap.utils.clamp(
              0,
              1,
              (Math.abs(x) - horizontalDistance * 0.53) /
                Math.max(1, horizontalDistance * 0.47),
            );
            introPrimary.style.transform = `translate3d(${-x}px, 0, 0)`;
            introPrimary.style.clipPath = `inset(0 ${clipProgress * 100}% 0 0)`;
          }

          if (introCopy) {
            introCopy.style.transform = `translate3d(${-x}px, 0, 0)`;
            introCopy.style.setProperty(
              "--intro-copy-y",
              `${gsap.utils.clamp(-0.5, 1, 4 / 7 - (15 / 14) * introProgress) * viewportHeight}px`,
            );
            introCopy.style.setProperty(
              "--intro-title-scale",
              `${1 + (mobile ? 28 / 32 : 50 / 90) * entryProgress - (mobile ? 1 / 4 : 1 / 3) * titleProgress}`,
            );
            const maskProgress = Math.max(0, localScroll / movementStart - 5 / 7);
            maskStrips.forEach((rect, index) => {
              const widths = [0.3333, 0.3334, 0.3333];
              const rates = [0.35, 0.4666667, 0.7];
              rect.setAttribute(
                "width",
                String(Math.max(0, widths[index] - maskProgress * rates[index])),
              );
            });
            if (secondary) secondary.style.transform = `translate3d(${-x}px, 0, 0)`;
          }
        };

        const requestApply = () => {
          if (frame === 0) frame = window.requestAnimationFrame(apply);
        };

        apply();
        window.addEventListener("scroll", requestApply, { passive: true });
        window.addEventListener("resize", requestApply, { passive: true });

        return () => {
          if (frame !== 0) window.cancelAnimationFrame(frame);
          window.removeEventListener("scroll", requestApply);
          window.removeEventListener("resize", requestApply);
          track.style.removeProperty("transform");
          introPrimary?.style.removeProperty("transform");
          introPrimary?.style.removeProperty("clip-path");
          introCopy?.style.removeProperty("transform");
          introCopy?.style.removeProperty("--intro-copy-y");
          introCopy?.style.removeProperty("--intro-title-scale");
          root
            .querySelector<HTMLElement>(".camps__intro-secondary")
            ?.style.removeProperty("transform");
          root
            .querySelectorAll(".camps__mask rect")
            .forEach((rect) => rect.setAttribute("width", "0.3334"));
        };
      });

      return () => media.revert();
    },
    { scope },
  );

  const finalBackground = getAsset(camps.finalAssetId);
  const introPrimary = getAsset(camps.introPrimaryAssetId);
  const introSecondary = getAsset(camps.introSecondaryAssetId);
  const markAsset = getAsset(camps.quote.markAssetId);

  return (
    <div
      className="camps camps--adelva"
      lang="ja"
      ref={scope}
      data-fidelity-section="our-camps"
      aria-labelledby="camps-heading"
    >
      <svg className="camps__mask" width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id={maskId} clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width="0.3333" height="1" />
            <rect x="0.3333" y="0" width="0.3334" height="1" />
            <rect x="0.6667" y="0" width="0.3333" height="1" />
          </clipPath>
        </defs>
      </svg>
      <div className="camps__viewport">
        <div className="camps__final-background" aria-hidden="true">
          <Image
            src={finalBackground.src}
            alt=""
            fill
            sizes="(max-aspect-ratio: 3/2) 160vh, 100vw"
            className="camps__image"
            style={{ objectPosition: finalBackground.focal }}
          />
          <span className="camps__final-scrim" />
        </div>

        <ul className="camps__track" ref={trackRef} data-motion-layer="camps-track">
          <li
            className="camps__panel camps__panel--intro"
            data-fidelity-section="intro"
            data-fidelity-parent="our-camps"
          >
            <div
              className="camps__intro-secondary"
              style={{ clipPath: `url(#${maskId})` }}
              aria-hidden="true"
            >
              <Image
                src={introSecondary.src}
                alt=""
                fill
                sizes="(max-aspect-ratio: 3/2) 160vh, 100vw"
                className="camps__image"
                style={{ objectPosition: introSecondary.focal }}
              />
            </div>
            <div
              ref={introPrimaryRef}
              className="camps__intro-primary"
              data-motion-layer="camps-intro-primary"
              aria-hidden="true"
            >
              <Image
                src={introPrimary.src}
                alt=""
                fill
                sizes="(max-aspect-ratio: 3/2) 160vh, 100vw"
                className="camps__image"
                style={{ objectPosition: introPrimary.focal }}
              />
            </div>
            <div
              ref={introCopyRef}
              className="camps__intro-copy"
              style={{ clipPath: `url(#${maskId})` }}
              data-motion-layer="camps-intro-copy"
            >
              <h2 className="camps__heading" id="camps-heading">
                {camps.title}
                <span className="home-title-ja" lang="ja">
                  {camps.titleJa}
                </span>
              </h2>
              <div className="camps__intro-detail">
                <p className="camps__intro-title">{camps.introTitle}</p>
                <p className="camps__intro-body">{camps.introBody}</p>
              </div>
            </div>
          </li>

          {camps.panels.map((panel) => {
            const asset = getAsset(panel.assetId);
            return (
              <li
                key={panel.id}
                className="camps__panel camps__panel--camp"
                data-fidelity-section={panel.id}
                data-fidelity-parent="our-camps"
              >
                <Link className="camps__link" href={panel.href}>
                  <div className="camps__media">
                    <Image
                      src={asset.src}
                      alt=""
                      fill
                      sizes="(max-width: 47.99rem) 80vh, 50vw"
                      className="camps__image"
                      style={{ objectPosition: asset.focal }}
                    />
                    <span className="camps__scrim" aria-hidden="true" />
                  </div>
                  {/* Measured target order: title, body, control label, then the
                      bracketed coordinates pinned to the foot of the card. */}
                  <div className="camps__body">
                    <h3 className="camps__title">{panel.title}</h3>
                    <p className="camps__copy">{panel.body}</p>
                    <span className="camps__cue">
                      {camps.cardCta}
                      <span className="camps__cue-glyph" aria-hidden="true" />
                    </span>
                    <span className="camps__coords numeric">{panel.number}</span>
                  </div>
                </Link>
              </li>
            );
          })}

          <li
            className="camps__panel camps__panel--quote"
            data-fidelity-section="camp-quote"
            data-fidelity-parent="our-camps"
          >
            <figure className="camps__quote">
              <Image
                src={markAsset.src}
                alt=""
                width={markAsset.width}
                height={markAsset.height}
                className="camps__quote-mark"
              />
              <span className="camps__quotation" aria-hidden="true">
                “
              </span>
              <blockquote className="camps__quote-text">
                <p>{camps.quote.text}</p>
              </blockquote>
              <span aria-hidden="true">-</span>
              <figcaption className="camps__quote-author">
                {camps.quote.author}
              </figcaption>
            </figure>
          </li>
        </ul>
      </div>
    </div>
  );
}
