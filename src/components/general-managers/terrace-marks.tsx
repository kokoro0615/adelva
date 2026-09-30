import type { CSSProperties, ReactNode } from "react";

import { decision, geometry } from "@/content/adelva-general-managers";
import styles from "./general-managers.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Point = readonly [number, number];
type Box = readonly [number, number, number, number];

const d = geometry.desktop;
const m = geometry.mobile;

/** A userSpaceOnUse mask resolves its default region against the viewport size,
 *  not the viewBox origin; give it the viewBox itself. */
const region = ([x, y, width, height]: Box) => ({ x, y, width, height });

/** One cubic per fall: drop straight, then run along the levee (the mock's path). */
export function gatePath(points: readonly Point[]) {
  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const mid = (ay + by) / 2;
    path += ` C${ax},${mid} ${bx},${mid - 10} ${bx},${by}`;
  }
  return path;
}

function Svg({
  box,
  regime,
  children,
  name,
}: {
  box: Box;
  regime: "d" | "m";
  children: ReactNode;
  name: string;
}) {
  const [x, y, w, h] = box;
  return (
    <svg
      className={`${styles.marks} ${regime === "d" ? styles.desktop : styles.mobile}`}
      viewBox={`${x} ${y} ${w} ${h}`}
      style={{ "--bx": x, "--by": y, "--bw": w, "--bh": h } as Vars}
      aria-hidden="true"
      focusable="false"
      data-marks={name}
      data-regime={regime}
    >
      {children}
    </svg>
  );
}

function Ring({
  at,
  r,
  width,
  no,
}: {
  at: Point;
  r: number;
  width: number;
  no?: string;
}) {
  return (
    <g>
      <circle
        className={styles.markRing}
        cx={at[0]}
        cy={at[1]}
        r={r}
        strokeWidth={width}
        vectorEffect="non-scaling-stroke"
      />
      {no ? (
        <text
          className={styles.markNo}
          x={at[0]}
          y={at[1] + 4}
          textAnchor="middle"
          style={{ fontSize: r * 0.62 }}
        >
          {no}
        </text>
      ) : (
        <circle className={styles.markDot} cx={at[0]} cy={at[1]} r={r * 0.15} />
      )}
    </g>
  );
}

