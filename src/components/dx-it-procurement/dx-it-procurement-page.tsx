/* eslint-disable @next/next/no-img-element -- supplied WebP plates, explicit
   dimensions and media selection on the same natural-pixel plane as the SVG. */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { HomeFooter } from "@/components/home/home-footer";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import { routeStatusOf } from "@/content/adelva-navigation";
import {
  audienceLinks,
  boundaries,
  breadcrumb,
  chapterIndex,
  chapters,
  geometry,
  hero,
  media,
  processCopy,
  related,
} from "@/content/adelva-dx-it-procurement";
import { DxItProcurementMotion } from "./dx-it-procurement-motion";
import styles from "./dx-it-procurement.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const blank =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
const roomNames = ["systems", "operations", "storeroom"] as const;
const numbers = ["17", "19", "18", "20"] as const;

/** One text node sequence, with breakpoint-specific breaks (sister-page pattern). */
function BrokenText({
  lines,
}: {
  lines: { readonly desktop: readonly string[]; readonly mobile: readonly string[] };
}) {
  const cuts = (parts: readonly string[]) => {
    let n = 0;
    return new Set(parts.slice(0, -1).map((p) => (n += p.length)));
  };
  const d = cuts(lines.desktop),
    m = cuts(lines.mobile),
    text = lines.desktop.join("");
  const nodes: ReactNode[] = [];
  let from = 0;
  for (const at of [...new Set([...d, ...m])]
    .sort((a, b) => a - b)
    .concat(text.length)) {
    nodes.push(text.slice(from, at));
    if (at < text.length)
      nodes.push(
        <br
          key={at}
          className={
            d.has(at) && m.has(at)
              ? undefined
              : d.has(at)
                ? styles.desktopBreak
                : styles.mobileBreak
          }
        />,
      );
    from = at;
  }
  return <>{nodes}</>;
}
function Tight({ children }: { children: string }) {
  return children.split("・").map((p, i) => (
    <span key={i}>
      {i > 0 && <span className={styles.nakaguro}>・</span>}
      {p}
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

/** A non-matching picture never fetches the other composition. */
function Plate({
  name,
  width,
  height,
  variant,
  className,
  eager = false,
  small,
}: {
  name: string;
  width: number;
  height: number;
  variant: "desktop" | "mobile";
  className?: string;
  eager?: boolean;
  small?: string;
}) {
  return (
    <picture className={className}>
      <source
        media={variant === "desktop" ? "(min-width: 1024px)" : "(max-width: 1023.98px)"}
        srcSet={
          small ? `${media}${small} 1024w, ${media}${name} 1536w` : `${media}${name}`
        }
        sizes={small ? "(min-width: 1920px) 1920px, 100vw" : undefined}
      />
      <img
        src={blank}
        width={width}
        height={height}
        alt=""
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
function Leaders({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {numbers.map((number, i) => {
        const [x, y] = mobile
          ? [681, geometry.mobile.coreDots[number]]
          : geometry.desktop.map.leaderTargets[number];
        const start = mobile ? [370, 400, 375, 480][i] : [430, 470, 410, 560][i];
        return (
          <g
            key={number}
            data-leader={number}
            data-variant={mobile ? "mobile" : "desktop"}
            className={styles.leaderGroup}
          >
            <path
              className={styles.leader}
              d={`M${start} ${y}H${x}`}
              pathLength={1}
              data-line
            />
            <circle
              className={styles.dotHalo}
              cx={x}
              cy={y}
              r={mobile ? 15 : 16}
              data-dot-halo
            />
            <circle
              className={styles.dot}
              cx={x}
              cy={y}
              r={mobile ? 7 : 7.5}
              data-dot
            />
          </g>
        );
      })}
    </>
  );
}
function SectionMapOverlay() {
  const map = geometry.desktop.map;
  return (
    <svg
      className={styles.mapOverlay}
      viewBox="0 0 1536 2304"
      aria-hidden="true"
      focusable="false"
      data-map-overlay
    >
      <defs>
        <filter id="dx-soft-mask" x="0" y="0" width="100%" height="100%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id="dx-handoff-color" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ff7e15" />
          <stop offset=".5" stopColor="#fff" />
          <stop offset="1" stopColor="#ff7e15" />
        </linearGradient>
        <mask
          id="dxPower"
          maskUnits="userSpaceOnUse"
          x="780"
          y="0"
          width="756"
          height="1960"
          style={{ maskType: "luminance" }}
        >
          <rect x="780" width="756" height="1960" fill="white" />
          <rect x="780" width="756" height="140" fill="black" />
          {(["staff", ...roomNames] as const).map((room) => {
            const r = map.rooms[room];
            return (
              <rect
                key={room}
                x={r.x0}
                y={r.y0}
                width={r.x1 - r.x0}
                height={r.y1 - r.y0}
                fill="black"
                data-power-room={room}
              />
            );
          })}
          <g
            filter="url(#dx-soft-mask)"
            fill="none"
            stroke="black"
            strokeWidth="90"
            strokeLinecap="round"
          >
            {Object.entries({
              main: "M1136 440 V1409",
              branch: map.conduits.branch,
              hookOperations: map.conduits.hookOperations,
              hookStoreroom: map.conduits.hookStoreroom,
            }).map(([id, d]) => (
              <path key={id} d={d} pathLength={1} data-power-path={id} />
            ))}
          </g>
        </mask>
      </defs>
      <image
        x="780"
        y="0"
        width="756"
        height="1960"
        className={styles.powerOff}
        data-power-off
        mask="url(#dxPower)"
      />
      {roomNames.map((room, i) => {
        const r = map.rooms[room];
        return (
          <rect
            key={room}
            x={r.x0}
            y={r.y0}
            width={r.x1 - r.x0}
            height={r.y1 - r.y0}
            className={styles.roomVeil}
            data-room-veil={i}
          />
        );
      })}
      <Leaders />
      <path
        d={map.conduits.handoffSegment}
        pathLength={1}
        className={styles.handoff}
        data-handoff
      />
      <circle
        cx="1136"
        cy="1409"
        r="6"
        className={styles.arrivalNode}
        data-handoff-node
      />
      <g className={styles.svgParticle} data-power-particle="main">
        <circle r="28" fill="#ff7e15" opacity=".28" />
        <circle r="10" fill="white" />
      </g>
      <g className={styles.svgParticle} data-power-particle="branch">
        <circle r="28" fill="#ff7e15" opacity=".28" />
        <circle r="10" fill="white" />
      </g>
      {roomNames.map((room, i) => (
        <g key={room} className={styles.svgParticle} data-hover-particle={i}>
          <circle r="22" fill="#ff7e15" opacity=".3" />
          <circle r="6" fill="white" />
        </g>
      ))}
      <g fill="none" stroke="none">
        <path data-hover-path="0" d="M1136 760 V900" />
        <path data-hover-path="1" d={map.conduits.hookOperations} />
        <path data-hover-path="2" d={map.conduits.hookStoreroom} />
      </g>
    </svg>
  );
}
function MobileScene() {
  return (
    <div className={styles.mobileScene} aria-hidden="true" data-mobile-scene>
      {geometry.mobile.body.tiles.map((name, i) => (
        <Plate
          key={name}
          name={name}
          width={780}
          height={1375}
          variant="mobile"
          eager={i === 0}
          className={styles.mobileTile}
        />
      ))}
      <div className={styles.heroScrim} />
      <div className={styles.shelfScrim} />
      <div className={styles.mobileOffClip} data-off-clip="mobile">
        <div className={styles.offWindow} data-off-window="mobile">
          <div className={styles.offStrip} data-off-strip="mobile">
            {geometry.mobile.coreOff.tiles.map((name) => (
              <Plate
                key={name}
                name={name}
                width={220}
                height={1926}
                variant="mobile"
              />
            ))}
          </div>
        </div>
      </div>
      <svg className={styles.mobileOverlay} viewBox="0 0 780 11000" focusable="false">
        <rect
          x="300"
          y="200"
          width="480"
          height="240"
          className={styles.mobileRoomVeil}
          data-mobile-staff
        />
        {roomNames.map((room, i) => {
          const r = geometry.mobile.rooms[room];
          return (
            <g key={room}>
              <rect
                x={r.x0}
                y={r.y0}
                width={r.x1 - r.x0}
                height={r.y1 - r.y0}
                className={styles.mobileRoomVeil}
                data-mobile-room={i}
              />
            </g>
          );
        })}
        <Leaders mobile />
      </svg>
      {roomNames.map((room, i) => {
        const r = geometry.mobile.rooms[room];
        return (
          <div
            key={room}
            className={styles.roomEdge}
            data-room-edge={i}
            style={{
              left: `calc(${r.x0} * var(--m))`,
              top: `calc(${r.y0} * var(--m))`,
              width: `calc(${r.x1 - r.x0} * var(--m))`,
              height: `calc(${r.y1 - r.y0} * var(--m))`,
            }}
          />
        );
      })}
      <div className={styles.mobileHandoff} data-mobile-handoff />
      <div className={styles.mobileParticle} data-tip="mobile" />
      <div className={styles.mobileDawn} data-dawn="mobile" />
    </div>
  );
}
function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="dx-title" data-section="hero">
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
      <h1 id="dx-title" className={styles.title}>
        <Tight>{hero.title}</Tight>
      </h1>
      <p className={styles.roman} lang="en">
        {hero.roman}
      </p>
      <p className={styles.lead}>
        {hero.lead.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <Link prefetch={false} href={hero.cta.href} className={styles.cta}>
        {hero.cta.label}
        <Arrow />
      </Link>
      <nav className={styles.chapterIndex} aria-label={chapterIndex.label}>
        <ul>
          {chapters.map((ch) => (
            <li key={ch.id}>
              <a href={`#${ch.id}`} data-index-link={ch.id}>
                <span className={styles.indexTitle}>
                  <Tight>{ch.title}</Tight>
                </span>
                <span className={styles.indexNumbers}>{ch.numbers}</span>
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
function Chapters() {
  return (
    <div className={styles.chapters}>
      {chapters.map((ch, i) => (
        <section
          key={ch.id}
          id={ch.id}
          aria-labelledby={`${ch.id}-title`}
          data-chapter={ch.id}
          className={styles.chapter}
          style={
            {
              "--top": ch.top,
              "--mtop": ch.mobileTop,
              "--heading": ch.headingOffset,
              "--mheading": ch.mobileHeadingOffset,
            } as Vars
          }
        >
          <p className={styles.chapterNumber}>{ch.numbers}</p>
          <h2 id={`${ch.id}-title`} className={styles.chapterTitle}>
            <span data-row-name={i === 0 ? undefined : ch.numbers}>
              <Tight>{ch.title}</Tight>
            </span>
          </h2>
          {i === 0 ? (
            <ul className={styles.rows}>
              {ch.services.map((s, j) => (
                <li
                  key={s.number}
                  className={styles.row}
                  data-row={s.number}
                  style={{ "--row": j } as Vars}
                >
                  <span className={styles.rowNumber}>{s.number}</span>
                  <span className={styles.rowName} data-row-name={s.number}>
                    {s.name}
                  </span>
                  <span className={styles.rowScope}>{s.scope}</span>
                </li>
              ))}
            </ul>
          ) : ch.scope ? (
            <p className={styles.chapterScope}>{ch.scope}</p>
          ) : null}
          <div className={styles.chipRows} data-chips={i}>
            {ch.tags.map((tags, j) => (
              <ul key={j} className={styles.chips}>
                {tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
function Boundaries() {
  return (
    <section
      className={styles.boundaries}
      aria-labelledby="dx-boundaries-title"
      data-section="boundaries"
    >
      <div className={styles.limestone} aria-hidden="true">
        <Plate name="d-diff.webp" width={768} height={1152} variant="desktop" />
      </div>
      <div className={styles.boundariesBody} data-boundaries-body>
        <h2 id="dx-boundaries-title" className={styles.boundariesTitle}>
          {boundaries.title}
        </h2>
        <div className={styles.pairs}>
          {boundaries.pairs.map((pair) => (
            <div key={pair[0].number} className={styles.pair}>
              <i className={styles.pairRule} aria-hidden="true" data-pair-rule />
              <dl>
                {pair.map((item) => (
                  <div key={item.number} className={styles.pairItem} data-pair-item>
                    <dt>
                      <span className={styles.pairNumber}>{item.number}</span>
                      <span>
                        <Tight>{item.name}</Tight>
                      </span>
                      {"label" in item && item.label ? (
                        <span className={styles.pairLabel}>{item.label}</span>
                      ) : null}
                    </dt>
                    <dd>
                      {item.number === "19" ? (
                        <BrokenText
                          lines={{
                            desktop: ["既製サービスで満たせない", "要件への個別開発"],
                            /* The 12px floor leaves no room for one line at
                               390; break where the desktop mock does, never
                               inside 個別. */
                            mobile: ["既製サービスで満たせない", "要件への個別開発"],
                          }}
                        />
                      ) : (
                        item.scope
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <i className={styles.pairsRule} aria-hidden="true" data-pairs-rule />
        <p className={styles.note}>
          <BrokenText
            lines={{
              desktop: [boundaries.note],
              mobile: [
                "保守の対象・対応範囲と、",
                "調達の実施主体は、個別に確認します。",
              ],
            }}
          />
        </p>
      </div>
    </section>
  );
}
function ProcessLines({ mobile = false }: { mobile?: boolean }) {
  const centers = (mobile ? geometry.mobile : geometry.desktop.process).boxes.map(
    (b) => b.centerY,
  );
  return (
    <svg
      className={mobile ? styles.mobileLandings : styles.landings}
      viewBox={mobile ? "0 0 780 3660" : "0 0 1536 1664"}
      aria-hidden="true"
      focusable="false"
      data-landings={mobile ? "mobile" : "desktop"}
    >
      <defs>
        <radialGradient id={`dx-box-glow-${mobile}`}>
          <stop stopColor="#ffb45b" stopOpacity=".8" />
          <stop offset="1" stopColor="#ff7e15" stopOpacity="0" />
        </radialGradient>
      </defs>
      {centers.map((cy, i) => {
        const y = cy - (mobile ? 7340 : 0),
          x = mobile ? 682 : 905,
          from = mobile ? 435 : 959,
          to = mobile ? 626 : 1049.6;
        return (
          <g
            key={i}
            data-landing={i + 1}
            data-state="passed"
            className={styles.landing}
          >
            <ellipse
              cx={x}
              cy={y}
              rx={mobile ? 80 : 100}
              ry="45"
              fill={`url(#dx-box-glow-${mobile})`}
              className={styles.boxGlow}
            />
            <ellipse
              cx={x}
              cy={y}
              rx={mobile ? 80 : 100}
              ry="45"
              fill={`url(#dx-box-glow-${mobile})`}
              className={styles.boxRing}
            />
            <path
              d={`M${from} ${y}H${to}`}
              className={styles.landingLine}
              data-step-line={i + 1}
            />
            <circle cx={to} cy={y} r="5.3" className={styles.landingDot} />
          </g>
        );
      })}
    </svg>
  );
}
function Steps() {
  return (
    <ol className={styles.steps} aria-label={processCopy.stepsLabel} data-steps>
      {processCopy.steps.map((step, i) => (
        <li
          key={step.number}
          className={styles.step}
          data-step={i + 1}
          data-state="passed"
          style={
            {
              "--landing": geometry.desktop.process.boxes[i].centerY,
              "--mlanding": geometry.mobile.boxes[i].centerY - 7340,
              "--mrow": [8112, 8290, 8476, 8666, 8852, 9031][i] - 7340,
            } as Vars
          }
        >
          <span className={styles.stepNumber}>{step.number}</span>
          <div className={styles.stepHead}>
            <h3 className={styles.stepName}>
              <Tight>{step.name}</Tight>
            </h3>
            <Check />
          </div>
          <ul className={styles.tags}>
            {step.tags.map((tag, j) => (
              <li key={tag} style={{ "--tag": j } as Vars}>
                {tag}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
function Process() {
  return (
    <section
      className={styles.process}
      aria-labelledby="dx-process-title"
      data-section="process"
      data-process
      data-progress="complete"
    >
      <div className={styles.processLayers} aria-hidden="true">
        <Plate
          name="d-process.webp"
          width={1536}
          height={1664}
          variant="desktop"
          className={styles.processPlate}
        />
        <div className={styles.processScrim} />
        <div className={styles.processRightScrim} />
        <div className={styles.desktopOffClip} data-off-clip="desktop">
          <div className={styles.offWindow} data-off-window="desktop">
            <div data-off-strip="desktop">
              <Plate
                name="d-process-off.webp"
                width={340}
                height={1330}
                variant="desktop"
              />
            </div>
          </div>
        </div>
        <div className={styles.desktopParticle} data-tip="desktop" />
        <div className={styles.dawn} data-dawn="desktop" />
        <div className={styles.dawnWarm} data-dawn-warm />
      </div>
      <ProcessLines />
      <ProcessLines mobile />
      <div className={styles.processIntro}>
        <div className={styles.processHeading}>
          <h2 id="dx-process-title" className={styles.processTitle} data-process-title>
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
    </section>
  );
}
function Related() {
  return (
    <section
      className={styles.related}
      aria-labelledby="dx-related-title"
      data-section="related"
    >
      <h2 id="dx-related-title">{related.title}</h2>
      <div className={styles.cards}>
        {related.items.map((item, i) => {
          const linked = routeStatusOf(item.href) === "available";
          const text = item.description!;
          const split = (cut: string) => {
            const pos = text.indexOf(cut) + cut.length;
            return [text.slice(0, pos), text.slice(pos)];
          };
          const content = (
            <>
              <div className={styles.cardPhoto} aria-hidden="true">
                <img
                  src={`${media}card-${item.number}.webp`}
                  srcSet={`${media}card-${item.number}-560.webp 560w, ${media}card-${item.number}.webp 960w`}
                  sizes="(min-width: 1920px) 880px, (min-width: 1024px) 46vw, (min-width: 600px) 574px, 90vw"
                  width={960}
                  height={960}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span className={styles.cardNumber}>{item.number}</span>
              <h3 className={styles.cardTitle}>
                <Tight>{item.label}</Tight>
              </h3>
              <p className={styles.cardDescription}>
                <BrokenText
                  lines={{
                    desktop: split(i === 0 ? "オペレーションを" : "営業を"),
                    mobile: split(i === 0 ? "人材、" : "営業を"),
                  }}
                />
              </p>
              {linked && <Arrow />}
            </>
          );
          return (
            <article key={item.id} className={styles.card} data-card={item.number}>
              {linked ? (
                <Link prefetch={false} href={item.href} className={styles.cardLink}>
                  {content}
                </Link>
              ) : (
                <div className={styles.cardStatic}>{content}</div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
function Audiences() {
  return (
    <section
      className={styles.audiences}
      aria-labelledby="dx-audience-title"
      data-section="audiences"
    >
      <h2 id="dx-audience-title" className={styles.visuallyHidden}>
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
export function DxItProcurementPage() {
  return (
    <div lang="ja" className={styles.page} data-dx-it-procurement>
      <a className={styles.skip} href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <ScrollProvider />
      <DxItProcurementMotion>
        <main id="main-content" className={styles.main}>
          <div className={styles.column} data-column>
            <div className={styles.body} data-body>
              <MobileScene />
              <div className={styles.map} data-map>
                <div className={styles.scene} aria-hidden="true" data-scene>
                  <Plate
                    name="d-map.webp"
                    small="d-map-1024.webp"
                    width={1536}
                    height={2304}
                    variant="desktop"
                    eager
                    className={styles.scenePicture}
                  />
                  <div className={styles.mapScrim} />
                  <SectionMapOverlay />
                </div>
                <div className={styles.tickRail} aria-hidden="true">
                  <ol className={styles.ticks}>
                    {chapters.map((ch, i) => (
                      <li
                        key={ch.id}
                        data-tick={i}
                        data-current={i === 0 || undefined}
                      />
                    ))}
                  </ol>
                </div>
                <Hero />
                <Chapters />
              </div>
              <Boundaries />
              <Process />
            </div>
            <Related />
            <Audiences />
          </div>
        </main>
      </DxItProcurementMotion>
      <HomeFooter />
    </div>
  );
}
