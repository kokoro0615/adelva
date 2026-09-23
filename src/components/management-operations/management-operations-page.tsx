/* eslint-disable @next/next/no-img-element -- pre-optimized WebP plates with
   reserved dimensions; the process layers must share one natural-pixel plane
   with their SVG lines, which next/image's wrapper sizing would break. */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import {
  audienceLinks,
  boundaries,
  breadcrumb,
  buildingPlate,
  chapterIndex,
  chapters,
  hero,
  mobileProcessStage,
  processCopy,
  processStage,
  type Chapter,
  type FloorId,
  type Service,
} from "@/content/adelva-management-operations";

import { ManagementOperationsMotion } from "./management-operations-motion";
import { RoomCarousel } from "./room-carousel";
import styles from "./management-operations.module.css";

const media = "/media/adelva/management-operations/";

/** Plate px per u (CSS px at a 1440px-wide section). */
const PLATE_PER_U = buildingPlate.widthPx / 1440;

/** Mobile hero plate: floors lit one after another on first paint. */
const mobileFloorsPx: Record<FloorId, readonly [number, number]> = {
  meeting: [1095, 1303],
  office: [1340, 1540],
  lobby: [1580, 1804],
  restaurant: [1848, 2077],
  guest: [2118, 2323],
  staff: [2360, 2535],
};
const floorOrder: readonly FloorId[] = [
  "meeting",
  "office",
  "lobby",
  "restaurant",
  "guest",
  "staff",
];

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Renders one approved string with the line breaks of both adopted mocks.
 * The text is emitted once; `<br>` elements carry the breakpoint they belong
 * to, so the copy never duplicates for assistive technology.
 */
function BrokenText({
  lines,
}: {
  lines: { readonly desktop: readonly string[]; readonly mobile: readonly string[] };
}) {
  const cuts = (parts: readonly string[]) => {
    const result = new Set<number>();
    let offset = 0;
    for (const part of parts.slice(0, -1)) {
      offset += part.length;
      result.add(offset);
    }
    return result;
  };
  const text = lines.desktop.join("");
  const desktop = cuts(lines.desktop);
  const mobile = cuts(lines.mobile);
  const points = [...new Set([...desktop, ...mobile])].sort((a, b) => a - b);
  const nodes: ReactNode[] = [];
  let start = 0;
  for (const point of [...points, text.length]) {
    nodes.push(text.slice(start, point));
    if (point < text.length) {
      const both = desktop.has(point) && mobile.has(point);
      nodes.push(
        <br
          key={point}
          className={
            both
              ? undefined
              : desktop.has(point)
                ? styles.desktopBreak
                : styles.mobileBreak
          }
        />,
      );
    }
    start = point;
  }
  return <>{nodes}</>;
}

/**
 * Sets 中黒 at about two-thirds of a full width, as the adopted mocks do in
 * their Mincho headings. The text node stays the approved string.
 */
function Tight({ children }: { children: string }) {
  return children.split("・").map((part, index) => (
    <span key={index}>
      {index > 0 && <span className={styles.nakaguro}>・</span>}
      {part}
    </span>
  ));
}

function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      →
    </span>
  );
}

/** Estimated advance of a row label: full-width glyphs are 1em, ASCII ~0.53em. */
function labelEm(text: string) {
  return Array.from(text).reduce(
    (sum, char) => sum + (char.charCodeAt(0) < 0x2000 ? 0.53 : 1),
    0,
  );
}

const ROW_FONT_U = 26;
const ROW_NAME_X_U = 158;
const LINE_GAP_U = 18;

/** Leader line, in plate px. JS re-measures the start on font load/resize. */
function leaderPath(service: Service) {
  const y = (service.top + 13) * PLATE_PER_U;
  const start =
    (ROW_NAME_X_U + labelEm(service.name) * ROW_FONT_U + LINE_GAP_U) * PLATE_PER_U;
  if (service.target === "bracket") {
    return `M${start.toFixed(1)} ${y.toFixed(1)}H${buildingPlate.bracketPx.x}`;
  }
  const { x, y: ty } = service.target;
  const kink = Math.max(buildingPlate.kinkPx, start + 20);
  return ty === y
    ? `M${start.toFixed(1)} ${y.toFixed(1)}H${x}`
    : `M${start.toFixed(1)} ${y.toFixed(1)}H${kink}L${x} ${ty}`;
}

