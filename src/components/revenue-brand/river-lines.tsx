import type { CSSProperties, ReactNode } from "react";
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
/*
 * The river is a stack of layers so that scrolling never repaints it:
 *
 *   under    track, sources, tributaries (drawn once per chapter)
 *   reveal   the finished main river, shown through a window whose lower
 *            edge moves with compositor-only transforms (see motion)
 *   tails    the same trick with a window of two moving edges, three times
 *   flow     sparks that are rewritten per frame (desktop only), own layer
 *   over     nodes, confluence, loop, process, end, bursts, viewfinder
 *   head     the comet, an HTML element moved by transform
 *
 * The main river is monotonic in y on both plates, so "everything above y"
 * is exactly "the path up to length L". Without motion every layer shows its
 * finished state and the moving layers are not rendered.
 */
export function RiverLines({ mobile = false }: { mobile?: boolean }) {
  const g = mobile ? mobileGeometry : desktopGeometry;
  const prefix = mobile ? "rb-m" : "rb-d";
  const mode = mobile ? "mobile" : "desktop";
  const { width, height } = g.plate;
  const k = mobile ? 853 / 390 : 1536 / 1440;
  const [lakeTop, lakeBottom] = g.lakeDottedRangeY;
  const target = viewfinderTargets[mode].room;
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
  const svgProps = {
    className: styles.lines,
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "xMidYMin meet",
    "aria-hidden": true,
    focusable: false,
  } as const;
  /* Text blocks hide the river (soft 24-unit edges); the lake hides the
     solid strokes so only its row of dots shows there. */
  const masks = (id: string) => (
    <>
      {g.lineMasks.map(({ id: maskId, rect }) => (
        <linearGradient
          key={maskId}
          id={`${id}-mask-${maskId}`}
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
        id={`${id}-text-mask`}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={width}
        height={height}
      >
        <rect width={width} height={height} fill="white" />
        {g.lineMasks.map(({ id: maskId, rect }) => (
          <rect
            key={maskId}
            x={rect[0]}
            y={rect[1] - 24}
            width={rect[2]}
            height={rect[3] + 48}
            fill={`url(#${id}-mask-${maskId})`}
          />
        ))}
      </mask>
      <mask
        id={`${id}-solid`}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={width}
        height={height}
      >
        <rect width={width} height={height} fill="white" />
        <rect y={lakeTop} width={width} height={lakeBottom - lakeTop} fill="black" />
      </mask>
      <clipPath id={`${id}-lake`}>
        <rect y={lakeTop} width={width} height={lakeBottom - lakeTop} />
      </clipPath>
    </>
  );
  /* A solid stroke of the main river outside the lake and the text. */
  const solidMain = (id: string, children: ReactNode) => (
    <g mask={`url(#${id}-text-mask)`}>
      <g mask={`url(#${id}-solid)`}>{children}</g>
    </g>
  );
  return (
    <div
      className={`${styles.river} ${mobile ? styles.mobileLines : styles.desktopLines}`}
      data-river-layer={mode}
      aria-hidden="true"
    >
      <svg {...svgProps} data-river-under>
        <defs>
          {masks(`${prefix}-u`)}
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
        <g mask={`url(#${prefix}-u-text-mask)`}>
          <path
            className={styles.track}
            d={g.paths.main.d}
            mask={`url(#${prefix}-u-solid)`}
          />
          <path
            className={styles.track}
            d={g.paths.main.d}
            clipPath={`url(#${prefix}-u-lake)`}
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
      </svg>
      <div className={styles.window} data-reveal>
        <div className={styles.windowContent} data-reveal-content>
          <svg {...svgProps}>
            <defs>{masks(`${prefix}-p`)}</defs>
            <g mask={`url(#${prefix}-p-text-mask)`}>
              <g mask={`url(#${prefix}-p-solid)`}>
                {["outer", "middle", "core"].map((weight) => (
                  <path
                    key={weight}
                    d={g.paths.main.d}
                    className={`${styles.mainLine} ${styles[weight]}`}
                    data-main-line={weight}
                  />
                ))}
              </g>
              {/* Across the lake the river is a row of fine dots, not a glow. */}
              <path
                d={g.paths.main.d}
                className={styles.lakeDots}
                clipPath={`url(#${prefix}-p-lake)`}
              />
            </g>
          </svg>
        </div>
      </div>
      {/* Comet tail: three stretches of the river ending at the head, long
          and faint to short and white, stretched by scroll speed. */}
      {[2, 1, 0].map((i) => (
        <div key={i} className={`${styles.window} ${styles.tailWindow}`} data-tail={i}>
          <div className={styles.window} data-tail-clip>
            <div className={styles.windowContent} data-tail-content>
              <svg {...svgProps}>
                <defs>{masks(`${prefix}-t${i}`)}</defs>
                {solidMain(
                  `${prefix}-t${i}`,
                  <path
                    d={g.paths.main.d}
                    className={`${styles.tail} ${styles[`tail${i}`]}`}
                  />,
                )}
              </svg>
            </div>
          </div>
        </div>
      ))}
      {/* The current: fine sparks that travel downstream only while the
          reader scrolls. Its geometry is rewritten per frame, so it keeps a
          layer of its own and only spans the visible stretch. */}
      <svg {...svgProps} className={`${styles.lines} ${styles.flowLayer}`}>
        <defs>{masks(`${prefix}-f`)}</defs>
        {solidMain(`${prefix}-f`, <path d="M0 0" className={styles.flow} data-flow />)}
      </svg>
      <svg {...svgProps} data-river={mode}>
        <defs>
          <radialGradient id={`${prefix}-halo`}>
            <stop stopColor="#ff7e15" stopOpacity=".55" />
            <stop offset=".45" stopColor="#ff7e15" stopOpacity=".22" />
            <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
          </radialGradient>
        </defs>
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
      {/* The comet: a glow that swells with scroll speed, a halo and a core. */}
      <div className={styles.head} data-head>
        <span className={styles.headGlow} data-head-glow />
        <span className={styles.headHalo} />
        <span className={styles.headCore} />
      </div>
    </div>
  );
}
