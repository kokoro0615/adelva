import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { SiteHeader } from "@/components/site-header";
import {
  chapters,
  contact,
  decision,
  execution,
  geometry,
  hero,
  phases,
  phasesCopy,
  roles,
  support,
  ui,
  verification,
} from "@/content/adelva-owner";
import { HearthPhoto } from "./hearth-photo";
import { Lines } from "./lines";
import { OwnerExperience } from "./owner-experience";
import { OwnerIndex } from "./owner-index";
import styles from "./owner.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const d = geometry.desktop;
const m = geometry.mobile;
const span = (tops: readonly number[], end: number, i: number) =>
  (tops[i + 1] ?? end) - tops[i];
const two = (n: number) => String(n).padStart(2, "0");

function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      →
    </span>
  );
}

/** A scene of the photograph: its min-height is the distance to the next scene's top. */
function Section({
  index,
  id,
  className = "",
  children,
}: {
  index: number;
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${styles.section} ${className}`}
      aria-labelledby={`${id}-title`}
      data-chapter={index}
      style={
        {
          "--hd": span(d.tops, d.height, index),
          "--hm": span(m.tops, m.height, index),
        } as Vars
      }
    >
      {children}
    </section>
  );
}

function Chapter({ index }: { index: number }) {
  const c = chapters[index - 1];
  return (
    <p className={styles.chapter} data-reveal>
      <span className={styles.chapterNo}>{c.number}</span>
      <span className={styles.chapterRule} aria-hidden="true" />
      <span className={styles.chapterName}>{c.label}</span>
    </p>
  );
}

function H2({ index, text }: { index: number; text: string }) {
  return (
    <h2 id={`${chapters[index - 1].id}-title`} className={styles.h2} data-reveal>
      <Lines text={text} />
    </h2>
  );
}

function Hero() {
  return (
    <Section index={0} id="owner-hero" className={styles.hero}>
      <div className={styles.col}>
        <nav aria-label={ui.crumbsLabel}>
          <ol className={styles.crumb}>
            {hero.crumbs.map((crumb, i) => (
              <li key={crumb.href}>
                {i > 0 && <span aria-hidden="true">/</span>}
                <Link prefetch={false} href={crumb.href}>
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <p className={styles.eyebrow} data-hero-after>
          {hero.eyebrow}
        </p>
        <h1 id="owner-hero-title" className={styles.title}>
          {hero.title.map((line) => (
            <span key={line} className={styles.titleLine} data-hero-line>
              {line}
            </span>
          ))}
        </h1>
        <p className={styles.lead} data-hero-after>
          <Lines text={hero.lead} />
        </p>
        <Link
          prefetch={false}
          href={hero.action.href}
          className={styles.action}
          data-hero-after
        >
          {hero.action.label}
          <Arrow />
        </Link>
        <a href={`#${chapters[0].id}`} className={styles.scroll} data-hero-after>
          <span>{hero.scroll.label}</span>
          <span className={styles.visuallyHidden}>：{hero.scroll.name}</span>
          <i aria-hidden="true" />
        </a>
      </div>
    </Section>
  );
}

function Phases() {
  return (
    <Section index={1} id={chapters[0].id}>
      <div className={`${styles.col} ${styles.intro} ${styles.intro01}`}>
        <Chapter index={1} />
        <H2 index={1} text={phasesCopy.title} />
      </div>
      <div
        className={styles.bays}
        role="radiogroup"
        aria-labelledby={`${chapters[0].id}-title`}
        data-bays
      >
        {phases.map((phase, i) => (
          <label
            key={phase.id}
            className={styles.bay}
            data-phase={phase.id}
            style={{ "--i": i } as Vars}
          >
            <input
              className={styles.bayInput}
              type="radio"
              name="phase"
              value={phase.id}
              aria-labelledby={`owner-phase-${phase.id}`}
              aria-describedby={`owner-phase-${phase.id}-text`}
            />
            <span className={styles.bayNo} aria-hidden="true">
              {two(i + 1)}
            </span>
            <span className={styles.bayBody}>
              <span id={`owner-phase-${phase.id}`} className={styles.bayName}>
                {phase.title}
              </span>
              <span id={`owner-phase-${phase.id}-text`} className={styles.bayText}>
                <Lines text={phase.text} />
              </span>
            </span>
            <span className={styles.bayGo} aria-hidden="true">
              →
            </span>
          </label>
        ))}
      </div>
    </Section>
  );
}

function Decision() {
  return (
    <Section index={2} id={chapters[1].id}>
      <div className={`${styles.col} ${styles.intro} ${styles.intro02}`}>
        <Chapter index={2} />
        <H2 index={2} text={decision.title} />
        <p className={styles.body} data-reveal>
          <Lines text={decision.body} />
        </p>
      </div>
      <div className={styles.scale} data-scale>
        <i className={styles.grad} aria-hidden="true" />
        <ol className={styles.points} aria-label={decision.listLabel}>
          {decision.points.map((point, i) => (
            <li
              key={point}
              className={styles.point}
              data-point={i}
              style={
                {
                  "--yd": d.points[i],
                  "--ym": m.points[i],
                  "--len": point.length,
                } as Vars
              }
            >
              <span className={styles.pointNo}>{two(i + 1)}</span>
              <span className={styles.pointName}>{point}</span>
            </li>
          ))}
        </ol>
        <i className={styles.ghost} aria-hidden="true" />
        <i className={styles.setbar} aria-hidden="true" data-setbar>
          <i className={styles.trail} data-trail />
        </i>
      </div>
    </Section>
  );
}