/** 02: the marks for each point of judgement (spec §9). */
function DecisionSvg({ regime }: { regime: "d" | "m" }) {
  const desk = regime === "d";
  const [cx, cy] = desk ? d.cause : m.cause;
  const [sx, sy] = desk ? d.symptom : m.symptom;
  const r = desk ? 22 : 17;
  const causePath = desk
    ? `M${sx - 6},${sy - 22} C${sx - 40},${sy - 110} ${cx + 70},${cy + 150} ${cx + 8},${cy + 22}`
    : `M${sx},${sy - 18} C${sx - 30},${sy - 80} ${cx + 40},${cy + 70} ${cx},${cy + 18}`;
  const flow = desk
    ? `M${cx},${cy + r} C${cx},${cy + 120} ${sx},${sy - 120} ${sx},${sy - r} M${sx},${sy + r} C${sx},${sy + 110} 1002,2730 1002,2762 C1002,2800 1060,2804 1060,${2862 - 18}`
    : `M${cx},${cy + r} C${cx},${cy + 60} ${sx},${sy - 70} ${sx},${sy - r}`;
  const boundary = desk
    ? "M640,2356 C820,2356 1060,2372 1440,2402"
    : "M0,2056 C110,2062 250,2080 390,2100";
  const up: Point = desk ? [1160, 2334] : [226, 2000];
  const down: Point = desk ? [1160, 2414] : [226, 2120];
  const chevron = ([x, y]: Point, dir: 1 | -1) =>
    `M${x - 7},${y + 4 * dir} l7,${-7 * dir} l7,${7 * dir}`;
  const id = `gm-${regime}-cause-draw`;
  const box: Box = desk ? [600, 2150, 840, 800] : [0, 1960, 390, 360];
  return (
    <Svg box={box} regime={regime} name="decision">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" {...region(box)}>
          <path
            d={causePath}
            fill="none"
            stroke="#fff"
            strokeWidth={12}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={0}
            data-draw="cause"
          />
        </mask>
      </defs>
      <g className={styles.mode} data-mode="cause">
        <path
          className={styles.markLine}
          d={causePath}
          strokeWidth={2}
          strokeDasharray={desk ? "2 7" : "2 6"}
          mask={`url(#${id})`}
          vectorEffect="non-scaling-stroke"
        />
        <Ring at={[cx, cy]} r={r} width={2.2} />
        <Ring at={[sx, sy]} r={r} width={1.8} />
      </g>
      <g className={styles.mode} data-mode="priority">
        {desk ? (
          <ellipse
            className={styles.markHair}
            cx={985}
            cy={2627}
            rx={318}
            ry={64}
            strokeWidth={1.4}
            strokeDasharray="4 6"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <ellipse
            className={styles.markHair}
            cx={215}
            cy={2168}
            rx={172}
            ry={66}
            strokeWidth={1.4}
            strokeDasharray="4 6"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          className={styles.markLine}
          d={flow}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        <Ring at={[cx, cy]} r={r} width={2.2} no="01" />
        <Ring at={[sx, sy]} r={r} width={1.8} no="02" />
        {desk && <Ring at={[1060, 2862]} r={18} width={1.6} no="03" />}
      </g>
      <g className={styles.mode} data-mode="authority">
        <path
          className={styles.markHair}
          d={boundary}
          strokeWidth={1.6}
          strokeDasharray="7 7"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className={styles.markHair}
          d={chevron(up, 1)}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className={styles.markHair}
          d={chevron(down, -1)}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </Svg>
  );
}

type TagSpec = {
  text: string;
  modes: string;
  d: readonly [number, number, number, number];
  m: readonly [number, number, number, number];
};

/** Labels on the photograph: [x, y, dx, dy] where the label starts dx/dy (z units) off x/y (k units). */
const tags: readonly TagSpec[] = [
  {
    text: decision.cause,
    modes: "cause priority",
    d: [...d.cause, 34, -12],
    m: [...m.cause, 26, -11],
  },
  {
    text: decision.symptom,
    modes: "cause",
    d: [...d.symptom, 34, -12],
    m: [...m.symptom, 26, -11],
  },
  {
    text: decision.management,
    modes: "authority",
    d: [1176, 2334, 0, -12],
    m: [240, 2000, 0, -11],
  },
  {
    text: decision.field,
    modes: "authority",
    d: [1176, 2414, 0, -12],
    m: [240, 2120, 0, -11],
  },
];

export function DecisionMarks() {
  return (
    <>
      <DecisionSvg regime="d" />
      <DecisionSvg regime="m" />
      {tags.map((t) => (
        <p
          key={t.text}
          className={`${styles.tag} ${styles.pooled}`}
          data-modes={t.modes}
          style={
            {
              "--txd": t.d[0],
              "--tyd": t.d[1],
              "--dxd": t.d[2],
              "--dyd": t.d[3],
              "--txm": t.m[0],
              "--tym": t.m[1],
              "--dxm": t.m[2],
              "--dym": t.m[3],
            } as Vars
          }
        >
          {t.text}
        </p>
      ))}
    </>
  );
}

/** 05: the orange line down the six spills, drawn by the motion layer. */
function GateSvg({ regime }: { regime: "d" | "m" }) {
  const desk = regime === "d";
  const gates = desk ? d.gates : m.gates;
  const path = gatePath(gates.slice(0, 5));
  const r = desk ? 12.5 : 11;
  const last = desk ? 15 : 13;
  const glow = `gm-${regime}-gate-glow`;
  const draw = `gm-${regime}-gate-draw`;
  const box: Box = desk ? [780, 4430, 480, 800] : [100, 5330, 240, 480];
  return (
    <Svg box={box} regime={regime} name="gates">
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#ffd7a8" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#ff9a4a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
        </radialGradient>
        <mask id={draw} maskUnits="userSpaceOnUse" {...region(box)}>
          <path
            d={path}
            fill="none"
            stroke="#fff"
            strokeWidth={14}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={0}
            data-gate-draw
          />
        </mask>
      </defs>
      <circle
        className={styles.gateGlow}
        r={desk ? 70 : 46}
        cx={gates[0][0]}
        cy={gates[0][1]}
        fill={`url(#${glow})`}
        opacity={0}
        data-gate-glow
      />
      <path
        className={styles.markLine}
        d={path}
        strokeWidth={desk ? 2.2 : 2}
        mask={`url(#${draw})`}
        vectorEffect="non-scaling-stroke"
        data-gate-line
      />
      {gates.map(([x, y], i) => {
        const end = i === gates.length - 1;
        return (
          <g key={i} data-gate-mark={i}>
            <circle
              className={styles.gateBurst}
              cx={x}
              cy={y}
              r={end ? last : r}
              fill="none"
              stroke={end ? "#f1efea" : "#ff7e15"}
              strokeWidth={1.5}
              opacity={0}
              vectorEffect="non-scaling-stroke"
              data-gate-burst
            />
            <circle
              className={styles.gateRing}
              cx={x}
              cy={y}
              r={end ? last : r}
              strokeWidth={desk ? 2.2 : 2}
              vectorEffect="non-scaling-stroke"
              data-done={end ? undefined : "true"}
              data-last={end ? "" : undefined}
            />
            {!end && (
              <circle
                className={styles.gateDot}
                cx={x}
                cy={y}
                r={desk ? 4 : 3.5}
                data-gate-dot
              />
            )}
          </g>
        );
      })}
      <circle
        className={styles.gateHead}
        r={desk ? 4.5 : 4}
        cx={gates[0][0]}
        cy={gates[0][1]}
        fill="#fff4e6"
        opacity={0}
        data-gate-head
      />
    </Svg>
  );
}

export function GateMarks() {
  return (
    <>
      <GateSvg regime="d" />
      <GateSvg regime="m" />
    </>
  );
}
