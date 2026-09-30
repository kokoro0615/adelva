/* eslint-disable @next/next/no-img-element -- pre-encoded, art-directed plates share page coordinates with SVG marks. */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { FounderSignature } from "@/components/home/founder-signature";
import { HomeFooter } from "@/components/home/home-footer";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import { groupLabels, routeStatusOf } from "@/content/adelva-navigation";
import {
  audiences,
  call,
  company,
  desktopGeometry as dg,
  domains,
  hero,
  mobileGeometry as mg,
  role,
  segments,
  stance,
  zones,
  zonesLabel,
  type Broken,
} from "@/content/adelva-about";
import { AboutMotion } from "./about-motion";
import { defaultLeaders, dimensionPath, ringMarks, type Composition } from "./marks";
import styles from "./about.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Seg = "a" | "b" | "c";
const media = "/media/adelva/about-a2/";

/** Page-coordinate placement for both compositions. */
function at(xd: number, yd: number, xm: number, ym: number, extra: Vars = {}): Vars {
  return { "--xd": xd, "--yd": yd, "--xm": xm, "--ym": ym, ...extra };
}

/** Text with composition-specific line breaks. */
function Lines({ value }: { value: Broken }) {
  const cuts = [...new Set([...value.desktop, ...value.mobile])].sort((a, b) => a - b);
  const parts: ReactNode[] = [];
  let start = 0;
  for (const end of cuts) {
    parts.push(value.text.slice(start, end));
    const d = value.desktop.includes(end),
      m = value.mobile.includes(end);
    parts.push(
      <br key={end} className={d && m ? undefined : d ? styles.dBr : styles.mBr} />,
    );
    start = end;
  }
  parts.push(value.text.slice(start));
  return <>{parts}</>;
}

function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      →
    </span>
  );
}

/* ------------------------------------------------------------------ plates */

const segRange = {
  desktop: {
    a: [0, segments.desktop.b],
    b: [segments.desktop.b, segments.desktop.c],
    c: [segments.desktop.c, 99999],
  },
  mobile: {
    a: [0, segments.mobile.b],
    b: [segments.mobile.b, segments.mobile.c],
    c: [segments.mobile.c, 99999],
  },
} as const;

const tileSpec = {
  desktop: {
    key: "d",
    rows: dg.plate.rows,
    count: dg.plate.tiles,
    scale: dg.plate.scale,
    widths: [1024, 1536],
    sizes: "(min-width: 1920px) 1920px, 100vw",
  },
  mobile: {
    key: "m",
    rows: mg.plate.rows,
    count: mg.plate.tiles,
    scale: mg.plate.scale,
    widths: [600, 853],
    sizes: "100vw",
  },
} as const;

function tiles(kind: Composition) {
  const t = tileSpec[kind];
  const step = Math.ceil(t.rows / t.count);
  return Array.from({ length: t.count }, (_, n) => {
    const top = n * step;
    const rows = Math.min(step + (n === t.count - 1 ? 0 : 4), t.rows - top);
    return { n, top: top * t.scale, height: rows * t.scale, rows };
  });
}

function srcSet(key: string, n: number, widths: readonly number[], format: string) {
  return widths.map((w) => `${media}${key}-plate-${n}-${w}.${format} ${w}w`).join(", ");
}

/**
 * The first two tiles of each composition share one <picture> so a viewport only
 * ever fetches its own art; the rest are lazy and hidden per breakpoint.
 */
