/* eslint-disable @next/next/no-img-element -- pre-optimized, art-directed WebP
   plates with reserved dimensions. Each photograph shares its box with an
   overlay (finder, dots) positioned in the same proportional plane, which
   next/image's wrapper sizing would break. */
import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { IntentLink as Link } from "@/components/intent-link";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import {
  audienceLinks,
  breadcrumb,
  desktopGeometry,
  hero,
  integrated,
  magnificationLines,
  mobileGeometry,
  plates,
  rail,
  responsibilities,
  stages,
  verification,
  type DescentGeometry,
  type Lines,
  type Plate,
  type Rect,
  type Stage,
} from "@/content/adelva-approach-page";
import { routeStatusOf } from "@/content/adelva-navigation";

import { ApproachMotion } from "./approach-motion";
import styles from "./approach.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Renders one approved string with the line breaks of both adopted mocks.
 * The text is emitted once; each `<br>` carries the layout it belongs to, so
 * assistive technology never reads the copy twice.
 */
function Broken({ lines }: { lines: Lines }) {
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

/** Sets 中黒 tighter, as the adopted mock's Mincho headings do. */
function Tight({ children }: { children: string }) {
  return children.split("・").map((part, index) => (
    <span key={index}>
      {index > 0 && <span className={styles.nakaguro}>・</span>}
      {part}
    </span>
  ));
}

function Arrow({ className }: { className?: string }) {
  return (
    <span className={`${styles.arrow} ${className ?? ""}`} aria-hidden="true">
      →
    </span>
  );
}

/** A destination this repository cannot resolve yet is linked, never prefetched. */
function SmartLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
} & Record<`data-${string}`, string>) {
  return routeStatusOf(href) === "available" ? (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className} data-route-status="pending" {...rest}>
      {children}
    </a>
  );
}

const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(4)}%`;

/** A rectangle inside a box, as percentages, for both viewport families. */
function boxVars(
  prefix: string,
  rect: { d: Rect; dBox: Rect; m: Rect; mBox: Rect },
): Record<string, string> {
  const place = (r: Rect, box: Rect) => ({
    x: pct(r[0] - box[0], box[2]),
    y: pct(r[1] - box[1], box[3]),
    w: pct(r[2], box[2]),
    h: pct(r[3], box[3]),
  });
  const d = place(rect.d, rect.dBox);
  const m = place(rect.m, rect.mBox);
  return {
    [`--${prefix}-dx`]: d.x,
    [`--${prefix}-dy`]: d.y,
    [`--${prefix}-dw`]: d.w,
    [`--${prefix}-dh`]: d.h,
    [`--${prefix}-mx`]: m.x,
    [`--${prefix}-my`]: m.y,
    [`--${prefix}-mw`]: m.w,
    [`--${prefix}-mh`]: m.h,
  };
}

/** Art-directed photograph: the desktop plate at ≥1024px, the mobile one below. */
function Photo({
  desktop,
  mobile,
  alt,
  className,
  priority = false,
  sizes,
}: {
  desktop: Plate;
  mobile: Plate;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: { desktop: string; mobile: string };
}) {
  const srcSet = (plate: Plate) =>
    plate.small
      ? `${plate.small.src} ${plate.small.width}w, ${plate.src} ${plate.width}w`
      : `${plate.src} ${plate.width}w`;
  return (
    <picture className={className}>
      <source
        media="(min-width: 1024px)"
        srcSet={srcSet(desktop)}
        sizes={sizes.desktop}
        width={desktop.width}
        height={desktop.height}
      />
      <img
        src={mobile.src}
        srcSet={srcSet(mobile)}
        sizes={sizes.mobile}
        width={mobile.width}
        height={mobile.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}

/** Corner accents shared by every finder; drawn once in a 100×100 box. */
function FinderMarks() {
  return (
    <svg
      className={styles.finderMarks}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className={styles.finderRect}
        x="0"
        y="0"
        width="100"
        height="100"
        pathLength={1}
        data-finder-rect
      />
    </svg>
  );
}

/**
 * A finder: the orange frame around the place the next photograph enlarges.
 * It is the link to that stage. The number beside it is the stage's number
 * and is read through the link's accessible name.
 */
function Finder({
  index,
  target,
  box,
  tone = "adelva",
  number,
}: {
  index: number;
  target: Stage | null;
  box: { dBox: Rect; mBox: Rect };
  tone?: "adelva" | "client";
  /** A decorative number for a finder that is not itself the link. */
  number?: string;
}) {
  const vars = boxVars("f", {
    d: desktopGeometry.finders[index]!,
    m: mobileGeometry.finders[index]!,
    dBox: box.dBox,
    mBox: box.mBox,
  }) as Vars;
  const body = (
    <>
      <FinderMarks />
      <i className={styles.corner} data-corner="tl" />
      <i className={styles.corner} data-corner="tr" />
      <i className={styles.corner} data-corner="bl" />
      <i className={styles.corner} data-corner="br" />
      {target && (
        <span className={styles.finderNumber} aria-hidden="true">
          {target.number}
        </span>
      )}
      {number && (
        <span
          className={styles.finderNumber}
          aria-hidden="true"
          data-hero-finder-number
        >
          {number}
        </span>
      )}
    </>
  );
  return target ? (
    <a
      href={`#${target.id}`}
      className={styles.finder}
      style={vars}
      aria-label={`${target.number} ${target.name}へ`}
      data-finder={index}
      data-tone={tone}
    >
      {body}
    </a>
  ) : (
    <span
      className={styles.finder}
      style={vars}
      aria-hidden="true"
      data-finder={index}
      data-tone={tone}
    >
      {body}
    </span>
  );
}

