/* eslint-disable @next/next/no-img-element -- pre-encoded WebP plates and the film poster are placed and
   scaled by the motion (square viewpoints, strip crops, still frames); next/image's wrapper would break that. */
/**
 * HOME — A2r3「二つの視点 — 一本の線」(adopted 2026-10-02).
 *
 * One DOM for both prototypes: ≥ 1024 px follows `home-r3-2026-10-02/build/
 * A2.html`, < 1024 px `home-r3-mobile-2026-10-02/build/A2m.html` (spec §8).
 * Every string is DOM text from `@/content/adelva-home`; photographs carry no
 * text. The page reads completely without script or under reduced motion
 * (the module CSS lays the scenes out as a still document); `HomeMotion`
 * adds the choreography.
 */
import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import {
  approach,
  expertise,
  founder,
  purpose,
  skipLabel,
  who,
  yourChallenges,
  type Lines,
} from "@/content/adelva-home";
import { homeGeometry as G } from "@/content/adelva-home-geometry";
import { getAsset, getVideoAsset } from "@/content/assets";
import { routeStatusOf } from "@/content/adelva-navigation";

import { HomeMotion } from "./home-motion";
import { signatureStrokes, signatureViewBox } from "./signature";
import styles from "./home.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Characters as separate spans (read in by scroll); the text itself is announced once. */
function Chars({ text, className }: { text: string; className: string }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className={className} data-ch="">
          {ch}
        </span>
      ))}
    </>
  );
}

function Eyebrow({
  en,
  ja,
  className,
  id,
}: {
  en: string;
  ja: string;
  className?: string;
  id?: string;
}) {
  return (
    <p className={`${styles.eyebrow} ${className ?? ""}`} id={id}>
      <span className={styles.en} lang="en">
        {en}
      </span>
      <span className={styles.rule} aria-hidden="true" />
      <span>{ja}</span>
    </p>
  );
}

function Arrow() {
  return <span className={styles.arrow} aria-hidden="true" />;
}

function Circle() {
  return (
    <span className={styles.circle} aria-hidden="true">
      <Arrow />
    </span>
  );
}

/** A line inside a clipping mask that rises into place. */
function Mask({ children }: { children: ReactNode }) {
  return (
    <span className={styles.mask}>
      <span data-rise="">{children}</span>
    </span>
  );
}

/**
 * One approved string with the line breaks of both prototypes. The text is
 * emitted once; each `<br>` carries the regime it belongs to.
 */
