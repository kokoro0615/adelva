import type { CSSProperties } from "react";
import {
  desktopGeometry,
  mobileGeometry,
} from "@/content/adelva-revenue-brand-geometry";
import {
  acquisition,
  processCopy,
  viewfinderTargets,
} from "@/content/adelva-revenue-brand";
import styles from "./revenue-brand.module.css";
type Point = readonly number[];
export function RiverLines({ mobile = false }: { mobile?: boolean }) {
  const g = mobile ? mobileGeometry : desktopGeometry;
  const prefix = mobile ? "rb-m" : "rb-d";
  const { width, height } = g.plate;
  const k = mobile ? 853 / 390 : 1536 / 1440;
  const [lakeTop, lakeBottom] = g.lakeDottedRangeY;
  const target = viewfinderTargets[mobile ? "mobile" : "desktop"].room;
  const corners = [
    [target[0] - 12, target[1] - 12],
    [target[2] + 12, target[1] - 12],
    [target[2] + 12, target[3] + 12],
    [target[0] - 12, target[3] + 12],
  ];
  const sourceEntries = Object.entries(g.paths.sources);
  /* End marker half-size in CSS px (A4: ~20u on desktop, ~14 on mobile). */
  const endHalf = mobile ? 8 : 12;
  const leader = (a: Point, b: Point) =>
    `M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + 10 * k} ${b[0]} ${b[1]}`;
  return (
    <svg
      className={`${styles.lines} ${mobile ? styles.mobileLines : styles.desktopLines}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
      focusable="false"
      data-river={mobile ? "mobile" : "desktop"}
    >
      <defs>
        <radialGradient id={`${prefix}-halo`}>
          <stop stopColor="#ff7e15" stopOpacity=".55" />
          <stop offset=".45" stopColor="#ff7e15" stopOpacity=".22" />
          <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${prefix}-comet`}>
          <stop stopColor="#fffaf2" />
          <stop offset=".16" stopColor="#ffd9ad" stopOpacity=".85" />
          <stop offset=".42" stopColor="#ff9a45" stopOpacity=".32" />
          <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${prefix}-light`}>
          <stop stopColor="#fff3e6" />
          <stop offset=".3" stopColor="#ffb070" stopOpacity=".8" />
          <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
        </radialGradient>
        {g.lineMasks.map(({ id, rect }) => (
          <linearGradient
            key={id}
            id={`${prefix}-mask-${id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop stopColor="white" />
            <stop offset={Math.min(0.49, 24 / (rect[3] + 48))} stopColor="black" />
            <stop offset={Math.max(0.51, 1 - 24 / (rect[3] + 48))} stopColor="black" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
        ))}
        <mask
          id={`${prefix}-text-mask`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={width}
          height={height}
        >
          <rect width={width} height={height} fill="white" />
          {g.lineMasks.map(({ id, rect }) => (
            <rect
              key={id}
              x={rect[0]}
              y={rect[1] - 24}
              width={rect[2]}
              height={rect[3] + 48}
              fill={`url(#${prefix}-mask-${id})`}
            />
          ))}
        </mask>
        <mask
          id={`${prefix}-solid`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={width}
          height={height}
        >
          <rect width={width} height={height} fill="white" />
          <rect y={lakeTop} width={width} height={lakeBottom - lakeTop} fill="black" />
        </mask>
        <clipPath id={`${prefix}-lake`}>
          <rect y={lakeTop} width={width} height={lakeBottom - lakeTop} />
        </clipPath>
        <clipPath id={`${prefix}-progress`}>
          <rect width={width} height={height} data-dotted-clip />
        </clipPath>
        {sourceEntries.map(([id, s]) => (
          <linearGradient
            key={id}
            id={`${prefix}-source-${id}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2={s.node[1] + 120 * k}
          >
            <stop stopColor="#ff7e15" />
            <stop offset={s.node[1] / (s.node[1] + 120 * k)} stopColor="#ff7e15" />
            <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <g mask={`url(#${prefix}-text-mask)`}>
        <path
          className={styles.track}
          d={g.paths.main.d}
          mask={`url(#${prefix}-solid)`}
        />
        <path
          className={styles.track}
          d={g.paths.main.d}
          clipPath={`url(#${prefix}-lake)`}
          strokeDasharray="2 6"
        />
      </g>
      {sourceEntries.map(([id, s], i) => (
        <g key={id} data-source={id}>
          <path
            d={leader(g.chips.sources[id as keyof typeof g.chips.sources], s.node)}
            className={styles.leader}
            pathLength="1"
            data-source-leader
          />
          <path
            d={s.d}
            className={styles.sourceGlow}
            pathLength="1"
            stroke={`url(#${prefix}-source-${id})`}
            data-source-glow
          />
          <path
            d={s.d}
            className={styles.sourceLine}
            pathLength="1"
            stroke={`url(#${prefix}-source-${id})`}
            data-source-line
            style={{ "--len": 1, "--order": i } as CSSProperties}
          />
          <circle
            cx={s.node[0]}
            cy={s.node[1]}
            r={6 * k}
            className={styles.node}
            data-source-node
          />
        </g>
      ))}
      {/* Each branch is a soft glow under a bright core, drawn together. */}
      <path
        d={g.paths.tributaryLeft.d}
        className={styles.branchGlow}
        data-tributary-glow
        pathLength="1"
      />
      <path
        d={g.paths.tributaryRight.d}
        className={styles.branchGlow}
        data-tributary-glow
        pathLength="1"
      />
      <path
        d={g.paths.loopOther.d}
        className={styles.branchGlow}
        data-loop-other-glow
        pathLength="1"
      />
      <path
        d={g.paths.tributaryLeft.d}
        className={styles.branch}
        data-tributary="left"
        pathLength="1"
      />
      <path
        d={g.paths.tributaryRight.d}
        className={styles.branch}
        data-tributary="right"
        pathLength="1"
      />
      <path
        d={g.paths.loopOther.d}
        className={styles.branch}
        data-loop-other
        pathLength="1"
      />
      <path d={g.paths.cycle.d} fill="none" stroke="none" data-cycle />
      <g mask={`url(#${prefix}-text-mask)`}>
        <g mask={`url(#${prefix}-solid)`}>
          {["outer", "middle", "core"].map((weight) => (
            <path
              key={weight}
              d={g.paths.main.d}
              className={`${styles.mainLine} ${styles[weight]}`}
              data-main-line={weight}
            />
          ))}
        </g>
        <g clipPath={`url(#${prefix}-lake)`}>
          <g clipPath={`url(#${prefix}-progress)`}>
            {/* Across the lake the river is a row of fine dots, not a glow. */}
            <path d={g.paths.main.d} className={styles.lakeDots} />
          </g>
        </g>
        {/* The current: fine sparks that travel downstream only while the
            reader scrolls (scroll-driven, never autoplaying). */}
        {/* Geometry is written per frame from the length table and only
            spans the visible stretch behind the head. */}
        <g mask={`url(#${prefix}-solid)`}>
          <path d="M0 0" className={styles.flow} data-flow />
        </g>
        {/* Comet tail: three dashes of the main path ending at the head,
            long and faint to short and white, stretched by scroll speed. */}
        {[2, 1, 0].map((i) => (
          <path
            key={i}
            d="M0 0"
            className={`${styles.tail} ${styles[`tail${i}`]}`}
            data-tail={i}
          />
        ))}
      </g>
      {acquisition.items.map(({ id, branch }) => {
        const point = g.dots.ch1[id as keyof typeof g.dots.ch1];
        const chip = g.chips.ch1[id as keyof typeof g.chips.ch1];
        return (
          <g key={id} data-branch-node={id} data-branch-side={branch}>
            <path
              d={leader(chip, point)}
              className={styles.leader}
              data-leader
              pathLength="1"
            />
            <path className={styles.selectedBranch} data-selected-branch={id} />
            <circle
              cx={point[0]}
              cy={point[1]}
              r={6.5 * k}
              className={styles.ringedNode}
              data-ch1-node
            />
          </g>
        );
      })}
      <g data-confluence>
        <path
          d={`M${g.dots.confluence[0] + 20 * k} ${g.dots.confluence[1]}H${
            g.chips.ch1.revenue[0] - (mobile ? 44 : 50) * k
          }`}
          className={styles.revenueLeader}
        />
        <circle
          cx={g.dots.confluence[0]}
          cy={g.dots.confluence[1]}
          r={36 * k}
          fill={`url(#${prefix}-halo)`}
        />
        <circle
          cx={g.dots.confluence[0]}
          cy={g.dots.confluence[1]}
          r={19 * k}
          className={styles.haloRing}
        />
        <circle
          cx={g.dots.confluence[0]}
          cy={g.dots.confluence[1]}
          r={12 * k}
          className={styles.node}
        />
        <circle
          cx={g.dots.confluence[0]}
          cy={g.dots.confluence[1]}
          r={17 * k}
          className={styles.pulse}
          opacity={0}
          data-confluence-pulse
        />
      </g>
      {Object.entries(g.dots.loop).map(([id, point]) => (
        <g
          key={id}
          data-loop-node={id}
          data-loop-current={id === "posting" ? "true" : undefined}
        >
          <path
            d={leader(g.chips.loop[id as keyof typeof g.chips.loop], point)}
            className={styles.leader}
          />
          {id === "posting" && (
            <>
              <circle
                cx={point[0]}
                cy={point[1]}
                r={26 * k}
                fill={`url(#${prefix}-halo)`}
                className={styles.currentHalo}
              />
              <circle
                cx={point[0]}
                cy={point[1]}
                r={13 * k}
                className={`${styles.haloRing} ${styles.currentHalo}`}
              />
            </>
          )}
          <circle cx={point[0]} cy={point[1]} r={8 * k} className={styles.loopNode} />
          <circle
            cx={point[0]}
            cy={point[1]}
            r={12 * k}
            className={styles.pulse}
            opacity={0}
            data-loop-pulse={id}
            data-post-pulse={id === "posting" ? "" : undefined}
          />
        </g>
      ))}
      {/* Back upstream: a chevron on the ring between 改善 and ブランド方針. */}
      <path
        className={styles.loopArrow}
        transform={`translate(${g.loopArrow.x} ${g.loopArrow.y}) rotate(${g.loopArrow.angle})`}
        d={`M${-8 * k} ${-8 * k}L0 0L${-8 * k} ${8 * k}`}
        data-loop-arrow
      />
      {mobile
        ? Object.entries(mobileGeometry.dots.differences).map(([id, p]) => (
            <g key={id}>
              <path
                d={`M${p[0]} ${p[1]}H${120 * k}`}
                className={styles.leader}
                data-difference-line
              />
              <circle
                cx={p[0]}
                cy={p[1]}
                r={5 * k}
                className={styles.node}
                data-waypoint="difference"
              />
            </g>
          ))
        : [4818, 5013].map((y) => (
            <path
              key={y}
              data-waypoint="difference"
              data-waypoint-x={720 * k}
              data-waypoint-y={y * k}
              d={`M${570 * k} ${y * k}H${900 * k}m${-6 * k} ${-3 * k}l${6 * k} ${3 * k} -${6 * k} ${3 * k}M${720 * k} ${(y - 6) * k}v${12 * k}`}
              className={styles.leader}
              data-difference-line
            />
          ))}
      {processCopy.steps.map((step, i) => {
        const p = g.dots.process[step.number as keyof typeof g.dots.process];
        const left = step.mobile.side === "left";
        const end = mobile
          ? p[0] + (left ? -32 : 32) * k
          : (i === 1 ? 580 : i === 3 ? 554 : step.desktop.x - 14) * k;
        return (
          <g key={step.number} data-process-node={i + 1} data-state="reached">
            <path d={`M${p[0]} ${p[1]}H${end}`} className={styles.leader} />
            <circle
              cx={p[0]}
              cy={p[1]}
              r={30 * k}
              fill={`url(#${prefix}-halo)`}
              className={styles.currentGlow}
            />
            <circle cx={p[0]} cy={p[1]} r={17 * k} className={styles.currentRing} />
            <circle cx={p[0]} cy={p[1]} r={10 * k} className={styles.stepNode} />
          </g>
        );
      })}
      <g data-end>
        <circle
          cx={g.dots.process.end[0]}
          cy={g.dots.process.end[1]}
          r={40 * k}
          fill={`url(#${prefix}-halo)`}
        />
        <rect
          x={g.dots.process.end[0] - endHalf * k}
          y={g.dots.process.end[1] - endHalf * k}
          width={2 * endHalf * k}
          height={2 * endHalf * k}
          className={styles.endFrame}
        />
        <rect
          x={g.dots.process.end[0] - (endHalf / 2.4) * k}
          y={g.dots.process.end[1] - (endHalf / 2.4) * k}
          width={(endHalf / 1.2) * k}
          height={(endHalf / 1.2) * k}
          fill="#fff1e3"
        />
        <circle
          cx={g.dots.process.end[0]}
          cy={g.dots.process.end[1]}
          r={16 * k}
          className={styles.pulse}
          opacity={0}
          data-end-pulse
        />
      </g>
      <g data-head className={styles.head}>
        <circle r={54 * k} fill={`url(#${prefix}-comet)`} data-head-glow />
        <circle r={16 * k} fill={`url(#${prefix}-comet)`} />
        <circle r={4.6 * k} fill="#fffaf2" />
      </g>
      {/* Ignition bursts, reused round-robin wherever the light arrives. */}
      {[0, 1].map((i) => (
        <g key={i} data-burst={i} className={styles.burst} opacity="0">
          <circle r={11 * k} opacity={0} className={styles.shock} data-shock />
          <circle
            opacity={0}
            r={11 * k}
            className={`${styles.shock} ${styles.shockSoft}`}
            data-shock
          />
          {Array.from({ length: 10 }, (_, j) => (
            <circle
              key={j}
              cx={0}
              cy={0}
              r={2.4 * k}
              opacity={0}
              className={styles.spark}
              data-spark
            />
          ))}
        </g>
      ))}
      <circle r={4 * k} fill="#fff3e6" data-branch-particle opacity="0" />
      <circle r={4 * k} fill="#fff3e6" data-cycle-particle opacity="0" />
      <g data-viewfinder className={styles.viewfinder}>
        {corners.map(([x, y], i) => (
          <path
            key={i}
            data-corner={i}
            transform={`translate(${x} ${y})`}
            d={`M${[1, 2].includes(i) ? -22 * k : 22 * k} 0H0V${i > 1 ? -22 * k : 22 * k}`}
          />
        ))}
      </g>
    </svg>
  );
}
