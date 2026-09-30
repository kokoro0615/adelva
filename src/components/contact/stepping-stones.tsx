"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { after, geometry } from "@/content/adelva-contact";
import styles from "./contact.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function pathThrough(
  points: readonly (readonly [number, number])[],
  vertical: boolean,
) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    d += vertical
      ? ` C ${x0} ${y0 + (y1 - y0) * 0.55}, ${x1} ${y1 - (y1 - y0) * 0.55}, ${x1} ${y1}`
      : ` C ${x0 + (x1 - x0) * 0.45} ${y0 - 26}, ${x1 - (x1 - x0) * 0.45} ${y1 - 26}, ${x1} ${y1}`;
  }
  return d;
}

function Stones({ regime, done }: { regime: "d" | "m"; done: boolean }) {
  const g = regime === "d" ? geometry.desktop : geometry.mobile;
  const height = g.notes - g.after;
  const points = g.stones.map(([x, y]) => [x, y - g.after] as const);
  const d = pathThrough(points, regime === "m");
  const r = regime === "d" ? 1 : 0.875;
  const maskId = `stones-draw-${regime}`;
  return (
    <svg
      className={styles.stones}
      viewBox={`0 0 ${g.width} ${height}`}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
      data-stones={regime}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path className={styles.stoneDraw} d={d} pathLength={1} />
        </mask>
      </defs>
      <path className={styles.stonePath} d={d} mask={`url(#${maskId})`} />
      {points.map(([x, y], i) => (
        <g key={i} className={styles.stoneNode} style={{ "--i": i } as Vars}>
          {i === 0 ? (
            <>
              <circle cx={x} cy={y} r={16 * r} fill="rgb(255 126 21 / 18%)" />
              <circle cx={x} cy={y} r={8 * r} fill="#ff7e15" />
              {done && (
                <path
                  className={styles.stoneCheck}
                  d={`M ${x - 3.5 * r} ${y} l ${2.6 * r} ${2.8 * r} l ${4.8 * r} ${-5.4 * r}`}
                  pathLength={1}
                  fill="none"
                  stroke="#0e1118"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          ) : i === 1 && done ? (
            <>
              <circle
                className={styles.stoneRing}
                cx={x}
                cy={y}
                r={13 * r}
                fill="none"
                stroke="#ff7e15"
                strokeWidth={1.5}
              />
              <circle cx={x} cy={y} r={7 * r} fill="#f1efea" />
            </>
          ) : (
            <circle
              cx={x}
              cy={y}
              r={8 * r}
              fill="rgb(14 17 24 / 45%)"
              stroke="#f1efea"
              strokeWidth={1.6}
            />
          )}
        </g>
      ))}
    </svg>
  );
}

/**
 * 「送信後の流れ」 on the stepping stones of the pool (spec §6, §9). On
 * /contact the path draws and the stones light 01→04 once when scrolled into
 * view; on /contact/thanks 01 is checked and 02 is the current step.
 */
export function SteppingStones({ mode }: { mode: "form" | "thanks" }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const done = mode === "thanks";

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const d = geometry.desktop;
  const m = geometry.mobile;
  const TitleTag = done ? "h1" : "h2";
  return (
    <section
      ref={ref}
      className={`${styles.after} ${styles.stepsLive}`}
      data-seen={seen}
      data-mode={mode}
      aria-labelledby="contact-after-title"
    >
      <p className={styles.accent} aria-hidden="true" />
      <TitleTag
        id="contact-after-title"
        className={`${styles.afterTitle} ${done ? styles.thanksTitle : ""}`}
      >
        {done ? (
          <>
            お問い合わせを
            <br className={styles.mobileOnly} />
            受け付けました
          </>
        ) : (
          after.title
        )}
      </TitleTag>
      <div className={styles.stonesDesktop}>
        <Stones regime="d" done={done} />
      </div>
      <div className={styles.stonesMobile}>
        <Stones regime="m" done={done} />
      </div>
      <ol className={styles.steps} aria-label={after.title}>
        {after.steps.map((step, i) => {
          const [xd, yd] = d.stones[i];
          const [xm, ym] = m.stones[i];
          const twoLine = i === 2;
          return (
            <li
              key={step}
              className={styles.stepItem}
              aria-current={done && i === 1 ? "step" : undefined}
              data-side={xm < m.width / 2 ? "right" : "left"}
              style={
                {
                  "--i": i,
                  "--xd": xd,
                  "--yd": yd - d.after + d.stepLabelDy,
                  "--xm": xm,
                  "--ym": ym - m.after - (twoLine ? 42 : 30),
                  "--half": m.stoneHalf[i],
                } as Vars
              }
            >
              <span className={styles.sn}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.st}>
                {twoLine ? (
                  <>
                    担当者からの
                    <br />
                    ご連絡
                  </>
                ) : (
                  step
                )}
                {done && i === 0 && (
                  <span className={styles.visuallyHidden}>（完了）</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <a className={`${styles.link} ${styles.afterLink}`} href={after.link.href}>
        {after.link.label}
        <span className={styles.la} aria-hidden="true" />
      </a>
    </section>
  );
}