function SectionMapOverlay() {
  const { floorsPx, facadePx, bracketPx, widthPx, heightPx } = buildingPlate;
  return (
    <svg
      className={styles.mapOverlay}
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      aria-hidden="true"
      focusable="false"
      data-map-overlay
    >
      <defs>
        <radialGradient id="mo-room-glow">
          <stop offset="0" stopColor="#ffd9a3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb566" stopOpacity="0" />
        </radialGradient>
      </defs>
      {floorOrder.map((floor) => (
        <g key={floor} data-floor={floor}>
          <rect
            className={styles.floorVeil}
            x={facadePx.left}
            y={floorsPx[floor][0]}
            width={facadePx.right - facadePx.left}
            height={floorsPx[floor][1] - floorsPx[floor][0]}
            data-floor-veil
          />
          <ellipse
            className={styles.floorGlow}
            cx={(facadePx.left + facadePx.right) / 2}
            cy={(floorsPx[floor][0] + floorsPx[floor][1]) / 2}
            rx={(facadePx.right - facadePx.left) / 2}
            ry={(floorsPx[floor][1] - floorsPx[floor][0]) / 1.6}
            fill="url(#mo-room-glow)"
          />
        </g>
      ))}
      <path
        className={styles.bracket}
        d={`M${bracketPx.x + bracketPx.tick} ${bracketPx.top}H${bracketPx.x}V${bracketPx.bottom}H${bracketPx.x + bracketPx.tick}`}
        pathLength={1}
        data-line="bracket"
        data-chapter-line="opening-operations"
      />
      {chapters.flatMap((chapter) =>
        chapter.services.map((service) => (
          <g key={service.number} data-leader={service.number}>
            <path
              className={styles.leader}
              d={leaderPath(service)}
              pathLength={1}
              data-line={service.number}
              data-chapter-line={chapter.id}
            />
            {service.target !== "bracket" && (
              <>
                <circle
                  className={styles.dotHalo}
                  cx={service.target.x}
                  cy={service.target.y}
                  r={16}
                />
                <circle
                  className={styles.dot}
                  cx={service.target.x}
                  cy={service.target.y}
                  r={8}
                  data-dot={service.number}
                />
              </>
            )}
          </g>
        )),
      )}
    </svg>
  );
}

function MobileFloorOverlay() {
  return (
    <svg
      className={styles.mobileFloors}
      viewBox="0 0 853 3272"
      aria-hidden="true"
      focusable="false"
    >
      {floorOrder.map((floor) => (
        <rect
          key={floor}
          className={styles.floorVeil}
          x={340}
          y={mobileFloorsPx[floor][0]}
          width={513}
          height={mobileFloorsPx[floor][1] - mobileFloorsPx[floor][0]}
          data-floor-veil
        />
      ))}
    </svg>
  );
}

