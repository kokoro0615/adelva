/* The photograph is pre-optimised WebP layers in <picture> (desktop only);
   every layer shares the plate's coordinate plane, which next/image's wrapper
   sizing would break. */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import {
  audienceLinks,
  boundaries,
  breadcrumb,
  chapters,
  contact,
  hero,
  knuckleLabels,
  processCopy,
  serviceIndex,
  ui,
  type Lines,
} from "@/content/adelva-management-operations";
import { moGeometry as G } from "@/content/adelva-management-operations-geometry";

import { ManagementOperationsMotion } from "./management-operations-motion";
import styles from "./management-operations.module.css";

export const moMedia = "/media/adelva/management-operations/";

/** CSS px per plate px on the 1440-wide desktop stage. */
const S = G.plate.cssScale;

/** Transparent 1×1 image that narrow viewports load instead of a plate tile. */
const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const DESKTOP = "(min-width: 1024px)";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * One approved string with the line breaks of both prototypes. The text is
 * emitted once; each `<br>` carries the regime it belongs to, so nothing
 * duplicates for assistive technology.
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

function Arrow() {
  return <span className={styles.arrow} aria-hidden="true" />;
}

/** A plate tile that only desktop viewports download. */
function Tile({ name, y, height }: { name: string; y: number; height: number }) {
  return (
    <picture>
      <source media={DESKTOP} srcSet={`${moMedia}${name}`} />
      <img
        src={BLANK}
        alt=""
        width={G.plate.width}
        height={height}
        decoding="async"
        style={{ "--y": y, "--h": height } as Vars}
      />
    </picture>
  );
}

function Slices({
  kind,
  className,
  rows,
}: {
  kind: keyof typeof G.slices;
  className?: string;
  rows?: number;
}) {
  const list = rows === undefined ? G.slices[kind] : G.slices[kind].slice(0, rows);
  return (
    <div className={`${styles.slices} ${className ?? ""}`} aria-hidden="true">
      {list.map((slice) => (
        <Tile key={slice.name} {...slice} />
      ))}
    </div>
  );
}

function Layer({
  name,
  x,
  y,
  width,
  height,
}: {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <picture>
      <source media={DESKTOP} srcSet={`${moMedia}${name}`} />
      <img
        src={BLANK}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        style={{ "--x": x, "--y": y, "--w": width, "--h": height } as Vars}
      />
    </picture>
  );
}

/**
 * The desktop photograph: the B-hq plate and its light layers, stacked in the
 * prototype's paint order. Narrow viewports draw the same plate into a canvas
 * instead and never download these tiles.
 */
function DesktopPhoto() {
  return (
    <div className={styles.photo} aria-hidden="true">
      <Slices kind="base" className={styles.base} />
      <Slices kind="dim" className={styles.dimTop} />
      <Slices kind="blur" className={styles.blurTop} />
      <div className={`${styles.lightWindow} ${styles.sharpWindow}`} data-light-window>
        <Slices kind="dim" className={styles.counter} />
      </div>
      <div className={`${styles.lightWindow} ${styles.litWindow}`} data-light-window>
        <Slices kind="lit" className={styles.counter} />
      </div>
      <div className={styles.dawn} data-dawn>
        <Slices kind="base" className={styles.counter} rows={2} />
      </div>
      <div className={styles.indexUnlit}>
        <Slices kind="dim" />
      </div>
      <picture>
        <source media={DESKTOP} srcSet={`${moMedia}fog.webp`} />
        <img
          className={styles.fog}
          src={BLANK}
          alt=""
          width={920}
          height={700}
          decoding="async"
        />
      </picture>
      {G.warm.knuckles.map((layer, index) => (
        <div
          key={layer.name}
          className={styles.warmKnuckle}
          data-warm-knuckle={index + 1}
        >
          <Layer {...layer} />
        </div>
      ))}
      <div className={styles.oldWindow} data-old-window>
        <div className={styles.oldCounter} data-old-counter>
          {G.warm.old.map((layer) => (
            <Layer key={layer.name} {...layer} />
          ))}
        </div>
      </div>
      <div className={styles.young} data-young>
        <Layer {...G.warm.young} />
      </div>
    </div>
  );
}