function Plates({ seg }: { seg: Seg }) {
  const out: ReactNode[] = [];
  const d = tiles("desktop"),
    m = tiles("mobile");
  const inSeg = (kind: Composition, top: number, height: number) => {
    const [a, b] = segRange[kind][seg];
    return top < b && top + height > a;
  };
  for (const n of [0, 1]) {
    if (
      !inSeg("desktop", d[n].top, d[n].height) &&
      !inSeg("mobile", m[n].top, m[n].height)
    )
      continue;
    out.push(
      <picture
        key={`s${n}`}
        className={styles.tile}
        style={
          {
            "--td": d[n].top,
            "--hd": d[n].height,
            "--tm": m[n].top,
            "--hm": m[n].height,
          } as Vars
        }
      >
        <source
          media="(min-width: 1024px)"
          type="image/avif"
          srcSet={srcSet("d", n, tileSpec.desktop.widths, "avif")}
          sizes={tileSpec.desktop.sizes}
        />
        <source
          media="(min-width: 1024px)"
          type="image/webp"
          srcSet={srcSet("d", n, tileSpec.desktop.widths, "webp")}
          sizes={tileSpec.desktop.sizes}
        />
        <source
          type="image/avif"
          srcSet={srcSet("m", n, tileSpec.mobile.widths, "avif")}
          sizes={tileSpec.mobile.sizes}
        />
        <img
          src={`${media}m-plate-${n}-853.webp`}
          srcSet={srcSet("m", n, tileSpec.mobile.widths, "webp")}
          sizes={tileSpec.mobile.sizes}
          width={853}
          height={m[n].rows}
          alt=""
          decoding={n === 0 ? "sync" : "async"}
          fetchPriority={n === 0 ? "high" : "auto"}
        />
      </picture>,
    );
  }
  for (const kind of ["desktop", "mobile"] as const) {
    const t = tileSpec[kind];
    for (const tile of (kind === "desktop" ? d : m).slice(2)) {
      if (!inSeg(kind, tile.top, tile.height)) continue;
      out.push(
        <picture
          key={`${t.key}${tile.n}`}
          className={`${styles.tile} ${kind === "desktop" ? styles.onlyD : styles.onlyM}`}
          style={
            kind === "desktop"
              ? ({ "--td": tile.top, "--hd": tile.height } as Vars)
              : ({ "--tm": tile.top, "--hm": tile.height } as Vars)
          }
        >
          <source
            type="image/avif"
            srcSet={srcSet(t.key, tile.n, t.widths, "avif")}
            sizes={t.sizes}
          />
          <img
            src={`${media}${t.key}-plate-${tile.n}-${t.widths[1]}.webp`}
            srcSet={srcSet(t.key, tile.n, t.widths, "webp")}
            sizes={t.sizes}
            width={t.widths[1]}
            height={tile.rows}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>,
      );
    }
  }
  return (
    <div className={styles.plates} data-plates={seg} aria-hidden="true">
      {out}
    </div>
  );
}

function Veils({ seg }: { seg: Seg }) {
  const out: ReactNode[] = [];
  for (const [kind, g] of [
    ["desktop", dg],
    ["mobile", mg],
  ] as const) {
    const [a, b] = segRange[kind][seg];
    g.veils.forEach((v, i) => {
      if (v.top >= b || v.top + v.height <= a) return;
      out.push(
        <div
          key={`${kind}${i}`}
          className={`${styles.veil} ${kind === "desktop" ? styles.onlyD : styles.onlyM}`}
          data-veil={v.kind}
          style={
            (kind === "desktop"
              ? { "--xd": v.left, "--yd": v.top, "--wd": v.width, "--hd": v.height }
              : {
                  "--xm": v.left,
                  "--ym": v.top,
                  "--wm": v.width,
                  "--hm": v.height,
                }) as Vars
          }
        />,
      );
    });
  }
  return <>{out}</>;
}

/* ------------------------------------------------------------------ marks */

function RingGroup({
  kind,
  id,
  live,
}: {
  kind: Composition;
  id: string;
  live?: boolean;
}) {
  const ring = ringMarks(kind)[id];
  return (
    <g className={styles.ring} data-ring={id} data-live={live ? "" : undefined}>
      <path className={styles.ringMain} d={ring.main} data-draw="ring" />
      <path className={styles.ringGhost} d={ring.ghost} data-draw="ring" />
      {ring.label && (
        <text x={ring.label.x.toFixed(1)} y={ring.label.y.toFixed(1)} data-draw="label">
          {ring.label.text}
        </text>
      )}
    </g>
  );
}

function Leader({ kind, id }: { kind: Composition; id: string }) {
  const lead = defaultLeaders(kind)[id];
  if (!lead) return null;
  return (
    <g className={styles.lead} data-lead={id}>
      <path d={lead.d} data-draw="lead" />
      <circle
        cx={lead.dot[0].toFixed(1)}
        cy={lead.dot[1].toFixed(1)}
        r={kind === "desktop" ? 2.2 : 1.8}
        data-draw="dot"
      />
    </g>
  );
}