function Scene() {
  return (
    <div className={styles.scene} aria-hidden="true" data-scene>
      <picture className={styles.scenePicture}>
        <source media="(max-width: 599.98px)" srcSet={`${media}m-hero.webp`} />
        <img
          src={buildingPlate.src}
          srcSet={`${buildingPlate.srcSmall} 1024w, ${buildingPlate.src} 1536w`}
          sizes="(min-width: 1920px) 1920px, 100vw"
          width={buildingPlate.widthPx}
          height={buildingPlate.heightPx}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <SectionMapOverlay />
      <MobileFloorOverlay />
      <div className={styles.sceneFade} />
      <div className={styles.tickRail}>
        <ol className={styles.ticks} data-ticks>
          {chapters.map((chapter, index) => (
            <li
              key={chapter.id}
              data-tick={chapter.id}
              data-current={index === 0 || undefined}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="mo-title" data-section="hero">
      <nav className={styles.breadcrumb} aria-label="パンくず">
        <ol>
          {breadcrumb.items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link prefetch={false} href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={"current" in item && item.current ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <p className={styles.eyebrow}>
        <span className={styles.eyebrowIndex}>{hero.index}</span>
        <span className={styles.eyebrowRule} aria-hidden="true" />
        <span>{hero.indexLabel}</span>
      </p>
      <h1 id="mo-title" className={styles.title}>
        <Tight>{hero.title}</Tight>
      </h1>
      <p className={styles.roman} lang="en">
        {hero.roman}
      </p>
      <p className={styles.lead}>
        {hero.lead.map((line) => (
          <span key={line} className={styles.leadLine}>
            {line}
          </span>
        ))}
      </p>
      <Link prefetch={false} href={hero.cta.href} className={styles.cta}>
        {hero.cta.label}
        <Arrow />
      </Link>
      <nav className={styles.chapterIndex} aria-label={chapterIndex.label}>
        <ul>
          {chapterIndex.items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} data-index-link={item.id}>
                <span className={styles.indexTitle}>
                  <Tight>{item.title}</Tight>
                </span>
                <span className={styles.indexNumbers}>{item.numbers}</span>
                <span className={styles.indexArrow} aria-hidden="true">
                  ↓
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

function Photo({
  name,
  className,
  width = 1280,
  height = 853,
  small = true,
  sizes = "(min-width: 600px) 640px, 100vw",
}: {
  name: string;
  className?: string;
  width?: number;
  height?: number;
  small?: boolean;
  sizes?: string;
}) {
  return (
    <div className={`${styles.photo} ${className ?? ""}`} data-photo aria-hidden="true">
      <img
        src={`${media}${name}.webp`}
        srcSet={
          small
            ? `${media}${name}-720.webp 720w, ${media}${name}.webp 1280w`
            : undefined
        }
        sizes={small ? sizes : undefined}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function ChapterPhoto({ chapter }: { chapter: Chapter }) {
  switch (chapter.photo) {
    case "meeting":
      return <Photo name="room-meeting" className={styles.photoMeeting} />;
    case "building-thumb":
      return (
        <Photo
          name="building-thumb"
          className={styles.photoThumb}
          width={384}
          height={1040}
          small={false}
        />
      );
    case "rooms":
      return <RoomCarousel media={media} />;
    case "staff":
      return <Photo name="room-staff" className={styles.photoStaff} />;
    default:
      return null;
  }
}

function Chapters() {
  return (
    <div className={styles.chapters} data-chapters>
      {chapters.map((chapter, chapterIndexNumber) => (
        <section
          key={chapter.id}
          id={chapter.id}
          tabIndex={-1}
          className={styles.chapter}
          aria-labelledby={`${chapter.id}-title`}
          data-chapter={chapter.id}
          data-chapter-style={chapterIndexNumber < 2 ? "index" : "plain"}
          data-active-room={chapter.photo === "rooms" ? "lobby" : undefined}
          data-floors={chapter.floors.join(" ")}
          style={{ "--top": chapter.top } as Vars}
        >
          <ChapterPhoto chapter={chapter} />
          <h2 id={`${chapter.id}-title`} className={styles.chapterTitle}>
            <Tight>{chapter.title}</Tight>
          </h2>
          <ul className={styles.rows}>
            {chapter.services.map((service) => (
              <li
                key={service.number}
                className={styles.row}
                data-row={service.number}
                style={{ "--row-top": service.top - chapter.top } as Vars}
              >
                <span className={styles.rowNumber}>{service.number}</span>
                <span className={styles.rowName} data-row-name>
                  {service.name}
                </span>
                <i className={styles.rowRule} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Boundaries() {
  return (
    <section
      className={styles.boundaries}
      aria-labelledby="mo-boundaries-title"
      data-section="boundaries"
    >
      <div className={styles.boundariesInner}>
        <Photo
          name="limestone"
          className={styles.limestone}
          width={840}
          height={1260}
          small={false}
        />
        <div className={styles.boundariesBody}>
          <h2 id="mo-boundaries-title" className={styles.boundariesTitle}>
            {boundaries.title}
          </h2>
          <div className={styles.pairs}>
            {boundaries.pairs.map((pair) => (
              <dl key={pair[0].number} className={styles.pair}>
                {pair.map((item) => (
                  <div key={item.number} className={styles.pairItem}>
                    <dt>
                      <span className={styles.pairNumber}>{item.number}</span>
                      <span>{item.name}</span>
                    </dt>
                    <dd>{item.scope}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
          <p className={styles.note}>{boundaries.note}</p>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg
      className={styles.check}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="12" />
      <path d="M6.6 12.4 10.3 16 17.4 8.6" pathLength={1} />
    </svg>
  );
}

function ProcessLines({
  landings,
  from,
  to,
  width,
  height,
  className,
  variant,
}: {
  landings: readonly number[];
  from: number;
  to: number;
  width: number;
  height: number;
  className: string;
  variant: "desktop" | "mobile";
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      data-landings={variant}
    >
      <defs>
        <radialGradient id={`mo-halo-${variant}`}>
          <stop offset="0" stopColor="#ffb05c" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
        </radialGradient>
      </defs>
      {landings.map((y, index) => (
        <g
          key={y}
          className={styles.landing}
          data-landing={index + 1}
          data-state="passed"
        >
          <ellipse
            className={styles.landingHalo}
            cx={(from + to) / 2 - (variant === "desktop" ? 20 : 0)}
            cy={y + 4}
            rx={variant === "desktop" ? 170 : 190}
            ry={variant === "desktop" ? 20 : 26}
            fill={`url(#mo-halo-${variant})`}
          />
          <line className={styles.landingGlow} x1={from} x2={to} y1={y} y2={y} />
          <line className={styles.landingLine} x1={from} x2={to} y1={y} y2={y} />
          <circle
            className={styles.landingDot}
            cx={to}
            cy={y}
            r={variant === "desktop" ? 5.5 : 9}
          />
        </g>
      ))}
    </svg>
  );
}

function Steps() {
  return (
    <ol className={styles.steps} aria-label={processCopy.stepsLabel} data-steps>
      {processCopy.steps.map((step, index) => (
        <li
          key={step.number}
          className={styles.step}
          data-step={index + 1}
          data-state="passed"
          style={
            {
              "--landing": processStage.landingsPx[index],
              "--m-landing": mobileProcessStage.landingsPx[index],
            } as Vars
          }
        >
          <span className={styles.stepNumber}>{step.number}</span>
          <div className={styles.stepHead}>
            <h3 className={styles.stepName}>{step.name}</h3>
            <Check />
          </div>
          <ul className={styles.tags}>
            {step.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function Process() {
  const { base, lit, cabin } = processStage;
  return (
    <section
      className={styles.process}
      aria-labelledby="mo-process-title"
      data-section="process"
      data-process
    >
      <div className={styles.stage} data-stage data-progress="complete">
        <div className={styles.plate} data-plate>
          <div className={styles.layers} aria-hidden="true">
            <img
              className={styles.layerBase}
              src={base}
              width={2048}
              height={1286}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className={styles.dawn} data-dawn>
              <img
                src={lit}
                width={2048}
                height={1286}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className={styles.shaft} data-shaft>
              <div className={styles.shaftWindow} data-shaft-window>
                <img
                  src={lit}
                  width={2048}
                  height={1286}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <div className={styles.door} data-door>
              <img
                src={lit}
                width={2048}
                height={1286}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
            <img
              className={styles.cabin}
              src={cabin}
              width={480}
              height={480}
              alt=""
              loading="lazy"
              decoding="async"
              data-cabin
            />
            <ProcessLines
              className={styles.landings}
              landings={processStage.landingsPx}
              from={processStage.lineFromPx}
              to={processStage.lineToPx}
              width={processStage.widthPx}
              height={processStage.heightPx}
              variant="desktop"
            />
          </div>
          <div className={styles.mobileLayers} aria-hidden="true">
            <img
              className={styles.mobileBase}
              src={mobileProcessStage.base}
              width={mobileProcessStage.widthPx}
              height={mobileProcessStage.heightPx}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className={styles.mobileShaft} data-mobile-shaft>
              <div className={styles.mobileShaftWindow} data-shaft-window>
                <img
                  src={mobileProcessStage.lit}
                  width={420}
                  height={2020}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <div className={styles.mobileDawn} data-mobile-dawn />
            <img
              className={styles.mobileCabin}
              src={cabin}
              width={480}
              height={480}
              alt=""
              loading="lazy"
              decoding="async"
              data-mobile-cabin
            />
            <ProcessLines
              className={styles.mobileLandings}
              landings={mobileProcessStage.landingsPx}
              from={mobileProcessStage.lineFromPx}
              to={mobileProcessStage.lineToPx}
              width={mobileProcessStage.widthPx}
              height={mobileProcessStage.heightPx}
              variant="mobile"
            />
          </div>
          <div className={styles.processIntro}>
            <div className={styles.processHeading}>
              <h2
                id="mo-process-title"
                className={styles.processTitle}
                data-process-title
              >
                {processCopy.title}
              </h2>
              <span className={styles.headingRule} aria-hidden="true" data-heading-rule>
                <i data-heading-node />
              </span>
            </div>
            <p className={styles.processLead}>
              <BrokenText lines={processCopy.leadLines} />
            </p>
            <p className={styles.processBody}>
              <BrokenText lines={processCopy.bodyLines} />
            </p>
          </div>
          <Steps />
          <Link
            prefetch={false}
            href={processCopy.link.href}
            className={styles.processLink}
          >
            {processCopy.link.label}
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Audiences() {
  return (
    <section
      className={styles.audiences}
      aria-labelledby="mo-audience-title"
      data-section="audiences"
    >
      <h2 id="mo-audience-title" className={styles.visuallyHidden}>
        {audienceLinks.title}
      </h2>
      <ul>
        {audienceLinks.items.map((item) => (
          <li key={item.href}>
            <Link prefetch={false} href={item.href} className={styles.audienceLink}>
              {item.label}
              <Arrow />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ManagementOperationsPage(): ReactNode {
  return (
    <div lang="ja" className={styles.page} data-management-operations>
      <a className={styles.skip} href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <ScrollProvider />
      <ManagementOperationsMotion>
        <main id="main-content" className={styles.main}>
          <div className={styles.map} data-map>
            <Scene />
            <Hero />
            <Chapters />
          </div>
          <Boundaries />
          <Process />
          <Audiences />
        </main>
      </ManagementOperationsMotion>
      <HomeFooter />
    </div>
  );
}