/** Pairs drawn over the descent; pair 0 rides the hero camera instead. */
const linePairs = [1, 2, 3, 4, 5] as const;

const heroBox = {
  dBox: [0, 0, desktopGeometry.width, desktopGeometry.heroHeight] as Rect,
  mBox: [0, 0, mobileGeometry.width, mobileGeometry.heroHeight] as Rect,
};

/** Where the one-time settle scales the hero photograph from: its finder's centre. */
function finderOrigin(geometry: DescentGeometry) {
  const [x, y, w, h] = geometry.finders[0]!;
  return `${pct(x + w / 2, geometry.width)} ${pct(y + h / 2, geometry.heroHeight)}`;
}

/**
 * The hero's text, scale and finder link. Its photograph lives in stage 01's
 * dive stage (see `DiveStage`), which sits under this section at the same
 * place: the camera that dives into the finder has to share a sticky stage
 * with the photograph it lands on.
 */
function Hero() {
  const first = stages.items[0]!;
  return (
    <section
      className={styles.hero}
      aria-labelledby="ap-title"
      data-section="hero"
      data-hero
    >
      <div className={styles.heroBody} data-hero-body data-dive-lift>
        <nav className={styles.breadcrumb} aria-label="パンくず">
          <ol>
            {breadcrumb.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className={styles.roman} lang="en">
          {hero.roman}
        </p>
        <h1 id="ap-title" className={styles.title}>
          {hero.title}
        </h1>
        <p className={styles.lead}>
          <Broken lines={hero.lead} />
        </p>
        <p className={styles.body}>
          <Broken lines={hero.body} />
        </p>
        <Link href={hero.cta.href} className={styles.cta}>
          {hero.cta.label}
          <Arrow />
        </Link>
      </div>
      {/* The hero finder links to stage 01 like every other finder. The frame
          and its number are drawn inside the photograph; this link is the
          same rectangle, so focus is never scaled with the camera. */}
      <a
        href={`#${first.id}`}
        className={`${styles.finder} ${styles.heroFinderLink}`}
        style={
          boxVars("f", {
            d: desktopGeometry.finders[0]!,
            m: mobileGeometry.finders[0]!,
            ...heroBox,
          }) as Vars
        }
        aria-label={`${first.number} ${first.name}へ`}
        data-hero-finder-link
        data-dive-lift
      />
      <nav
        className={styles.rail}
        aria-label={`${rail.label}（${rail.top}から${rail.bottom}へ）`}
        data-rail
        data-dive-lift
      >
        <span className={styles.railEnd} aria-hidden="true">
          {rail.top}
        </span>
        <span className={styles.railLine} aria-hidden="true">
          <i className={styles.railProgress} data-rail-progress />
        </span>
        <ol className={styles.railStops}>
          {stages.items.map((stage, index) => (
            <li key={stage.id} style={{ "--i": index } as Vars}>
              <a
                href={`#${stage.id}`}
                aria-label={`${stage.number} ${stage.name}`}
                data-current={index === 0 || undefined}
              >
                <i className={styles.railTick} aria-hidden="true" />
                <span aria-hidden="true">{stage.number}</span>
              </a>
            </li>
          ))}
        </ol>
        <span
          className={`${styles.railEnd} ${styles.railEndBottom}`}
          aria-hidden="true"
        >
          {rail.bottom}
        </span>
      </nav>
    </section>
  );
}

/**
 * The hero photograph as the dive's camera. `zoom` carries the scroll-linked
 * dive; `push` carries the one-time settle on load (CSS). The first pair of
 * magnification lines rides the camera so it never detaches from the finder.
 */
function HeroMedia() {
  return (
    <div className={styles.heroMedia} data-hero-media>
      <div className={styles.heroZoom} data-hero-zoom>
        <div
          className={`${styles.heroZoom} ${styles.heroPush}`}
          style={
            {
              "--push-origin-m": finderOrigin(mobileGeometry),
              "--push-origin-d": finderOrigin(desktopGeometry),
            } as Vars
          }
          data-hero-push
        >
          <Photo
            desktop={plates.desktop.hero}
            mobile={plates.mobile.hero}
            alt=""
            className={styles.heroPhoto}
            priority
            sizes={{
              desktop: "(min-width: 1920px) 1920px, 100vw",
              mobile: "100vw",
            }}
          />
          <Finder
            index={0}
            target={null}
            box={heroBox}
            number={stages.items[0]!.number}
          />
        </div>
        <div className={styles.heroScrim} aria-hidden="true" />
        <span className={styles.heroLines} aria-hidden="true">
          <MagLines geometry={mobileGeometry} variant="mobile" pairs={[0]} />
          <MagLines geometry={desktopGeometry} variant="desktop" pairs={[0]} />
        </span>
      </div>
    </div>
  );
}

function StageText({ stage, final = false }: { stage: Stage; final?: boolean }) {
  return (
    <div className={final ? styles.finalText : styles.stageText} data-stage-text>
      <p className={styles.stageNumber} data-reveal>
        <span>{stage.number}</span>
        <i className={styles.stageTick} aria-hidden="true" />
      </p>
      <h3 id={`${stage.id}-title`} className={styles.stageName} data-reveal>
        <Tight>{stage.name}</Tight>
      </h3>
      <p className={styles.stageDescription} data-reveal>
        <Broken lines={stage.description} />
      </p>
      <ul className={styles.tags} data-reveal>
        {stage.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </div>
  );
}

function stageBox(index: number) {
  return {
    dBox: desktopGeometry.photos[index]!,
    mBox: mobileGeometry.photos[index]!,
  };
}

function photoVars(index: number): Vars {
  const d = desktopGeometry.photos[index]!;
  const m = mobileGeometry.photos[index]!;
  const dPrev =
    index === 0
      ? desktopGeometry.heroHeight
      : sumBottom(desktopGeometry.photos[index - 1]!);
  const mPrev =
    index === 0
      ? mobileGeometry.heroHeight
      : sumBottom(mobileGeometry.photos[index - 1]!);
  return {
    "--d-left": d[0],
    "--d-top": d[1],
    "--d-width": d[2],
    "--d-height": d[3],
    "--d-gap": +(d[1] - dPrev).toFixed(2),
    "--d-hero": desktopGeometry.heroHeight,
    "--m-left": m[0],
    "--m-top": m[1],
    "--m-width": m[2],
    "--m-height": m[3],
    "--m-gap": +(m[1] - mPrev).toFixed(2),
    "--m-hero": mobileGeometry.heroHeight,
  };
}

function sumBottom(rect: Rect) {
  return rect[1] + rect[3];
}

function Dots() {
  return (
    <span className={styles.dots} aria-hidden="true" data-dots>
      {desktopGeometry.dots.map((dot, index) => {
        const m = mobileGeometry.dots[index]!;
        const dBox = desktopGeometry.photos[1]!;
        const mBox = mobileGeometry.photos[1]!;
        return (
          <i
            key={index}
            className={styles.dot}
            style={
              {
                "--dot-dx": pct(dot[0] - dBox[0], dBox[2]),
                "--dot-dy": pct(dot[1] - dBox[1], dBox[3]),
                "--dot-mx": pct(m[0] - mBox[0], mBox[2]),
                "--dot-my": pct(m[1] - mBox[1], mBox[3]),
              } as Vars
            }
            data-dot={index}
          />
        );
      })}
    </span>
  );
}

/**
 * Magnification lines for one viewport family: from a finder's lower corners
 * to the enlarged photograph's upper corners, in the family's page units.
 * Each line is a box rotated about its start, so the motion layer can move
 * either end with a transform alone (no SVG geometry is rewritten per frame).
 */
function MagLines({
  geometry,
  variant,
  pairs,
}: {
  geometry: DescentGeometry;
  variant: "desktop" | "mobile";
  pairs: readonly number[];
}) {
  const lines = magnificationLines(geometry).filter((line) =>
    pairs.includes(line.photo),
  );
  return (
    <span
      className={variant === "desktop" ? styles.linesDesktop : styles.linesMobile}
      data-lines={variant}
    >
      {lines.map((line) => (
        <span key={line.photo} className={styles.linePair} data-line-pair={line.photo}>
          {(["left", "right"] as const).map((side) => {
            const [[x1, y1], [x2, y2]] = line[side];
            return (
              <i
                key={side}
                className={styles.magLine}
                style={
                  {
                    "--x1": x1,
                    "--y1": y1,
                    "--len": +Math.hypot(x2 - x1, y2 - y1).toFixed(3),
                    "--angle": +(
                      (Math.atan2(y2 - y1, x2 - x1) * 180) /
                      Math.PI
                    ).toFixed(4),
                  } as Vars
                }
                data-line
                data-side={side}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** The four edges of the dive's window, drawn over stage 01's photograph. */
function DiveWindow() {
  return (
    <span className={styles.diveWindow} aria-hidden="true" data-dive-window>
      {(["top", "right", "bottom", "left"] as const).map((edge) => (
        <i key={edge} className={styles.diveEdge} data-edge={edge} />
      ))}
    </span>
  );
}

/** A stage photograph with its overlays; `lens` is what the motion layer scales. */
function Frame({ index, final }: { index: number; final: boolean }) {
  const stage = stages.items[index]!;
  const next = stages.items[index + 1] ?? null;
  return (
    <div className={styles.frame} data-frame>
      <div className={styles.lens} data-lens>
        <Photo
          desktop={plates.desktop.stages[index]!}
          mobile={plates.mobile.stages[index]!}
          alt={stage.alt}
          className={styles.stagePhoto}
          sizes={{
            desktop: "(min-width: 1920px) 1780px, 93vw",
            mobile: "90vw",
          }}
        />
        {!final && <div className={styles.stageScrim} aria-hidden="true" />}
        {index === 1 && <Dots />}
        {!final && <StageText stage={stage} />}
        <Finder
          index={index + 1}
          target={next}
          box={stageBox(index)}
          tone={final ? "client" : "adelva"}
        />
      </div>
    </div>
  );
}

function Descent() {
  const last = stages.items.length - 1;
  return (
    <section
      className={styles.descent}
      aria-labelledby="ap-stages-title"
      data-section="descent"
      data-descent
    >
      <h2 id="ap-stages-title" className={styles.visuallyHidden}>
        {stages.title}
      </h2>
      <ol className={styles.stages} aria-labelledby="ap-stages-title">
        {stages.items.map((stage, index) => {
          const final = index === last;
          if (index === 0)
            /* Stage 01 carries the dive: a track the length of the dive with a
               sticky stage holding the hero photograph (the camera) and this
               stage's frame, which lands where it rests (spec §14). Without
               motion the track is exactly the hero plus this stage. */
            return (
              <li
                key={stage.id}
                id={stage.id}
                tabIndex={-1}
                className={`${styles.stage} ${styles.stageDive}`}
                aria-labelledby={`${stage.id}-title`}
                style={photoVars(index)}
                data-stage={index + 1}
              >
                <div className={styles.diveTrack} data-dive-track>
                  <span
                    className={styles.diveProbe}
                    aria-hidden="true"
                    data-dive-probe
                  />
                  <span className={styles.svhProbe} aria-hidden="true" data-svh-probe />
                  <div className={styles.diveStage} data-dive-stage>
                    <HeroMedia />
                    <div
                      className={styles.diveNight}
                      aria-hidden="true"
                      data-dive-night
                    />
                    <Frame index={index} final={false} />
                    <DiveWindow />
                  </div>
                </div>
              </li>
            );
          return (
            <li
              key={stage.id}
              id={stage.id}
              tabIndex={-1}
              className={final ? `${styles.stage} ${styles.stageFinal}` : styles.stage}
              aria-labelledby={`${stage.id}-title`}
              style={photoVars(index)}
              data-stage={index + 1}
            >
              <Frame index={index} final={final} />
              {final && (
                <>
                  <span
                    className={styles.handoverRule}
                    aria-hidden="true"
                    data-handover-rule
                  >
                    <i data-rule-adelva />
                    <i data-rule-client />
                  </span>
                  <StageText stage={stage} final />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Responsibilities() {
  return (
    <section
      className={styles.responsibilities}
      aria-labelledby="ap-roles-title"
      data-section="responsibilities"
    >
      <p className={styles.label}>{responsibilities.label}</p>
      <h2 id="ap-roles-title" className={styles.rolesTitle}>
        <Broken lines={responsibilities.title} />
      </h2>
      <div className={styles.axis} aria-hidden="true">
        <span>{responsibilities.axis.start}</span>
        <i className={styles.axisLine} />
        <span>{responsibilities.axis.end}</span>
      </div>
      <dl className={styles.roles}>
        {responsibilities.roles.map((role) => (
          <div key={role.id} className={styles.role} data-role={role.id}>
            <dt>
              <Tight>{role.name}</Tight>
            </dt>
            <dd>{role.scope}</dd>
            <span className={styles.track} aria-hidden="true">
              {role.ranges.map(([from, to]) => (
                <i
                  key={from}
                  className={styles.bar}
                  style={{ "--from": from, "--to": to } as Vars}
                  data-bar
                />
              ))}
            </span>
          </div>
        ))}
      </dl>
      <p className={styles.rolesNote}>
        <Broken lines={responsibilities.note} />
      </p>
    </section>
  );
}

function Integrated() {
  return (
    <section
      id={integrated.id}
      tabIndex={-1}
      className={styles.integrated}
      aria-labelledby="ap-integrated-title"
      data-section="integrated"
    >
      <div className={styles.integratedMedia} aria-hidden="true" data-integrated-media>
        <Photo
          desktop={plates.desktop.integrated}
          mobile={plates.mobile.integrated}
          alt=""
          className={styles.integratedPhoto}
          sizes={{ desktop: "100vw", mobile: "100vw" }}
        />
      </div>
      <div className={styles.integratedBody}>
        <p className={styles.label}>{integrated.label}</p>
        <h2 id="ap-integrated-title" className={styles.integratedTitle}>
          <Broken lines={integrated.title} />
        </h2>
        <ul className={styles.domains}>
          {integrated.domains.map((domain) => (
            <li key={domain.id}>
              <SmartLink
                href={domain.href}
                className={styles.domain}
                data-domain={domain.id}
              >
                <span className={styles.domainNumber}>{domain.number}</span>
                <span className={styles.domainName}>
                  <Tight>{domain.label}</Tight>
                </span>
                <span className={styles.domainDescription}>
                  <Broken lines={domain.lines} />
                </span>
                <Arrow className={styles.domainArrow} />
              </SmartLink>
            </li>
          ))}
        </ul>
        <div className={styles.example} data-example>
          <p className={styles.exampleLabel} id="ap-example-label">
            {integrated.example.label}
          </p>
          <div className={styles.exampleTrack}>
            <i className={styles.exampleLine} aria-hidden="true" data-example-line />
            <ul aria-labelledby="ap-example-label">
              {integrated.example.items.map((item, index) => (
                <li key={item} className={styles.exampleItem} data-example-item={index}>
                  <i className={styles.bracket} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Verification() {
  return (
    <section
      className={styles.verification}
      aria-labelledby="ap-verification-title"
      data-section="verification"
    >
      <h2 id="ap-verification-title" className={styles.verificationTitle}>
        <Broken lines={verification.title} />
      </h2>
      <ul className={styles.checks}>
        {verification.items.map((item) => (
          <li key={item.name} className={styles.check} data-check>
            <i className={styles.checkMark} aria-hidden="true" data-check-mark />
            <h3 className={styles.checkName}>
              <Tight>{item.name}</Tight>
            </h3>
            <p className={styles.checkLines}>
              {item.lines.map((line, index) => (
                <span key={line}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Audiences() {
  return (
    <section
      className={styles.audiences}
      aria-labelledby="ap-audience-title"
      data-section="audiences"
    >
      <h2 id="ap-audience-title" className={styles.visuallyHidden}>
        {audienceLinks.title}
      </h2>
      <ul>
        {audienceLinks.items.map((item) => (
          <li key={item.href}>
            <SmartLink href={item.href} className={styles.audienceLink}>
              <span>
                <Tight>{item.label}</Tight>
              </span>
              <Arrow />
            </SmartLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ApproachPage(): ReactNode {
  return (
    <div lang="ja" className={styles.page} data-approach>
      <a className={styles.skip} href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <ScrollProvider />
      <ApproachMotion>
        <main id="main-content" className={styles.main}>
          <div className={styles.canvas} data-canvas>
            <div className={styles.descentFrame} data-descent-frame>
              <Hero />
              <Descent />
              <span className={styles.lines} aria-hidden="true" data-lines-overlay>
                <MagLines
                  geometry={mobileGeometry}
                  variant="mobile"
                  pairs={linePairs}
                />
                <MagLines
                  geometry={desktopGeometry}
                  variant="desktop"
                  pairs={linePairs}
                />
              </span>
            </div>
            <div className={styles.ridge} aria-hidden="true">
              <img
                src={plates.desktop.ridge.src}
                width={plates.desktop.ridge.width}
                height={plates.desktop.ridge.height}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
            <Responsibilities />
            <Integrated />
            <Verification />
            <Audiences />
          </div>
          <div className={styles.descentRail} aria-hidden="true" data-descent-rail>
            <i className={styles.descentRailFill} data-descent-rail-fill />
            {stages.items.map((stage, index) => (
              <i
                key={stage.id}
                className={styles.descentRailDot}
                style={{ "--i": index } as Vars}
                data-rail-dot={index}
              />
            ))}
          </div>
        </main>
      </ApproachMotion>
      <HomeFooter />
    </div>
  );
}