function Marks({ seg }: { seg: "a" | "b" }) {
  return (
    <>
      {(["desktop", "mobile"] as const).map((kind) => {
        const g = kind === "desktop" ? dg : mg;
        const [top, bottom] = segRange[kind][seg];
        const keys =
          seg === "a" ? ["gable", "windows", "eaves"] : ["c01", "c02", "c03"];
        return (
          <svg
            key={kind}
            className={`${styles.marks} ${kind === "desktop" ? styles.onlyD : styles.onlyM}`}
            viewBox={`0 ${top} ${g.width} ${bottom - top}`}
            style={
              (kind === "desktop"
                ? { "--td": top, "--hd": bottom - top }
                : { "--tm": top, "--hm": bottom - top }) as Vars
            }
            aria-hidden="true"
            data-marks={`${seg}-${kind}`}
          >
            {keys.map((k) => (
              <Leader key={`l${k}`} kind={kind} id={k} />
            ))}
            {keys.map((k) => (
              <RingGroup key={k} kind={kind} id={k} live={seg === "b"} />
            ))}
            {seg === "b" && kind === "desktop" && (
              <g className={styles.lead} data-lead="dim">
                <path d={dimensionPath()} data-draw="lead" />
              </g>
            )}
          </svg>
        );
      })}
    </>
  );
}

/** Each domain ring's inside turns into the photograph first on hover or focus. */
function Reveals() {
  return (
    <>
      {(["desktop", "mobile"] as const).map((kind) => {
        const g = kind === "desktop" ? dg : mg;
        const key = kind === "desktop" ? "d" : "m";
        return (["c01", "c02", "c03"] as const).map((id) => {
          const c = g.rings[id];
          return (
            <div
              key={`${kind}${id}`}
              className={`${styles.reveal} ${kind === "desktop" ? styles.onlyD : styles.onlyM}`}
              data-reveal={id}
              style={
                (kind === "desktop"
                  ? {
                      "--td": g.front.top,
                      "--hd": g.front.height,
                      "--rcx": c.cx,
                      "--rcy": c.cy - g.front.top,
                      "--rr": c.r - 3,
                    }
                  : {
                      "--tm": g.front.top,
                      "--hm": g.front.height,
                      "--rcx": c.cx,
                      "--rcy": c.cy - g.front.top,
                      "--rr": c.r - 2,
                    }) as Vars
              }
              aria-hidden="true"
            >
              <img
                src={`${media}${key}-front-after.webp`}
                alt=""
                loading="lazy"
                decoding="async"
                width={kind === "desktop" ? 1536 : 853}
                height={kind === "desktop" ? 1312 : 2932}
              />
            </div>
          );
        });
      })}
    </>
  );
}

/* ------------------------------------------------------------------ page */