/** Narrow viewports: the knuckle rings, their labels and the fork threads ride on the canvas. */
function CameraOverlay() {
  return (
    <div className={styles.cameraUi} aria-hidden="true" data-camera-ui>
      {knuckleLabels.map((label, index) => (
        <div key={label.title} className={styles.cameraRing} data-ring={index + 1}>
          <i />
        </div>
      ))}
      {knuckleLabels.map((label, index) => (
        <p
          key={label.title}
          className={styles.cameraRingLabel}
          data-ring-label={index + 1}
        >
          <span className={styles.num}>{label.numbers}</span>
          <span>{label.title}</span>
        </p>
      ))}
      <svg className={styles.stems} data-stems>
        {boundaries.pairs.map((_, index) => (
          <path key={index} data-stem={index + 1} pathLength={1} />
        ))}
      </svg>
    </div>
  );
}

function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="mo-title" data-hero>
      <nav className={styles.crumb} aria-label={breadcrumb.label}>
        <ol>
          {breadcrumb.items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link prefetch={false} href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={"current" in item ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <p className={styles.domain}>
        <span className={styles.num}>{hero.index}</span>
        <i aria-hidden="true" />
        {hero.indexLabel}
      </p>
      <h1 id="mo-title" className={styles.title}>
        {hero.titleLines.map((line) => (
          <span key={line} className={styles.titleLine}>
            <span>{line}</span>
          </span>
        ))}
      </h1>
      <p className={styles.roman}>{hero.roman}</p>
      <p className={styles.lead}>
        <Broken lines={hero.leadLines} />
      </p>
      <Link prefetch={false} className={styles.flare} href={hero.cta.href}>
        {hero.cta.label}
        <Arrow />
      </Link>
      <div className={styles.scrollCue} aria-hidden="true">
        SCROLL
        <span className={styles.scrollTrack}>
          <i />
        </span>
      </div>
    </section>
  );
}