function Broken({ lines }: { lines: Lines }) {
  const cuts = (parts: readonly string[]) => {
    const out = new Set<number>();
    let offset = 0;
    for (const part of parts.slice(0, -1)) {
      offset += part.length;
      out.add(offset);
    }
    return out;
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

function Link({
  href,
  className,
  children,
  ...rest
}: { href: string; className: string; children: ReactNode } & Record<
  `data-${string}`,
  string
>) {
  return (
    <a
      href={href}
      className={className}
      data-route-status={routeStatusOf(href)}
      {...rest}
    >
      {children}
    </a>
  );
}

export function HomePage() {
  const poster = getAsset("hero-poster");
  const film = getVideoAsset("hero-antarctica");
  const statementCut = purpose.statementLines.mobile; // 経営判断を、｜現場で動く｜仕組みと成果へ。
  const leadBreak = (i: number) => {
    const desktop = (approach.leadBreaks.desktop as readonly number[]).includes(i);
    const mobile = (approach.leadBreaks.mobile as readonly number[]).includes(i);
    if (!desktop && !mobile) return null;
    return (
      <br
        className={
          desktop && mobile
            ? undefined
            : desktop
              ? styles.desktopBreak
              : styles.mobileBreak
        }
      />
    );
  };

  return (
    <div className={styles.root} data-home-root="" lang="ja">
      <a className={styles.skip} href="#main-content" data-skip-link="">
        {skipLabel}
      </a>
      <ScrollProvider />
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        {/* the one line on phones (fixed; drawn by the motion) */}
        <span className={styles.spine} data-spine="" aria-hidden="true" />

        {/* 1 — the film opens from an orange seam; ADELVA rises; the film parts and leaves the seam */}
        <section
          className={styles.hero}
          data-scene="hero"
          aria-labelledby="home-purpose"
        >
          <div className={styles.stage} data-stage="">
            <div className={styles.purpose} data-purpose="">
              <div className={styles.purposeBlock} data-purpose-block="">
                <Eyebrow
                  en={purpose.eyebrow.en}
                  ja={purpose.eyebrow.ja}
                  className={styles.purposeEyebrow}
                />
                <h1 className={styles.statement} id="home-purpose" data-statement="">
                  <span className={styles.srOnly}>{purpose.statement}</span>
                  <span aria-hidden="true">
                    <span className={styles.line}>
                      <em data-mark="">
                        <Chars text="経営判断" className={styles.ch} />
                      </em>
                      <Chars text="を、" className={styles.ch} />
                    </span>
                    <span className={styles.line}>
                      <span className={styles.seg}>
                        <em data-mark="">
                          <Chars text="現場" className={styles.ch} />
                        </em>
                        <Chars text={statementCut[1]!.slice(2)} className={styles.ch} />
                      </span>
                      <span className={styles.seg}>
                        <Chars text={statementCut[2]!} className={styles.ch} />
                      </span>
                    </span>
                  </span>
                </h1>
                <p className={styles.purposeBody} data-purpose-body="">
                  {purpose.body[0]}
                  <br />
                  {purpose.body[1]}
                </p>
              </div>
            </div>

            <div className={styles.film} data-film="" aria-hidden="true">
              <div className={styles.filmWhole} data-film-whole="">
                {/* LCP and the still/no-script frame; the film replaces it once it plays */}
                <img
                  className={styles.poster}
                  src={poster.src}
                  width={poster.width}
                  height={poster.height}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                />
                <video
                  className={styles.video}
                  data-film-video=""
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={poster.src}
                  tabIndex={-1}
                >
                  {(film.sources ?? [{ src: film.src, type: "video/mp4" }]).map(
                    (source) => (
                      <source
                        key={source.src}
                        src={source.src}
                        type={source.type}
                        media={"media" in source ? source.media : undefined}
                      />
                    ),
                  )}
                </video>
                <span className={styles.shade} />
              </div>
              <div className={styles.half} data-half="l">
                <canvas className={styles.media} />
                <span className={styles.shade} />
              </div>
              <div className={styles.half} data-half="r">
                <canvas className={styles.media} />
                <span className={styles.shade} />
              </div>
              <p className={styles.giant} data-giant="">
                <span className={styles.word} data-giant-word="">
                  {[..."ADELVA"].map((c, i) => (
                    <span key={i} className={styles.lt} style={{ "--i": i } as Vars}>
                      <span>{c}</span>
                    </span>
                  ))}
                </span>
              </p>
            </div>
            <span className={styles.centerSeam} aria-hidden="true" />
            <span className={styles.scrollSeam} data-seam="" aria-hidden="true" />
            <button
              type="button"
              className={styles.filmToggle}
              data-film-toggle=""
              aria-pressed="false"
              aria-label="背景映像を一時停止"
            >
              <span aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* 2 — two columns on paper become two photographs; the seam goes to the view being read */}
        <section className={styles.who} data-scene="who" aria-labelledby="home-who">
          <div className={styles.stage} data-stage="">
            <div className={styles.intro} data-who-intro="">
              <Eyebrow
                en={who.eyebrow.en}
                ja={who.eyebrow.ja}
                className={styles.whoEyebrow}
                id="home-who"
              />
              <h2 className={styles.whoOwner} data-who-h="t">
                <Mask>{who.owner[0]}</Mask>
                <Mask>{who.owner[1]}</Mask>
              </h2>
              <h2 className={styles.whoField} data-who-h="b">
                <Mask>{who.field[0]}</Mask>
                <Mask>{who.field[1]}</Mask>
              </h2>
              <p className={styles.whoIntro} data-who-p="">
                {who.intro[0]}
                <br />
                {who.intro[1]}
              </p>
            </div>
            {who.cards.map((card, i) => (
              <div
                key={card.number}
                className={styles.side}
                data-side={i === 0 ? "t" : "b"}
              >
                <img
                  className={styles.sideImage}
                  src={i === 0 ? G.who.owner : G.who.field}
                  width={1254}
                  height={1254}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  data-side-img=""
                />
                <Link href={card.href} className={styles.card} data-card="">
                  <span className={styles.cardKey}>
                    <span className={styles.num}>{card.number}</span>
                    <span className={styles.rule} aria-hidden="true" />
                    <span>{card.viewpoint}</span>
                  </span>
                  <h3 className={styles.cardTitle}>
                    <span>{card.title[0]}</span>
                    <span>{card.title[1]}</span>
                  </h3>
                  <span className={styles.more} data-more="">
                    <span className={styles.cardBody}>
                      {card.body[0]}
                      <br />
                      {card.body[1]}
                    </span>
                    <span className={`${styles.cue} ${styles.cardCue}`}>
                      <Circle />
                    </span>
                  </span>
                </Link>
              </div>
            ))}
            <span className={styles.whoSeam} data-who-seam="" aria-hidden="true" />
          </div>
        </section>

        {/* 3 — walking the lakeside path past five places of the inn */}
        <section
          className={styles.challenges}
          data-scene="challenges"
          aria-labelledby="home-challenges"
        >
          <div className={styles.stage} data-stage="">
            <canvas className={styles.gl} data-pano="" aria-hidden="true" />
            <span
              className={`${styles.chShade} ${styles.chShadeTop}`}
              aria-hidden="true"
            />
            <span className={styles.chShade} aria-hidden="true" />
            <div className={styles.chHead} data-ch-head="">
              <Eyebrow en={yourChallenges.eyebrow.en} ja={yourChallenges.eyebrow.ja} />
              <h2 className={styles.chTitle} id="home-challenges">
                <Mask>{yourChallenges.title}</Mask>
              </h2>
            </div>
            <ol className={styles.slot} data-slot="">
              {yourChallenges.items.map((item, i) => (
                <li key={item.number} className={styles.item} data-item={i}>
                  <img
                    className={styles.itemStill}
                    src={G.pano.stills[i]}
                    width={1536}
                    height={1024}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <Link href={item.href} className={styles.itemLink}>
                    <span className={styles.itemNo}>
                      <b className={styles.num}>{item.number}</b>
                      <span className={styles.num}>/ 05</span>
                      <span className={styles.itemRule} aria-hidden="true" />
                    </span>
                    <h3 className={styles.itemTitle}>
                      <Mask>{item.title[0]}</Mask>
                      <Mask>{item.title[1]}</Mask>
                    </h3>
                    <span className={styles.itemRow}>
                      <span className={styles.itemBody}>{item.description}</span>
                      <span className={styles.cue}>
                        {yourChallenges.cue}
                        <Circle />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className={styles.rail} data-rail="" aria-hidden="true">
              <span className={styles.track} data-track="" />
              <span className={styles.fill} />
              {yourChallenges.items.map((item, i) => (
                <span
                  key={item.number}
                  className={`${styles.node} ${styles.num}`}
                  style={{ left: `${(i / 4) * 100}%` }}
                  data-node=""
                >
                  <i />
                  {item.number}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — the founder's letter, signed */}
        <section
          className={styles.founder}
          data-scene="founder"
          aria-labelledby="home-founder"
        >
          <div className={styles.stage} data-stage="">
            <div className={styles.letter}>
              <div className={styles.letterLead}>
                <span
                  className={styles.quoteMark}
                  data-quote-mark=""
                  aria-hidden="true"
                >
                  “
                </span>
                <h2
                  className={styles.founderLead}
                  id="home-founder"
                  data-founder-lead=""
                >
                  <span className={styles.srOnly}>{founder.lead.join("")}</span>
                  <span aria-hidden="true">
                    {founder.lead.map((line, i) => (
                      <span key={line}>
                        <Chars text={line} className={styles.ch} />
                        {i < founder.lead.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </span>
                </h2>
              </div>
              <div className={styles.letterRest}>
                {founder.paragraphs.map((text) => (
                  <p key={text} data-founder-p="">
                    {text}
                  </p>
                ))}
              </div>
            </div>
            <div className={styles.sign} data-sign="">
              <svg
                viewBox={signatureViewBox}
                role="img"
                aria-label={founder.signatureLabel}
                data-signature=""
              >
                {signatureStrokes.map((stroke, i) => (
                  <path
                    key={i}
                    d={stroke.d}
                    className={stroke.flourish ? styles.flourish : undefined}
                    transform={
                      stroke.flourish
                        ? undefined
                        : `translate(${stroke.dx} ${stroke.dy})`
                    }
                  />
                ))}
              </svg>
              <span className={styles.nib} data-nib="" aria-hidden="true" />
              <p className={styles.signer} data-signer="">
                <b>{founder.author}</b>
                <span lang="en">{founder.role}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 5 — three views close into one plan */}
        <section
          className={styles.expertise}
          data-scene="expertise"
          aria-labelledby="home-expertise"
        >
          <div className={styles.stage} data-stage="">
            <Eyebrow
              en={expertise.eyebrow.en}
              ja={expertise.eyebrow.ja}
              className={styles.exEyebrow}
              id="home-expertise"
            />
            <div className={styles.strips}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.strip} data-strip={i} aria-hidden="true">
                  <picture>
                    <source media="(max-width: 1023.98px)" srcSet={G.expertise.tall} />
                    <img
                      src={G.expertise.wide}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </div>
              ))}
              {expertise.domains.map((domain, i) => (
                <Link
                  key={domain.number}
                  href={domain.href}
                  className={styles.domain}
                  data-domain={String(i)}
                >
                  <span className={`${styles.num} ${styles.domainNum}`}>
                    {domain.number}
                  </span>
                  <h3 className={styles.domainTitle}>{domain.label}</h3>
                  <span className={styles.domainBody}>{domain.description}</span>
                  <span className={`${styles.cue} ${styles.domainCue}`}>
                    {expertise.cue}
                    <Arrow />
                  </span>
                </Link>
              ))}
            </div>
            <span className={styles.hair} data-hair="" aria-hidden="true" />
            <span className={styles.hair} data-hair="" aria-hidden="true" />
            <span className={styles.veil} aria-hidden="true" />
            <div className={styles.plan} data-plan="">
              <h2 className={styles.planTitle}>
                {expertise.plan[0]}
                <br />
                {expertise.plan[1]}
              </h2>
              <p className={styles.planBody}>{expertise.planBody}</p>
            </div>
            <nav
              className={styles.index}
              data-index=""
              aria-label={expertise.eyebrow.ja}
            >
              {expertise.domains.map((domain) => (
                <Link
                  key={domain.number}
                  href={domain.href}
                  className={styles.indexLink}
                >
                  <span className={styles.num}>{domain.number}</span>
                  <b>{domain.label}</b>
                  <Arrow />
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* 6 — the sentence lies down on the lake and becomes the way across */}
        <section
          className={styles.approach}
          data-scene="approach"
          aria-labelledby="home-approach"
        >
          <div className={styles.stage} data-stage="">
            <canvas className={styles.gl} data-lake="" aria-hidden="true" />
            <img
              className={styles.lakeStill}
              src={G.lake.still}
              width={1536}
              height={1024}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className={styles.lead}>
              <Eyebrow
                en={approach.eyebrow.en}
                ja={approach.eyebrow.ja}
                className={styles.leadEyebrow}
                id="home-approach"
              />
              <h2 className={styles.leadTitle} data-lead="">
                {approach.lead.map(({ step, glue }) => (
                  <span key={step}>
                    <span className={styles.st} data-st="">
                      {approach.steps[step]!.name}
                    </span>
                    <span className={styles.glue}>{glue}</span>
                    {leadBreak(step)}
                  </span>
                ))}
              </h2>
            </div>
            <span className={styles.apShade} aria-hidden="true" />
            <div className={styles.apCard} data-ap-card="">
              <Eyebrow
                en={approach.eyebrow.en}
                ja={approach.eyebrow.ja}
                className={styles.apCardEyebrow}
              />
              <span className={styles.ticks} aria-hidden="true">
                {approach.steps.map((s) => (
                  <i key={s.number} data-tick="" />
                ))}
              </span>
              <ol className={styles.steps}>
                {approach.steps.map((s) => (
                  <li key={s.number} className={styles.step} data-step="">
                    <span className={styles.stepNo}>
                      <b className={styles.num}>{s.number}</b>
                      <span className={styles.num}>/ 06</span>
                      <span className={styles.itemRule} aria-hidden="true" />
                    </span>
                    <h3 className={styles.stepName}>
                      <Mask>{s.name}</Mask>
                    </h3>
                    <ul className={styles.tags}>
                      {s.tags.map((tag) => (
                        <li key={tag} data-tag="">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
            <ol className={styles.rail6} aria-hidden="true">
              {approach.steps.map((s) => (
                <li key={s.number} data-rail6="">
                  <span>{s.name}</span>
                  <span className={styles.n}>{s.number}</span>
                  <i />
                </li>
              ))}
            </ol>
            <div className={styles.final} data-final="">
              <p className={styles.finalBody}>
                <Broken lines={approach.bodyLines} />
              </p>
              <Link href={approach.href} className={`${styles.cue} ${styles.finalCue}`}>
                {approach.cue}
                <Circle />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <HomeFooter />
      <HomeMotion />
    </div>
  );
}