export function AboutPage() {
  return (
    <AboutMotion>
      <a className={styles.skip} href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <ScrollProvider />
      <main id="main-content" className={styles.main}>
        <div className={styles.stage} data-stage>
          <div className={styles.zoneRail}>
            <nav className={styles.zones} aria-label={zonesLabel} data-zones>
              <ol>
                {zones.map((z) => (
                  <li key={z.id}>
                    <a href={`#${z.id}`} data-zone={z.id}>
                      {z.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* A — plan: the ink drawing of the mountains and the ryokan */}
          <div className={styles.seg} data-seg="a">
            <div className={styles.space}>
              <Plates seg="a" />
              <Veils seg="a" />
              <Marks seg="a" />

              <section
                className={`${styles.abs} ${styles.hero}`}
                style={at(80, 178, 26, 100)}
                aria-labelledby="about-title"
              >
                <nav aria-label="パンくず" className={styles.crumb}>
                  <ol>
                    {hero.breadcrumb.map((item, i) => (
                      <li
                        key={item.label}
                        aria-current={
                          i === hero.breadcrumb.length - 1 ? "page" : undefined
                        }
                      >
                        {"href" in item && item.href ? (
                          <Link href={item.href}>{item.label}</Link>
                        ) : (
                          item.label
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
                <p className={`${styles.eyebrow} ${styles.heroEyebrow}`} lang="en">
                  {hero.eyebrow}
                </p>
                <h1 id="about-title" className={styles.display}>
                  {/* One span per line so the entrance can lift them in turn. */}
                  <span className={styles.l1}>経営判断を、</span>
                  <br />
                  <span className={styles.l2}>
                    現場で動く
                    <br className={styles.mBr} />
                    仕組みと成果へ。
                  </span>
                </h1>
                <p className={styles.lead}>
                  <Lines value={hero.lead} />
                </p>
              </section>
              <p
                className={`${styles.abs} ${styles.scroll}`}
                style={at(80, 822, 26, 606)}
                aria-hidden="true"
                lang="en"
              >
                {hero.scroll}
                <span />
              </p>

              <section
                id={role.id}
                className={`${styles.abs} ${styles.anchor}`}
                style={at(80, 990, 26, 1004)}
                aria-labelledby="about-role"
              >
                <p className={styles.eyebrow} lang="en">
                  {role.eyebrow}
                </p>
                <h2 id="about-role" className={styles.section}>
                  {role.title}
                </h2>
                <ul className={styles.wishes}>
                  {role.wishes.map((w) => (
                    <li key={w.id} data-wish={w.id}>
                      <span data-wish-text>
                        <Lines value={w.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <p
                className={`${styles.abs} ${styles.body} ${styles.roleBody}`}
                style={at(80, 1495.3, 26, 1900)}
              >
                <Lines value={role.body} />
              </p>
            </div>
          </div>

          {/* B — the implementation front: held while the plan becomes the place */}
          <div className={styles.pin} id={domains.id} data-pin>
            <div className={styles.seg} data-seg="b">
              <div className={styles.space}>
                <Plates seg="b" />
                <canvas
                  className={`${styles.band} ${styles.front}`}
                  style={
                    {
                      "--td": dg.front.top,
                      "--hd": dg.front.height,
                      "--tm": mg.front.top,
                      "--hm": mg.front.height,
                    } as Vars
                  }
                  data-front
                  aria-hidden="true"
                />
                <Veils seg="b" />
                <Reveals />
                <Marks seg="b" />
                <section
                  className={styles.abs}
                  style={at(80, 2206, 26, 2086)}
                  aria-labelledby="about-domains"
                >
                  <p className={styles.eyebrow} lang="en">
                    {domains.eyebrow}
                  </p>
                  <h2 id="about-domains" className={styles.section}>
                    {domains.title}
                  </h2>
                  <p className={`${styles.body} ${styles.domainsBody}`}>
                    <Lines value={domains.body} />
                  </p>
                  <ol className={styles.rows}>
                    {domains.rows.map((row) => (
                      <li key={row.href} data-row={row.ring}>
                        <a href={row.href} data-route-status={routeStatusOf(row.href)}>
                          <span className={styles.rowNo} aria-hidden="true">
                            {row.number}
                          </span>
                          <span className={styles.rowName} data-row-name>
                            {row.label}
                          </span>
                          <span className={styles.rowDesc}>{row.description}</span>
                          <Arrow />
                        </a>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </div>
          </div>

          {/* C — the place runs by itself; the drawing returns to paper */}
          <div className={styles.seg} data-seg="c">
            <div className={styles.space}>
              <Plates seg="c" />
              <Veils seg="c" />
              <section
                id={stance.id}
                className={`${styles.abs} ${styles.anchor}`}
                style={at(80, 4262, 26, 3548)}
                aria-labelledby="about-stance"
              >
                <p className={styles.eyebrow} lang="en">
                  {stance.eyebrow}
                </p>
                <h2 id="about-stance" className={styles.section}>
                  {stance.title}
                </h2>
                <p className={styles.statement}>
                  <Lines value={stance.statement} />
                </p>
                <p className={`${styles.body} ${styles.stanceBody}`}>
                  <Lines value={stance.body} />
                </p>
              </section>
              <ol
                className={`${styles.abs} ${styles.scale}`}
                style={at(80, 4880, 26, 3935)}
                aria-label="支援の工程"
                data-scale
              >
                {stance.steps.map((step, i) => (
                  <li key={step} data-step={i + 1}>
                    <span className={styles.stepNo}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={styles.seg6}
                      data-tone={i === 5 ? "hollow" : i % 2 === 0 ? "flare" : "ink"}
                      aria-hidden="true"
                    >
                      <i />
                    </span>
                    <span className={styles.stepName}>{step}</span>
                  </li>
                ))}
              </ol>
              <Link
                className={`${styles.abs} ${styles.textLink}`}
                style={at(0, 4985, 26, 4232)}
                href={stance.link.href}
                data-route-status={routeStatusOf(stance.link.href)}
              >
                {stance.link.label}
                <Arrow />
              </Link>
            </div>

            <div className={styles.tail}>
              <section className={styles.audiences} aria-labelledby="about-audiences">
                <h2 id="about-audiences" className={styles.visuallyHidden}>
                  {groupLabels.audiences}
                </h2>
                <ul>
                  {audiences.map((a) => (
                    <li key={a.href}>
                      <Link
                        className={styles.audience}
                        href={a.href}
                        data-route-status={routeStatusOf(a.href)}
                      >
                        <span className={styles.audiencePhoto}>
                          <picture>
                            <source
                              media="(min-width: 1024px)"
                              type="image/avif"
                              srcSet={`${media}d-${a.photo}.avif`}
                            />
                            <source
                              media="(min-width: 1024px)"
                              type="image/webp"
                              srcSet={`${media}d-${a.photo}.webp`}
                            />
                            <source
                              type="image/avif"
                              srcSet={`${media}m-${a.photo}.avif`}
                            />
                            <img
                              src={`${media}m-${a.photo}.webp`}
                              width={776}
                              height={356}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          </picture>
                        </span>
                        <div className={styles.audienceText}>
                          <h3>{a.label}</h3>
                          <p className={styles.audienceDesc}>{a.description}</p>
                        </div>
                        <Arrow />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.call} aria-labelledby="about-call">
                <h2 id="about-call">
                  <Lines value={call.title} />
                </h2>
                <Link
                  className={styles.button}
                  href={call.cta.href}
                  data-route-status={routeStatusOf(call.cta.href)}
                >
                  {call.cta.label}
                  <Arrow />
                </Link>
              </section>

              <section
                id={company.id}
                className={`${styles.company} ${styles.anchor}`}
                aria-labelledby="about-company"
              >
                <div className={styles.companyHead}>
                  <p className={styles.eyebrow} lang="en">
                    {company.eyebrow}
                  </p>
                  <h2 id="about-company" className={styles.section}>
                    {company.title}
                  </h2>
                </div>
                <div className={styles.titleBlock} data-title-block>
                  <span className={styles.tbRule} data-rule="top" aria-hidden="true" />
                  <span className={styles.tbRule} data-rule="left" aria-hidden="true" />
                  <dl className={styles.tbGrid}>
                    <div className={styles.tbName} data-cell>
                      <dt>{company.name.label}</dt>
                      <dd>{company.name.value}</dd>
                    </div>
                    <div className={styles.tbHalf} data-cell>
                      <dt>{company.founded.label}</dt>
                      <dd>{company.founded.value}</dd>
                    </div>
                    <div className={styles.tbHalf} data-cell>
                      <dt>{company.capital.label}</dt>
                      <dd>{company.capital.value}</dd>
                    </div>
                    <div className={styles.tbRep} data-cell>
                      <dt>{company.representative.label}</dt>
                      <dd>
                        {company.representative.value}
                        <span className={styles.signature}>
                          <FounderSignature />
                        </span>
                      </dd>
                    </div>
                    <div className={styles.tbAddress} data-cell>
                      <dt>{company.address.label}</dt>
                      <dd>
                        <span>{company.address.postal}</span>
                        <span>{company.address.value}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
              <span className={styles.frameBase} aria-hidden="true" />
            </div>
          </div>
        </div>
      </main>
      <HomeFooter />
    </AboutMotion>
  );
}
