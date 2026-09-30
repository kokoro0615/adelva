import type { CSSProperties } from "react";

import { geometry, issues } from "@/content/adelva-general-managers";
import styles from "./general-managers.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const media = "/media/adelva/general-managers/";
const regimes = [
  {
    key: "d",
    g: geometry.desktop,
    className: styles.desktop,
    sizes: "(min-width: 1920px) 1920px, 100vw",
  },
  { key: "m", g: geometry.mobile, className: styles.mobile, sizes: "100vw" },
] as const;

/** The before-selection plate, tiled so only the part near the viewport loads. */
function Tiles() {
  return regimes.map(({ key, g, className, sizes }) => {
    const { width, height, tiles, small } = g.plate;
    const step = height / tiles;
    return (
      <div key={key} className={`${styles.tiles} ${className}`} data-plate={key}>
        {Array.from({ length: tiles }, (_, n) => {
          const h = step + (n === tiles - 1 ? 0 : 4);
          const src = (w: number, f: string) => `${media}${key}-plate-${n}-${w}.${f}`;
          return (
            <picture
              key={n}
              style={{ top: `${(n / tiles) * 100}%`, height: `${(h / height) * 100}%` }}
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
                height={Math.round(h)}
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
 * The five selectable terraces in their lit state. Each is revealed by a circle
 * growing from its ring when the matching checkbox is checked (pure CSS).
 */
function LitFields() {
  return regimes.map(({ key, g, className }) => (
    <div key={key} className={`${styles.layer} ${className}`}>
      {issues.map((issue, i) => {
        const box = g.lit[issue.id];
        const k = g.width / g.plate.width;
        const x = box.left * k;
        const y = box.top * k;
        const w = box.width * k;
        const h = box.height * k;
        // the ring the light spreads from, in the overlay's own box
        const [rx, ry] =
          key === "d" ? geometry.desktop.rings[i] : [36, geometry.mobile.rows[i] + 30];
        return (
          <div
            key={issue.id}
            className={styles.lit}
            data-issue={issue.id}
            style={
              {
                "--x": x.toFixed(2),
                "--y": y.toFixed(2),
                "--w": w.toFixed(2),
                "--h": h.toFixed(2),
                "--ox": `${(((rx - x) / w) * 100).toFixed(1)}%`,
                "--oy": `${(((ry - y) / h) * 100).toFixed(1)}%`,
              } as Vars
            }
          >
            <picture>
              <source
                type="image/avif"
                srcSet={`${media}${key}-lit-${issue.id}.avif`}
              />
              <img
                src={`${media}${key}-lit-${issue.id}.webp`}
                width={box.width}
                height={box.height}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
        );
      })}
    </div>
  ));
}

/** Soft pools of shade behind the text column (the mock's `.shade` ellipses). */
const desktopPools = [
  [420, 420, 620, 360, 0.36],
  [380, 930, 520, 260, 0.34],
  [360, 2400, 560, 330, 0.36],
  [700, 3130, 860, 330, 0.34],
  [360, 4150, 500, 300, 0.34],
  [960, 4150, 480, 260, 0.26],
  [420, 4740, 560, 260, 0.34],
  [640, 5790, 760, 260, 0.34],
  [640, 6380, 780, 250, 0.36],
] as const;

export function TerracesPhoto() {
  return (
    <div className={styles.photo} aria-hidden="true" data-photo>
      <Tiles />
      <LitFields />
      <div className={styles.grade} />
      <div className={`${styles.layer} ${styles.desktop}`}>
        {desktopPools.map(([cx, cy, rx, ry, a]) => (
          <i
            key={cy}
            className={styles.pool}
            style={{ "--cx": cx, "--cy": cy, "--rx": rx, "--ry": ry, "--a": a } as Vars}
          />
        ))}
      </div>
      {regimes.map(({ key, g, className }) => (
        <div key={key} className={`${styles.layer} ${className}`}>
          <i
            className={styles.causeGlow}
            style={{ "--cx": g.cause[0], "--cy": g.cause[1] } as Vars}
            data-cause-glow
          />
        </div>
      ))}
      <div className={styles.headShade} />
      <div className={styles.sweep} data-sweep />
      <div className={styles.footFade} />
    </div>
  );
}