function Support() {
  return (
    <Section index={3} id={chapters[2].id}>
      <div className={styles.col}>
        <Chapter index={3} />
        <H2 index={3} text={support.title} />
        <table className={styles.table} aria-labelledby={`${chapters[2].id}-title`}>
          <thead>
            <tr>
              {support.heads.map((head) => (
                <th key={head} scope="col">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map((phase, i) => (
              <tr key={phase.id} className={styles.row} data-phase={phase.id}>
                <th scope="row" className={styles.rowHead}>
                  {phase.title}
                </th>
                <td>{support.rows[i][0]}</td>
                <td>{support.rows[i][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className={styles.cards} aria-label={support.cardsLabel}>
          {phases.map((phase, i) => (
            <li key={phase.id} className={styles.card} data-phase={phase.id}>
              <h3 className={styles.cardTitle}>{phase.title}</h3>
              <dl className={styles.cardList}>
                <dt>{support.heads[1]}</dt>
                <dd>{support.rows[i][0]}</dd>
                <dt>{support.heads[2]}</dt>
                <dd>{support.rows[i][1]}</dd>
              </dl>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          <Lines text={support.note} />
        </p>
      </div>
    </Section>
  );
}

/** The four sides of the hearth frame (viewBox 300). */
const sides = {
  top: "M0 0.5H300",
  right: "M299.5 0V300",
  bottom: "M0 299.5H300",
  left: "M0.5 0V300",
} as const;

function Roles() {
  return (
    <Section index={4} id={chapters[3].id}>
      <div className={`${styles.col} ${styles.intro} ${styles.intro04}`}>
        <Chapter index={4} />
        <H2 index={4} text={roles.title} />
        <div className={styles.hearth} data-hearth>
          <svg
            className={styles.frame}
            viewBox="0 0 300 300"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <rect
              className={styles.frameOuter}
              x="0.5"
              y="0.5"
              width="299"
              height="299"
            />
            <rect
              className={styles.frameInner}
              x="23"
              y="23"
              width="254"
              height="254"
            />
            {roles.items.map((role) => (
              <path
                key={role.side}
                className={styles.side}
                d={sides[role.side]}
                data-side={role.side}
              />
            ))}
          </svg>
          <i className={styles.ember} aria-hidden="true" data-ember />
          <ul className={styles.roles} aria-label={roles.listLabel}>
            {roles.items.map((role) => (
              <li
                key={role.id}
                className={styles.role}
                data-side={role.side}
                data-role={role.id}
                lang={role.id === "adelva" ? "en" : undefined}
              >
                {role.id === "gm" ? (
                  <>
                    <span className={styles.tcy}>GM</span>・現場
                  </>
                ) : (
                  role.name
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`${styles.col} ${styles.agreeBlock}`}>
        <p className={styles.agree} data-reveal>
          <Lines text={roles.agreement} />
        </p>
        <p className={`${styles.note} ${styles.agreeNote}`}>
          <Lines text={roles.note} />
        </p>
        <Link prefetch={false} href={roles.cross.href} className={styles.cross}>
          {roles.cross.label}
          <Arrow />
        </Link>
      </div>
    </Section>
  );
}

function Execution() {
  return (
    <Section index={5} id={chapters[4].id}>
      <div className={`${styles.col} ${styles.intro} ${styles.intro05}`}>
        <Chapter index={5} />
        <H2 index={5} text={execution.title} />
      </div>
      <div className={styles.emberRow} data-embers>
        <ol className={styles.steps} aria-label={execution.stepsLabel}>
          {execution.steps.map((step, i) => (
            <li
              key={step}
              className={styles.step}
              data-step={i}
              data-handover={i === execution.steps.length - 1 ? "" : undefined}
            >
              <span className={styles.stepNo}>{two(i + 1)}</span>
              <i className={styles.stepRing} aria-hidden="true" data-ring>
                <i className={styles.stepBurst} />
              </i>
              <span className={styles.stepName}>{step}</span>
            </li>
          ))}
        </ol>
        <i className={styles.spark} aria-hidden="true" data-spark />
      </div>
    </Section>
  );
}

function Verification() {
  return (
    <Section index={6} id={chapters[5].id}>
      <div className={styles.col}>
        <Chapter index={6} />
        <H2 index={6} text={verification.title} />
        <p className={styles.body} data-reveal>
          <Lines text={verification.body} />
        </p>
        <ul className={styles.checks}>
          {verification.items.map((item) => (
            <li key={item} className={styles.check} data-check>
              <svg
                className={styles.tick}
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M3 10.5l4.2 4.2L17 5" pathLength={1} />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section index={7} id="owner-contact" className={styles.contact}>
      <div className={styles.col}>
        <h2
          id="owner-contact-title"
          className={`${styles.h2} ${styles.contactTitle}`}
          data-reveal
        >
          <Lines text={contact.title} />
        </h2>
        <Link
          prefetch={false}
          href={contact.action.href}
          className={`${styles.action} ${styles.contactAction}`}
        >
          {contact.action.label}
          <Arrow />
        </Link>
      </div>
    </Section>
  );
}

/** /challenges/owner — the hearth of an old inn at first light (spec B2「囲炉裏」). */
export function OwnerPage() {
  return (
    <OwnerExperience>
      <a className={styles.skip} href="#main-content">
        {ui.skip}
      </a>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <div className={styles.stage} data-stage>
          <HearthPhoto />
          <Hero />
          <Phases />
          <Decision />
          <Support />
          <Roles />
          <Execution />
          <Verification />
          <Contact />
        </div>
        <OwnerIndex />
      </main>
      <HomeFooter />
    </OwnerExperience>
  );
}
