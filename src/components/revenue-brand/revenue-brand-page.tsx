/* eslint-disable @next/next/no-img-element -- pre-encoded, art-directed decorative plates share SVG coordinates. */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { HomeFooter } from "@/components/home/home-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollProvider } from "@/components/scroll-provider";
import { routeStatusOf } from "@/content/adelva-navigation";
import * as copy from "@/content/adelva-revenue-brand";
import {
  desktopGeometry as d,
  mobileGeometry as m,
  cardGeometry,
} from "@/content/adelva-revenue-brand-geometry";
import { ChipGroup } from "./chip-group";
import { RiverLines } from "./river-lines";
import { RevenueBrandMotion } from "./revenue-brand-motion";
import styles from "./revenue-brand.module.css";
type Vars = CSSProperties & Record<`--${string}`, string | number>;
const media = "/media/adelva/revenue-brand/";
function pos(xd: number, yd: number, xm: number, ym: number, fd = 15, fm = 12): Vars {
  return {
    "--x-d": xd,
    "--y-d": yd,
    "--x-m": xm,
    "--y-m": ym,
    "--font-d": fd,
    "--font-m": fm,
  };
}
function chipPos(a: readonly number[], b: readonly number[]): Vars {
  return pos(a[0], a[1], b[0], b[1]);
}
function Tight({ children }: { children: string }) {
  return children.split("・").map((s, i) => (
    <span key={i}>
      {i > 0 && <span className={styles.nakaguro}>・</span>}
      {s}
    </span>
  ));
}
function cardBreaks(text: string): number[] {
  for (const mark of ["人材、", "システム、"]) {
    const at = text.indexOf(mark);
    if (at >= 0) return [at + mark.length];
  }
  return [];
}
function BrokenText({
  text,
  desktop = [],
  mobile = [],
}: {
  text: string;
  desktop?: readonly number[];
  mobile?: readonly number[];
}) {
  const parts: ReactNode[] = [];
  let start = 0;
  for (const end of [...new Set([...desktop, ...mobile, text.length])].sort(
    (a, b) => a - b,
  )) {
    parts.push(text.slice(start, end));
    if (end < text.length)
      parts.push(
        <br
          key={end}
          className={
            desktop.includes(end)
              ? mobile.includes(end)
                ? undefined
                : styles.desktopBreak
              : styles.mobileBreak
          }
        />,
      );
    start = end;
  }
  return <>{parts}</>;
}
function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      →
    </span>
  );
}
function Plates() {
  return (
    <div className={styles.plate} aria-hidden="true">
      {(["d", "m"] as const).map((key) => {
        const desktop = key === "d";
        const count = desktop ? 8 : 10,
          width = desktop ? 1536 : 853,
          height = desktop ? 8704 : 12960,
          small = desktop ? 1024 : 600;
        return (
          <div key={key} className={desktop ? styles.desktopPlate : styles.mobilePlate}>
            {Array.from({ length: count }, (_, n) => {
              const h = height / count + (n === count - 1 ? 0 : 4);
              return (
                <picture
                  key={n}
                  style={{
                    top: `${(n / count) * 100}%`,
                    height: `${(h / height) * 100}%`,
                  }}
                >
                  <source
                    type="image/avif"
                    srcSet={`${media}${key}-plate-${n}-${small}.avif ${small}w, ${media}${key}-plate-${n}-${width}.avif ${width}w`}
                    sizes="(min-width: 1920px) 1920px, 100vw"
                  />
                  <img
                    src={`${media}${key}-plate-${n}-${width}.webp`}
                    srcSet={`${media}${key}-plate-${n}-${small}.webp ${small}w, ${media}${key}-plate-${n}-${width}.webp ${width}w`}
                    sizes="(min-width: 1920px) 1920px, 100vw"
                    width={width}
                    height={h}
                    alt=""
                    loading={n === 1 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </picture>
              );
            })}
          </div>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <img
          key={i}
          className={styles.fog}
          data-fog={i % 2}
          src={`${media}f${(i % 2) + 1}-1536.webp`}
          srcSet={`${media}f${(i % 2) + 1}-768.webp 768w, ${media}f${(i % 2) + 1}-1536.webp 1536w`}
          sizes="100vw"
          width="1536"
          height="1024"
          loading="lazy"
          decoding="async"
          alt=""
          style={pos(
            0,
            [1300, 2300, 3500, 4600, 5600, 6900][i],
            0,
            [700, 1400, 2200, 3300, 4300, 5200][i],
          )}
        />
      ))}
      <div className={styles.dawn} data-dawn />
      <div className={styles.windows} data-windows />
      <div className={styles.endFade} />
      <div className={styles.heroVeil} data-hero-veil />
    </div>
  );
}
function Tags({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.tags}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
function Rail() {
  const items = [
    { id: "rb-hero", title: copy.hero.title },
    ...copy.chapters,
    { id: "rb-process", title: copy.processCopy.title },
  ];
  return (
    <>
      <nav className={styles.rail} aria-label="ページ内の位置" data-rail="desktop">
        <svg viewBox="0 0 44 280" aria-hidden="true">
          <path d="M22 8C38 45 8 64 22 104S36 162 22 204 30 252 22 272" />
          <circle r="5" cx="22" cy="8" data-rail-dot />
        </svg>
        {items.map((item, i) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.title}
            aria-current={i === 0 ? "location" : undefined}
            style={{ top: `${i * 25}%` }}
          >
            <span className={i === 4 ? styles.railSquare : styles.railNode} />
            <span className={styles.railLabel}>{item.title}</span>
          </a>
        ))}
      </nav>
      <div className={styles.mobileRail} aria-hidden="true" data-rail="mobile">
        <svg viewBox="0 0 16 140" preserveAspectRatio="none">
          <path d="M8 4C16 24 1 40 8 65S14 95 8 136" />
          {[4, 37, 70, 103].map((y) => (
            <circle key={y} cx="8" cy={y} r="4" />
          ))}
          <rect x="5" y="132" width="6" height="6" />
          <circle r="4" cx="8" cy="4" data-rail-dot />
        </svg>
      </div>
    </>
  );
}
export function RevenueBrandPage() {
  return (
    <RevenueBrandMotion>
      <a className={styles.skip} href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <ScrollProvider />
      <main id="main-content" className={styles.main}>
        <div className={styles.stage} data-stage>
          <Plates />
          {/* The light the river carries, cast onto the water around the head. */}
          <div className={styles.lantern} data-lantern aria-hidden="true" />
          <RiverLines />
          <RiverLines mobile />
          <section id="rb-hero" aria-labelledby="rb-title" data-section="hero">
            <nav
              className={`${styles.position} ${styles.breadcrumb}`}
              style={pos(59, 361, 22, 286)}
              aria-label="パンくず"
            >
              <ol>
                {copy.breadcrumb.items.map((item, i) => (
                  <li key={item.label} aria-current={i === 2 ? "page" : undefined}>
                    {item.href ? (
                      <Link href={item.href}>{item.label}</Link>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <p
              className={`${styles.position} ${styles.heroIndex}`}
              style={pos(59, 409, 22, 311, 36, 20)}
            >
              <span>{copy.hero.number}</span>
              <i aria-hidden="true" />
              <span>{copy.hero.indexLabel}</span>
            </p>
            <h1
              id="rb-title"
              className={`${styles.position} ${styles.title} ${styles.scrim}`}
              style={pos(62, 464, 22, 340, 96, 46)}
              data-landmark="h1"
            >
              <Tight>{"収益・"}</Tight>
              <br className={styles.mobileBreak} />
              {"ブランド成長"}
            </h1>
            <p
              lang="en"
              className={`${styles.position} ${styles.roman}`}
              style={pos(63, 579, 24, 460, 15, 10)}
            >
              {copy.hero.roman}
            </p>
            <p
              className={`${styles.position} ${styles.heroLead} ${styles.scrim}`}
              style={pos(62, 624, 24, 484, 27, 15)}
            >
              <BrokenText
                text={copy.hero.lead}
                desktop={[copy.hero.lead.indexOf("宿泊")]}
                mobile={[copy.hero.lead.indexOf("営業")]}
              />
            </p>
            <Link
              className={`${styles.position} ${styles.cta}`}
              style={pos(62, 720, 24, 530, 20, 14)}
              href={copy.hero.cta.href}
            >
              {copy.hero.cta.label}
              <Arrow />
            </Link>
            <ul aria-label="集客の源流">
              {copy.sources.items.map(({ id, label }) => (
                <li
                  key={id}
                  className={`${styles.chip} ${styles.placedChip} ${styles.sourceChip}`}
                  data-source-chip={id}
                  style={chipPos(
                    d.css.chips.sources[id as keyof typeof d.css.chips.sources],
                    m.css.chips.sources[id as keyof typeof m.css.chips.sources],
                  )}
                >
                  {label}
                </li>
              ))}
            </ul>
            <p
              className={`${styles.position} ${styles.scroll}`}
              style={pos(720, 752, 195, 590, 12, 10)}
              aria-hidden="true"
            >
              SCROLL
              <span data-scroll-cue />
            </p>
            <nav className={styles.chapterIndex} aria-label="章目次">
              <ol>
                {copy.chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`}>
                      <span className={styles.indexDot} aria-hidden="true" />
                      <span className={styles.indexNumber}>{c.number}</span>
                      <span>{c.title}</span>
                      <span className={styles.down} aria-hidden="true">
                        ↓
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </section>
          {copy.chapters.map((chapter, i) => (
            <section
              key={chapter.id}
              id={chapter.id}
              className={styles.chapter}
              aria-labelledby={`${chapter.id}-title`}
              style={{ "--anchor-d": chapter.yD, "--anchor-m": chapter.yM } as Vars}
            >
              <p
                className={`${styles.position} ${styles.number} ${i < 2 ? styles.center : ""}`}
                style={pos(
                  chapter.xD,
                  chapter.yD,
                  chapter.xM,
                  chapter.yM,
                  [28, 34, 40][i],
                  [13, 13, 20][i],
                )}
              >
                {chapter.number}
              </p>
              <h2
                id={`${chapter.id}-title`}
                data-landmark={`ch${i + 1}`}
                className={`${styles.position} ${styles.heading} ${styles.scrim} ${i < 2 ? styles.center : ""}`}
                style={pos(
                  chapter.xD,
                  [1056, 2437, 3977][i],
                  chapter.xM,
                  [1026, 2000, 3048][i],
                  [56, 82, 60][i],
                  [24, 26, 28][i],
                )}
              >
                <Tight>{chapter.title}</Tight>
              </h2>
              {i === 0 && (
                <>
                  <ChipGroup
                    kind="acquisition"
                    label={copy.acquisition.label}
                    initial={copy.acquisition.initial}
                    items={copy.acquisition.items.map((item) => ({
                      ...item,
                      style: chipPos(
                        d.css.chips.ch1[item.id as keyof typeof d.css.chips.ch1],
                        m.css.chips.ch1[item.id as keyof typeof m.css.chips.ch1],
                      ),
                    }))}
                  />
                  <p
                    className={`${styles.chip} ${styles.placedChip} ${styles.revenue}`}
                    style={chipPos(d.css.chips.ch1.revenue, m.css.chips.ch1.revenue)}
                    data-revenue-chip
                  >
                    {copy.detail.revenue}
                  </p>
                  {[0, 1].map((index) => (
                    <article
                      key={index}
                      className={index === 1 ? styles.sales : undefined}
                    >
                      <p
                        className={`${styles.position} ${styles.number}`}
                        style={pos(
                          index === 0 ? 59 : 1380,
                          1548,
                          index === 0 ? 20 : 371,
                          index === 0 ? 1627 : 1698,
                          48,
                          20,
                        )}
                      >
                        {copy.services[index].number}
                      </p>
                      <h3
                        className={`${styles.position} ${styles.serviceName} ${styles.scrim}`}
                        style={pos(
                          index === 0 ? 59 : 1380,
                          1612,
                          index === 0 ? 20 : 371,
                          index === 0 ? 1648 : 1719,
                          40,
                          16,
                        )}
                      >
                        <Tight>{copy.services[index].name}</Tight>
                      </h3>
                      <p
                        className={`${styles.position} ${styles.description} ${styles.scrim}`}
                        style={pos(
                          index === 0 ? 59 : 1380,
                          1674,
                          index === 0 ? 20 : 371,
                          index === 0 ? 1671 : 1742,
                          19,
                          12,
                        )}
                      >
                        {index === 0 ? copy.detail.acquisition : copy.detail.sales}
                      </p>
                    </article>
                  ))}
                </>
              )}
              {i === 1 && (
                <>
                  <svg width="0" height="0" aria-hidden="true">
                    <defs>
                      <filter id="rb-ripple">
                        <feTurbulence
                          type="fractalNoise"
                          baseFrequency="0.012 0.06"
                          numOctaves="2"
                          seed="7"
                        />
                        <feDisplacementMap
                          in="SourceGraphic"
                          scale="0"
                          xChannelSelector="R"
                          yChannelSelector="G"
                          data-ripple
                        />
                      </filter>
                    </defs>
                  </svg>
                  <p
                    className={`${styles.position} ${styles.reflection} ${styles.center}`}
                    style={pos(720, 2531, 195, 2036, 82, 26)}
                    aria-hidden="true"
                    data-reflection
                  >
                    <Tight>{chapter.title}</Tight>
                  </p>
                  {[2, 3].map((index) => (
                    <article key={index}>
                      <p
                        className={`${styles.position} ${styles.number} ${styles.center}`}
                        style={pos(
                          index === 2 ? 459 : 1000,
                          2662,
                          195,
                          index === 2 ? 2337 : 2450,
                          40,
                          18,
                        )}
                      >
                        {copy.services[index].number}
                      </p>
                      <h3
                        className={`${styles.position} ${styles.serviceName} ${styles.center}`}
                        style={pos(
                          index === 2 ? 459 : 1000,
                          2710,
                          195,
                          index === 2 ? 2358 : 2470,
                          36,
                          18,
                        )}
                      >
                        {copy.services[index].name}
                      </h3>
                      <div
                        className={`${styles.position} ${styles.bracketTags} ${styles.center}`}
                        style={pos(
                          index === 2 ? 459 : 1000,
                          2793,
                          195,
                          index === 2 ? 2395 : 2505,
                        )}
                      >
                        {index === 2 ? (
                          <Tags items={copy.detail.websiteTags} />
                        ) : (
                          <ChipGroup
                            kind="photo"
                            label={copy.photos.label}
                            initial={copy.photos.initial}
                            items={copy.photos.items}
                          />
                        )}
                      </div>
                    </article>
                  ))}
                  <p
                    className={`${styles.position} ${styles.center} ${styles.note}`}
                    style={pos(720, 2870, 195, 2545, 15, 12)}
                  >
                    {copy.detail.note}
                  </p>
                </>
              )}
              {i === 2 && (
                <>
                  <article>
                    <p
                      className={`${styles.position} ${styles.number}`}
                      style={pos(966, 4088, 22, 3083, 40, 18)}
                    >
                      15
                    </p>
                    <h3
                      className={`${styles.position} ${styles.serviceName} ${styles.scrim}`}
                      style={pos(966, 4131, 22, 3101, 34, 16)}
                    >
                      {copy.services[4].name}
                    </h3>
                    <p
                      className={`${styles.position} ${styles.description} ${styles.socialDescription} ${styles.scrim}`}
                      style={pos(966, 4208, 22, 3127, 19, 13)}
                    >
                      <BrokenText
                        text={copy.detail.social}
                        desktop={[copy.detail.social.indexOf("Web")]}
                        mobile={[copy.detail.social.indexOf("Web")]}
                      />
                    </p>
                  </article>
                  <ol aria-label="SNS運用の循環">
                    {copy.loop.items.map(({ id, label }) => (
                      <li
                        key={id}
                        data-loop-chip={id}
                        data-loop-current={id === "posting" ? "true" : undefined}
                        className={`${styles.chip} ${styles.placedChip}`}
                        style={chipPos(
                          d.css.chips.loop[id as keyof typeof d.css.chips.loop],
                          m.css.chips.loop[id as keyof typeof m.css.chips.loop],
                        )}
                      >
                        {label}
                      </li>
                    ))}
                  </ol>
                  <p
                    data-loop-chip="web-booking"
                    className={`${styles.chip} ${styles.placedChip}`}
                    style={chipPos(
                      d.css.chips.loop["web-booking"],
                      m.css.chips.loop["web-booking"],
                    )}
                  >
                    {copy.loop.exit.label}
                  </p>
                </>
              )}
            </section>
          ))}
          <section aria-labelledby="rb-diff-title" data-differences>
            <h2
              id="rb-diff-title"
              data-landmark="differences"
              className={`${styles.position} ${styles.heading} ${styles.center} ${styles.scrim}`}
              style={pos(720, 4653, 195, 3781, 56, 24)}
            >
              {copy.differences.title}
            </h2>
            <dl>
              {copy.differences.items.map((item, i) => {
                const x = i % 2 === 0 ? 152 : 925,
                  y = i < 2 ? 4750 : 4946;
                const ym =
                  m.css.dots.differences[
                    item.number as keyof typeof m.css.dots.differences
                  ][1] - 22;
                return (
                  <div key={item.number} data-difference-item>
                    <dt>
                      <span
                        className={`${styles.position} ${styles.number}`}
                        style={pos(x, y, 128, ym, 40, 17)}
                      >
                        {item.number}
                      </span>
                      <span
                        className={`${styles.position} ${styles.serviceName} ${styles.scrim}`}
                        style={pos(x, y + 51, 128, ym + 19, 38, 16)}
                      >
                        <Tight>{item.name}</Tight>
                      </span>
                    </dt>
                    <dd
                      className={`${styles.position} ${styles.description} ${styles.differenceDescription} ${styles.scrim}`}
                      style={pos(x, y + 106, 128, ym + 41, 18, 12)}
                    >
                      {item.description}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p
              className={`${styles.position} ${styles.boundaryNote}`}
              style={pos(339, 5119, 47, 4164, 15, 12)}
            >
              {copy.differences.note}
            </p>
          </section>
          <section
            id="rb-process"
            className={styles.chapter}
            aria-labelledby="rb-process-title"
            style={{ "--anchor-d": 5782, "--anchor-m": 4490 } as Vars}
            data-process
          >
            <h2
              id="rb-process-title"
              data-landmark="process"
              className={`${styles.position} ${styles.heading} ${styles.processHeading} ${styles.scrim}`}
              style={pos(720, 5782, 26, 4490, 60, 24)}
            >
              {copy.processCopy.title}
            </h2>
            <p
              className={`${styles.position} ${styles.processLead} ${styles.scrim}`}
              style={pos(720, 5871, 26, 4523, 28, 15)}
            >
              <BrokenText
                text={copy.processCopy.lead}
                mobile={[copy.processCopy.lead.indexOf("運用")]}
              />
            </p>
            <p
              className={`${styles.position} ${styles.processBody} ${styles.scrim}`}
              style={pos(720, 5936, 26, 4573, 20, 13)}
            >
              <BrokenText
                text={copy.processCopy.body}
                desktop={[copy.processCopy.body.indexOf("支援終了")]}
                mobile={[]}
              />
            </p>
            <div
              className={`${styles.position} ${styles.progress}`}
              style={pos(67, 5889, 27, 4645, 36, 18)}
              aria-hidden="true"
            >
              <span className={styles.counterWindow}>
                <span data-counter>06</span>
              </span>
              <span className={styles.total}> / 06</span>
              <div className={styles.progressBar}>
                {copy.processCopy.steps.map((s, i) => (
                  <span
                    key={s.number}
                    data-progress-segment={i + 1}
                    data-reached="true"
                  />
                ))}
              </div>
            </div>
            <ol aria-label="支援の工程">
              {copy.processCopy.steps.map((step, i) => {
                const p =
                  m.css.dots.process[step.number as keyof typeof m.css.dots.process];
                const left = step.mobile.side === "left";
                return (
                  <li
                    key={step.number}
                    data-step={i + 1}
                    data-state="reached"
                    data-side={step.mobile.side}
                    className={`${styles.position} ${styles.step} ${styles.scrim}`}
                    style={
                      {
                        ...pos(
                          step.desktop.x,
                          step.desktop.y,
                          left ? p[0] - 40 : p[0] + 40,
                          // 06 sits just above the end marker; with 12px tags
                          // (A4 drew them at ~7px) its second tag row needs room.
                          p[1] - (i === 5 ? 26 : 10),
                          30,
                          16,
                        ),
                        "--name-offset": step.desktop.nameX - step.desktop.x,
                        "--mobile-room": left ? p[0] - 58 : 390 - p[0] - 50,
                      } as Vars
                    }
                  >
                    <div className={styles.stepHeading}>
                      <span className={styles.stepNumber}>{step.number}</span>
                      <h3>{step.name}</h3>
                      <svg
                        viewBox="0 0 24 24"
                        className={styles.check}
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="11" />
                        <path d="m7 12 3 3 7-7" pathLength="1" />
                      </svg>
                    </div>
                    <Tags items={step.tags} />
                  </li>
                );
              })}
            </ol>
            <a
              href={copy.processCopy.link.href}
              data-route-status={routeStatusOf(copy.processCopy.link.href)}
              className={`${styles.position} ${styles.processLink}`}
              style={pos(1122, 7380, 24, 5570, 20, 14)}
            >
              {copy.processCopy.link.label}
              <Arrow />
            </a>
          </section>
        </div>
        <section
          className={styles.related}
          aria-labelledby="rb-related-title"
          data-related
        >
          <h2 id="rb-related-title" data-landmark="related">
            {copy.related.title}
          </h2>
          <ul>
            {copy.related.items.map((item, i) => {
              const geo = cardGeometry[i === 0 ? "C1" : "C2"];
              return (
                <li key={item.id} data-card>
                  <a
                    className={styles.card}
                    href={item.href}
                    data-route-status={routeStatusOf(item.href)}
                    aria-label={`${item.number} ${item.label}`}
                  >
                    <div className={styles.cardPhoto}>
                      <picture>
                        <source
                          type="image/avif"
                          srcSet={`${media}${item.photo}-800.avif 800w, ${media}${item.photo}-1200.avif 1200w`}
                          sizes="(min-width:1024px) 44vw, 90vw"
                        />
                        <img
                          src={`${media}${item.photo}-1200.webp`}
                          srcSet={`${media}${item.photo}-800.webp 800w, ${media}${item.photo}-1200.webp 1200w`}
                          sizes="(min-width:1024px) 44vw, 90vw"
                          width={geo.width}
                          height={geo.height}
                          loading="lazy"
                          decoding="async"
                          alt=""
                        />
                      </picture>
                      <svg
                        viewBox={`0 0 ${geo.width} ${geo.height}`}
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden="true"
                      >
                        <path d={geo.d} pathLength="1" data-card-line />
                      </svg>
                    </div>
                    <div className={styles.cardCopy}>
                      <p>{item.number}</p>
                      <h3>
                        <Tight>{item.label}</Tight>
                      </h3>
                      <p>
                        {/* Break where the adopted mocks do (after 人材、 / システム、). */}
                        <BrokenText
                          text={item.description ?? ""}
                          desktop={cardBreaks(item.description ?? "")}
                          mobile={cardBreaks(item.description ?? "")}
                        />
                      </p>
                      <Arrow />
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
        <section className={styles.audiences} aria-labelledby="rb-audience-title">
          <h2 id="rb-audience-title" className={styles.visuallyHidden}>
            {copy.audienceLinks.title}
          </h2>
          {copy.audienceLinks.items.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
              <Arrow />
            </a>
          ))}
        </section>
      </main>
      <HomeFooter />
      <Rail />
    </RevenueBrandMotion>
  );
}
