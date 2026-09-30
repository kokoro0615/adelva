import type { CSSProperties } from "react";

import { geometry, tileRows } from "@/content/adelva-owner";
import styles from "./owner.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const media = "/media/adelva/owner/";
const regimes = [
  {
    key: "d",
    g: geometry.desktop,
    className: styles.desktop,
    sizes: "(min-width: 1920px) 1920px, 100vw",
  },
  { key: "m", g: geometry.mobile, className: styles.mobile, sizes: "100vw" },
] as const;

/** The clean plate, tiled so only the part near the viewport loads. */
function Tiles() {
  return regimes.map(({ key, g, className, sizes }) => {
    const { width, height, tiles, small } = g.plate;
    return (
      <div key={key} className={`${styles.tiles} ${className}`} data-plate={key}>
        {Array.from({ length: tiles }, (_, n) => {
          const [top, rows] = tileRows(height, tiles, n);
          const src = (w: number, f: string) => `${media}${key}-plate-${n}-${w}.${f}`;
          return (
            <picture
              key={n}
              style={{
                top: `${(top / height) * 100}%`,
                height: `${(rows / height) * 100}%`,
              }}
            >
              <source
                type="image/avif"
                srcSet={`${src(small, "avif")} ${small}w, ${src(width, "avif")} ${width}w`}
                sizes={sizes}
              />
              <img
                src={src(width, "webp")}
                srcSet={`${src(small, "webp")} ${small}w, ${src(width, "webp")} ${width}w`}
                sizes={sizes}
                width={width}
                height={rows}
                alt=""
                loading={n < 2 ? "eager" : "lazy"}
                fetchPriority={n === 0 ? "high" : undefined}
                decoding={n === 0 ? "sync" : "async"}
              />
            </picture>
          );
        })}
      </div>
    );
  });
}

/**
 * The same roof void a few minutes before sunrise. On load it gives way to the
 * morning plate along the direction of the light (CSS, spec §9); it is never
 * painted with reduced motion.
 */
function Dawn() {
  return regimes.map(({ key, g, className, sizes }) => {
    const { width, height, small } = g.dawn;
    const src = (w: number, f: string) => `${media}${key}-dawn-${w}.${f}`;
    return (
      <div
        key={key}
        className={`${styles.dawn} ${className}`}
        style={{ "--dh": height / (g.plate.width / g.width) } as Vars}
        data-dawn={key}
      >
        <div className={styles.dawnWipe}>
          <div className={styles.dawnInner}>
            <picture>
              <source
                type="image/avif"
                srcSet={`${src(small, "avif")} ${small}w, ${src(width, "avif")} ${width}w`}
                sizes={sizes}
              />
              <img
                src={src(width, "webp")}
                srcSet={`${src(small, "webp")} ${small}w, ${src(width, "webp")} ${width}w`}
                sizes={sizes}
                width={width}
                height={height}
                alt=""
                decoding="async"
              />
            </picture>
          </div>
        </div>
        <i className={styles.dawnBloom} />
      </div>
    );
  });
}

/** The light that falls on the chosen phase of 01: a shaft from the high window and a pool. */
function Beam() {
  return (
    <div className={styles.beam} data-beam>
      <i className={styles.shaft} />
      <i className={styles.beamPool} />
    </div>
  );
}

/** Soft darkness behind the text (the mock's `.pool-dark`, the inverse of a lantern's pool). */
function Pools() {
  return regimes.map(({ key, g, className }) => (
    <div key={key} className={`${styles.layer} ${className}`}>
      {g.pools.map(([x, y, w, h]) => (
        <i
          key={`${x}-${y}`}
          className={styles.pool}
          style={{ "--x": x, "--y": y, "--w": w, "--h": h } as Vars}
        />
      ))}
    </div>
  ));
}

/** The charcoal's breath and the kettle's steam; painted only while the motion runs them. */
function Hearth() {
  return regimes.map(({ key, g, className }) => {
    const [x0, y0, x1, y1] = g.ember;
    const [sx, sy] = g.spout;
    return (
      <div key={key} className={`${styles.layer} ${className}`}>
        <picture
          className={styles.emberBreath}
          style={{ "--x": x0, "--y": y0, "--w": x1 - x0, "--h": y1 - y0 } as Vars}
          data-breath
        >
          <source type="image/avif" srcSet={`${media}${key}-ember.avif`} />
          <img
            src={`${media}${key}-ember.webp`}
            width={Math.round((x1 - x0) * (g.plate.width / g.width))}
            height={Math.round((y1 - y0) * (g.plate.width / g.width))}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div
          className={styles.steam}
          style={{ "--x": sx, "--y": sy, "--dir": key === "d" ? 1 : -1 } as Vars}
          data-steam
        >
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  });
}

export function HearthPhoto() {
  return (
    <div className={styles.photo} aria-hidden="true" data-photo>
      <Tiles />
      <Dawn />
      <div className={styles.veil} />
      <Pools />
      <Beam />
      <Hearth />
      <div className={styles.footFade} />
    </div>
  );
}