function ServiceIndex() {
  return (
    <section className={styles.index} aria-labelledby="mo-index-title" data-index>
      <div className={styles.indexStage} data-index-stage>
        <div className={styles.indexHead} data-index-head>
          <h2 id="mo-index-title">{serviceIndex.title}</h2>
          <ol className={styles.ticks} aria-hidden="true">
            {chapters.map((chapter, index) => (
              <li key={chapter.id} data-tick={index + 1} />
            ))}
          </ol>
        </div>
        <ul className={styles.themes} data-themes>
          {chapters.map((chapter, index) => {
            const layout = G.desktopIndex.themes[index]!;
            return (
              <li
                key={chapter.id}
                className={styles.theme}
                data-theme={index + 1}
                data-current={index === 1 ? 1 : 0}
                style={
                  {
                    "--line-left": layout.lineLeft,
                    "--line-width": layout.lineWidth,
                  } as Vars
                }
              >
                <span className={styles.hairline} aria-hidden="true" data-hairline>
                  <i />
                </span>
                <h3
                  style={
                    { "--x": layout.titleX, "--title-size": layout.titleSize } as Vars
                  }
                  data-column
                >
                  {chapter.title}
                </h3>
                <ul>
                  {chapter.services.map((service) => (
                    <li
                      key={service.number}
                      className={styles.service}
                      data-service={service.number}
                      data-column
                      style={{ "--x": layout.services[service.number] } as Vars}
                    >
                      <span className={styles.num}>{service.number}</span>
                      <span className={styles.visuallyHidden}>{service.name}</span>
                      <span className={styles.serviceName} aria-hidden="true">
                        {Array.from(service.name, (char, charIndex) => (
                          <span key={charIndex}>{char}</span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Desktop: rings and labels on the four knuckles of the platform. */
function Knuckles() {
  return (
    <div className={styles.knuckles} aria-hidden="true">
      {G.knuckles.map((knuckle, index) => (
        <div
          key={knuckle.group}
          className={styles.knuckle}
          data-knuckle={index + 1}
          data-active={index === 1 ? 1 : 0}
          style={{ "--x": knuckle.center[0] * S, "--y": knuckle.center[1] * S } as Vars}
        >
          <svg className={styles.ring} viewBox="0 0 24 24">
            <circle className={styles.ringOutline} cx="12" cy="12" r="9" />
            <circle className={styles.ringCore} cx="12" cy="12" r="2" />
          </svg>
          <span className={styles.halo} />
          <div className={styles.knuckleLabel}>
            <p className={styles.num}>{knuckleLabels[index]!.numbers}</p>
            <p>{knuckleLabels[index]!.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Boundaries() {
  return (
    <section
      className={`${styles.boundaries} ${styles.pooled}`}
      aria-labelledby="mo-boundaries-title"
      data-boundaries
    >
      <div className={styles.boundariesStage} data-boundaries-stage>
        <h2 id="mo-boundaries-title">{boundaries.title}</h2>
        <ol className={styles.forks}>
          {boundaries.pairs.map((pair, index) => (
            <li
              key={pair[0].number}
              className={styles.fork}
              data-fork={index + 1}
              data-active={index === 1 ? 1 : 0}
            >
              <svg
                className={styles.forkMark}
                viewBox="0 0 70 150"
                aria-hidden="true"
                data-fork-mark
              >
                <path d="M8 75 C28 75 33 16 68 16 M8 75 C28 75 33 92 68 92" />
                <circle cx="8" cy="75" r="3.5" />
              </svg>
              <svg
                className={styles.forkMarkMobile}
                viewBox="0 0 44 112"
                aria-hidden="true"
              >
                <path d="M6 56 C20 56 22 12 42 12 M6 56 C20 56 22 76 42 76" />
                <circle cx="6" cy="56" r="3.5" />
              </svg>
              <ul>
                {pair.map((item) => (
                  <li key={item.number}>
                    <p className={styles.entry}>
                      <span className={styles.num}>{item.number}</span>
                      <span className={styles.entryName} data-entry-name>
                        {item.name}
                      </span>
                    </p>
                    <p className={styles.scope}>
                      {"scopeLines" in item ? (
                        <Broken lines={item.scopeLines} />
                      ) : (
                        item.scope
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className={styles.note}>
          <Broken lines={boundaries.noteLines} />
        </p>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section
      className={`${styles.process} ${styles.pooled}`}
      aria-labelledby="mo-process-title"
      data-process
    >
      <h2 id="mo-process-title">{processCopy.title}</h2>
      <p className={styles.processLead}>
        <Broken lines={processCopy.leadLines} />
      </p>
      <p className={styles.processBody}>
        <Broken lines={processCopy.bodyLines} />
      </p>
      <div className={styles.stepsWrap}>
        <span className={styles.rail} aria-hidden="true">
          <i data-rail />
        </span>
        <ol className={styles.steps} aria-label={processCopy.stepsLabel}>
          {processCopy.steps.map((step, index) => (
            <li
              key={step.number}
              className={styles.step}
              data-step={index + 1}
              data-state={index < 4 ? "reached" : index === 4 ? "current" : "pending"}
            >
              <i className={styles.stepDot} aria-hidden="true" />
              <span className={styles.num}>{step.number}</span>
              <div>
                <h3>{step.name}</h3>
                <p className={styles.tags}>
                  {step.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <Link prefetch={false} className={styles.textLink} href={processCopy.link.href}>
        {processCopy.link.label}
        <Arrow />
      </Link>
    </section>
  );
}

function Audience() {
  return (
    <section
      className={`${styles.audience} ${styles.pooled}`}
      aria-labelledby="mo-audience-title"
      data-audience
    >
      <h2 id="mo-audience-title">{audienceLinks.title}</h2>
      <div className={styles.routes} data-routes>
        {audienceLinks.items.map((item) => (
          <Link
            prefetch={false}
            key={item.href}
            className={styles.route}
            href={item.href}
          >
            {item.label}
            <Arrow />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section
      className={`${styles.contact} ${styles.pooled}`}
      aria-labelledby="mo-contact-title"
      data-contact
    >
      <h2 id="mo-contact-title">
        <Broken lines={contact.titleLines} />
      </h2>
      <Link
        prefetch={false}
        className={`${styles.flare} ${styles.flareWide}`}
        href={contact.cta.href}
      >
        {contact.cta.label}
        <Arrow />
      </Link>
    </section>
  );
}

/** /services/management-operations — B 台杉「降りてくる朝」 (spec 2026-10-01). */
export function ManagementOperationsPage() {
  return (
    <>
      <a className={styles.skip} href="#main-content">
        {ui.skip}
      </a>
      <SiteHeader />
      <main id="main-content" className={styles.main} data-mo-root>
        <canvas className={styles.camera} aria-hidden="true" data-camera />
        <CameraOverlay />
        <div className={styles.track} data-track>
          <div className={styles.stage} data-stage>
            <DesktopPhoto />
            <canvas className={styles.comets} aria-hidden="true" data-comets />
            <Hero />
            <ServiceIndex />
            <Knuckles />
            <Boundaries />
            <Process />
            <Audience />
            <Contact />
          </div>
        </div>
      </main>
      <div className={styles.footerLayer}>
        <HomeFooter />
      </div>
      <ScrollProvider />
      <ManagementOperationsMotion />
    </>
  );
}
