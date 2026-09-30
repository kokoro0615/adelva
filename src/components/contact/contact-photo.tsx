import type { CSSProperties, Ref } from "react";

import { geometry } from "@/content/adelva-contact";
import styles from "./contact.module.css";

const media = "/media/adelva/contact/";
type Vars = CSSProperties & Record<`--${string}`, string | number>;

const sets = [
  {
    key: "d",
    className: styles.tilesDesktop,
    count: 8,
    width: 1536,
    height: 6144,
    small: 1024,
  },
  {
    key: "m",
    className: styles.tilesMobile,
    count: 10,
    width: 853,
    height: 12960,
    small: 600,
  },
] as const;

function Tiles() {
  return sets.map(({ key, className, count, width, height, small }) => (
    <div key={key} className={`${styles.tiles} ${className}`} data-plate={key}>
      {Array.from({ length: count }, (_, n) => {
        const h = height / count + (n === count - 1 ? 0 : 4);
        const sizes =
          key === "d"
            ? "(min-width: 2160px) 2160px, (min-width: 1037px) 100vw, 1037px"
            : "100vw";
        return (
          <picture
            key={n}
            style={{ top: `${(n / count) * 100}%`, height: `${(h / height) * 100}%` }}
          >
            <source
              type="image/avif"
              srcSet={`${media}${key}-plate-${n}-${small}.avif ${small}w, ${media}${key}-plate-${n}-${width}.avif ${width}w`}
              sizes={sizes}
            />
            <img
              src={`${media}${key}-plate-${n}-${width}.webp`}
              srcSet={`${media}${key}-plate-${n}-${small}.webp ${small}w, ${media}${key}-plate-${n}-${width}.webp ${width}w`}
              sizes={sizes}
              width={width}
              height={Math.round(h)}
              alt=""
              loading="lazy"
              fetchPriority={n === 0 ? "high" : undefined}
              decoding={n === 0 ? "sync" : "async"}
            />
          </picture>
        );
      })}
    </div>
  ));
}

export interface ClearTileRef {
  readonly regime: "d" | "m";
  /** Top of the tile on the page, in mock px. */
  readonly top: number;
  readonly height: number;
}

/**
 * The continuous photograph plus the layers that respond to the form. The
 * "fog lifted" variants of the active regime are mounted only after the first
 * interaction (`clearRegime`), and stay hidden until the script masks them.
 */
export function ContactPhoto({
  mode,
  clearRegime = null,
  registerClear,
  lightRef,
  ready = false,
}: {
  mode: "form" | "thanks";
  clearRegime?: "d" | "m" | null;
  registerClear?: (tile: ClearTileRef, node: HTMLDivElement | null) => void;
  lightRef?: Ref<HTMLDivElement>;
  ready?: boolean;
}) {
  return (
    <div className={styles.photo} aria-hidden="true" data-photo>
      <div className={styles.plate}>
        <Tiles />
        {mode === "form" &&
          (["d", "m"] as const).map((regime) => {
            const g = regime === "d" ? geometry.desktop : geometry.mobile;
            const [full, small, height] =
              regime === "d" ? [1536, 1024, 1024] : [853, 600, 1844];
            return g.clears.map(({ tile, top }, i) => (
              <div
                key={`${regime}${tile}`}
                ref={(node) =>
                  registerClear?.({ regime, top, height: g.clearHeight }, node)
                }
                className={styles.clear}
                data-first={i === 0 ? "" : undefined}
                data-clear={`${regime}${tile}`}
                hidden
                style={{
                  top: `${(top / g.height) * 100}%`,
                  height: `${(g.clearHeight / g.height) * 100}%`,
                }}
              >
                {clearRegime === regime && (
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={`${media}${regime}-clear-${tile}-${small}.avif ${small}w, ${media}${regime}-clear-${tile}-${full}.avif ${full}w`}
                      sizes={
                        regime === "d" ? "(min-width: 1037px) 100vw, 1037px" : "100vw"
                      }
                    />
                    <img
                      src={`${media}${regime}-clear-${tile}-${full}.webp`}
                      srcSet={`${media}${regime}-clear-${tile}-${small}.webp ${small}w, ${media}${regime}-clear-${tile}-${full}.webp ${full}w`}
                      sizes={
                        regime === "d" ? "(min-width: 1037px) 100vw, 1037px" : "100vw"
                      }
                      width={full}
                      height={height}
                      alt=""
                      decoding="async"
                    />
                  </picture>
                )}
              </div>
            ));
          })}
      </div>
      {mode === "form" && (
        <>
          {(
            [
              [1180, 700],
              [2060, 1500],
              [3500, 3300],
            ] as const
          ).map(([yd, ym]) => (
            <div
              key={yd}
              className={styles.mist}
              style={{ "--yd": yd, "--ym": ym } as Vars}
            />
          ))}
          <div ref={lightRef} className={styles.light} data-ready={ready} hidden />
          <div className={styles.fogExtra} />
        </>
      )}
    </div>
  );
}
