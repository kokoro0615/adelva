import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { HomeFooter } from "@/components/home/home-footer";
import { SiteHeader } from "@/components/site-header";
import {
  chapters,
  challengesCopy,
  contact,
  decision,
  execution,
  geometry,
  hero,
  issues,
  roles,
  support,
  ui,
  verification,
  type IssueId,
} from "@/content/adelva-general-managers";
import { GmExperience } from "./gm-experience";
import { GmGauge } from "./gm-gauge";
import { GmTray } from "./gm-tray";
import { Lines } from "./lines";
import { DecisionMarks, GateMarks } from "./terrace-marks";
import { TerracesPhoto } from "./terraces-photo";
import styles from "./general-managers.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const d = geometry.desktop;
const m = geometry.mobile;
const span = (tops: readonly number[], end: number, i: number) =>
  (tops[i + 1] ?? end) - tops[i];

function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      →
    </span>
  );
}

function Section({
  index,
  className = "",
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const chapter = index > 0 ? chapters[index - 1] : null;
  return (
    <section
      id={chapter?.id ?? "gm-hero"}
      className={`${styles.section} ${className}`}
      aria-labelledby={chapter ? `${chapter.id}-title` : "gm-title"}
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
      <span className={styles.chapterSlash} aria-hidden="true">
        /
      </span>
      {c.label}
    </p>
  );
}

function H2({
  index,
  text,
  className = "",
  pool,
}: {
  index: number;
  text: string;
  className?: string;
  pool?: boolean;
}) {
  return (
    <h2
      id={`${chapters[index - 1].id}-title`}
      className={`${styles.h2} ${className} ${pool ? styles.pooled : ""}`}
      data-pool={pool ? "m" : undefined}
      data-reveal
    >
      <Lines text={text} />
    </h2>
  );
}

/** Chips for the selected issues; CSS shows only the checked ones. */
function Chips({ only }: { only?: readonly IssueId[] }) {
  return issues
    .filter((issue) => !only || only.includes(issue.id))
    .map((issue) => (
      <span key={issue.id} className={styles.chip} data-issue={issue.id}>
        {issue.title}
      </span>
    ));
}

function Hero() {
  return (
    <Section index={0} className={styles.hero}>
      <div className={styles.col}>
        <nav aria-label={ui.crumbsLabel}>
          <ol className={styles.crumb}>
            {hero.crumbs.map((crumb, i) => (
              <li key={crumb.href} style={{ display: "contents" }}>
                {i > 0 && <span aria-hidden="true">/</span>}
                <Link prefetch={false} href={crumb.href}>
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowFor}>{hero.eyebrow}</span>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          <span className={styles.eyebrowEn} lang="en">
            {hero.eyebrowEn}
          </span>
        </p>
        <h1 id="gm-title" className={styles.title}>
          {hero.title.map((line) => (
            <span key={line} data-hero-line>
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
      </div>
    </Section>
  );
}

function Challenges() {
  return (
    <Section index={1}>
      <div className={styles.col}>
        <Chapter index={1} />
        <H2 index={1} text={challengesCopy.title} />
        <p className={`${styles.body} ${styles.pooled}`} data-pool="m">
          <Lines text={challengesCopy.body} />
        </p>
        <p className={`${styles.helper} ${styles.desktop}`}>{challengesCopy.helper}</p>
      </div>
      <fieldset className={styles.issues} data-issues>
        <legend className={styles.visuallyHidden}>{challengesCopy.legend}</legend>
        {issues.map((issue, i) => (
          <label
            key={issue.id}
            className={`${styles.issue} ${styles.pooled}`}
            data-issue={issue.id}
            style={
              {
                "--rx": d.rings[i][0],
                "--ry": d.rings[i][1],
                "--rowY": m.rows[i],
              } as Vars
            }
          >
            <input
              className={styles.issueInput}
              type="checkbox"
              name="issue"
              value={issue.id}
            />
            <span className={styles.ring} aria-hidden="true">
              <i className={styles.ripple} />
              <i className={styles.ripple} />
            </span>
            <span className={`${styles.issueTitle} ${styles.serif}`}>
              {issue.title}
            </span>
            <span className={styles.issueText}>{issue.description}</span>
          </label>
        ))}
      </fieldset>
    </Section>
  );
}

function Decision() {
  return (
    <Section index={2}>
      <div className={styles.col}>
        <div className={styles.decisionIntro}>
          <Chapter index={2} />
          <H2 index={2} text={decision.title} />
          <p className={styles.body}>
            <Lines text={decision.body} />
          </p>
        </div>
        <div
          className={styles.points}
          role="radiogroup"
          aria-label={decision.groupLabel}
        >
          {decision.points.map((point, i) => (
            <label key={point.id} className={styles.point}>
              <input
                className={styles.pointInput}
                type="radio"
                name="point"
                value={point.id}
                defaultChecked={i === 0}
              />
              <span className={styles.radio} aria-hidden="true" />
              <span className={styles.pointTitle}>
                <Lines text={point.title} />
              </span>
              <span className={styles.pointText}>
                <Lines text={point.text} />
              </span>
            </label>
          ))}
        </div>
      </div>
      <DecisionMarks />
    </Section>
  );
}

const glyphs = {
  one: (
    <svg viewBox="0 0 56 20">
      <circle cx="10" cy="10" r="7" />
    </svg>
  ),
  three: (
    <svg viewBox="0 0 56 20">
      <circle cx="8" cy="10" r="6" />
      <circle cx="28" cy="10" r="6" />
      <circle cx="48" cy="10" r="6" />
      <path d="M14 10h8M34 10h8" />
    </svg>
  ),
  rise: (
    <svg viewBox="0 -4 56 34">
      <circle cx="8" cy="22" r="6" />
      <circle cx="28" cy="22" r="6" />
      <circle cx="48" cy="22" r="6" />
      <path d="M14 22h8M34 22h8M28 16V9.5" />
      <circle cx="28" cy="5" r="4.5" />
    </svg>
  ),
};

function Support() {
  return (
    <Section index={3}>
      <div className={`${styles.col} ${styles.supportHead}`}>
        <Chapter index={3} />
        <H2 index={3} text={support.title} />
        <p className={`${styles.body} ${styles.supportLead} ${styles.pooled}`}>
          <Lines text={support.body} />
        </p>
        <div
          className={styles.table}
          role="table"
          aria-label={`${support.heads[0]}と${support.heads[1]}`}
        >
          <div role="rowgroup">
            <div role="row" className={styles.thead}>
              {support.heads.map((head) => (
                <span key={head} role="columnheader">
                  {head}
                </span>
              ))}
            </div>
          </div>
          <div role="rowgroup">
            {support.rows.map((row, i) => {
              const related = issues
                .filter((issue) => issue.support === i)
                .map((issue) => issue.id);
              return (
                <div
                  key={row.judge}
                  role="row"
                  id={`gm-support-${i + 1}`}
                  tabIndex={-1}
                  className={styles.row}
                  data-issues={related.join(" ") || undefined}
                >
                  <span className={styles.glyph} aria-hidden="true">
                    {glyphs[row.glyph]}
                  </span>
                  <span role="cell" className={`${styles.judge} ${styles.serif}`}>
                    <span className={styles.judgeLine}>
                      <span className={styles.glyphInline} aria-hidden="true">
                        {glyphs[row.glyph]}
                      </span>
                      {row.judge}
                    </span>
                    {related.length > 0 && (
                      <span className={styles.why}>
                        <Chips only={related} />
                        <span className={styles.whySuffix}>
                          {support.relatedSuffix}
                        </span>
                      </span>
                    )}
                  </span>
                  <span role="cell" className={`${styles.cell} ${styles.pooled}`}>
                    <span className={styles.cellLabel}>{support.heads[1]}</span>
                    <Lines text={row.combo} />
                  </span>
                  <span role="cell" className={`${styles.cell} ${styles.pooled}`}>
                    <span className={styles.cellLabel}>{support.heads[2]}</span>
                    <Lines text={row.keep} />
                  </span>
                  <span className={styles.lightRun} aria-hidden="true" />
                </div>
              );
            })}
          </div>
        </div>
        <p className={`${styles.note} ${styles.pooled}`}>
          <Lines text={support.note} />
        </p>
      </div>
    </Section>
  );
}

function Roles() {
  return (
    <Section index={4}>
      <div className={styles.col}>
        <Chapter index={4} />
        <H2 index={4} text={roles.title} />
        <p className={styles.body}>
          <Lines text={roles.body} />
        </p>
        <dl className={styles.roles} aria-label={roles.listLabel}>
          {roles.items.map((role, i) => (
            <div
              key={role.id}
              className={`${styles.role} ${styles.pooled}`}
              data-role={role.id}
              style={
                { "--rx": d.roles[i][0], "--ry": d.roles[i][1], "--step": i } as Vars
              }
            >
              <dt
                className={`${styles.roleName} ${styles.serif}`}
                lang={role.id === "adelva" ? "en" : undefined}
              >
                {role.name}
              </dt>
              <dd className={styles.roleText}>
                <Lines text={role.text} />
              </dd>
            </div>
          ))}
        </dl>
        <p className={`${styles.agree} ${styles.pooled}`}>
          <Lines text={roles.agreement} />
        </p>
        <p className={styles.crossNote}>{roles.crossNote}</p>
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
    <Section index={5}>
      <div className={styles.col}>
        <div className={styles.execIntro}>
          <Chapter index={5} />
          <H2 index={5} text={execution.title} className={styles.execTitle} />
          <p className={styles.body}>
            <Lines text={execution.body} />
          </p>
        </div>
        <ol className={styles.gates} aria-label={execution.stepsLabel} data-gates>
          {execution.steps.map((step, i) => (
            <li
              key={step}
              className={`${styles.gate} ${styles.pooled}`}
              data-gate={i}
              data-side={i === execution.steps.length - 1 ? "left" : undefined}
              style={
                {
                  "--gxd": d.gates[i][0],
                  "--gyd": d.gates[i][1],
                  "--gxm": m.gates[i][0],
                  "--gym": m.gates[i][1],
                } as Vars
              }
            >
              <span className={styles.gateNo}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.gateName}>{step}</span>
            </li>
          ))}
        </ol>
        <Link
          prefetch={false}
          href={execution.approach.href}
          className={styles.outline}
        >
          {execution.approach.label}
          <Arrow />
        </Link>
      </div>
      <GateMarks />
    </Section>
  );
}

function Verification() {
  return (
    <Section index={6}>
      <div className={styles.col}>
        <Chapter index={6} />
        <H2 index={6} text={verification.title} />
        <dl className={styles.checks}>
          {verification.items.map((item) => (
            <div
              key={item.title}
              className={`${styles.check} ${styles.pooled}`}
              data-check
            >
              <dt className={`${styles.checkTitle} ${styles.serif}`}>
                <svg
                  className={styles.tick}
                  viewBox="0 0 22 22"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="11" cy="11" r="10.25" pathLength={1} />
                  <path d="M7 11.4l2.9 2.9 5.3-5.8" pathLength={1} />
                </svg>
                {item.title}
              </dt>
              <dd className={styles.checkText}>
                <Lines text={item.text} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section index={7}>
      <div className={styles.col}>
        <Chapter index={7} />
        <H2 index={7} text={contact.title} className={styles.contactTitle} pool />
        <p className={styles.carry}>
          <span className={styles.carryLabel}>{contact.carryLabel}</span>
          <Chips />
        </p>
        <div className={styles.contactRow}>
          <Link
            prefetch={false}
            href={contact.action.href}
            className={`${styles.action} ${styles.contactAction}`}
          >
            {contact.action.label}
            <Arrow />
          </Link>
          <div className={`${styles.flow} ${styles.pooled}`}>
            <p className={styles.flowLabel}>{contact.flowLabel}</p>
            <ol className={styles.flowList} data-flow>
              {contact.flow.map((step) => (
                <li key={step} className={styles.flowStep}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** /challenges/general-managers — the terraced slope at first light (spec A2). */
export function GeneralManagersPage() {
  return (
    <GmExperience>
      <a className={styles.skip} href="#main-content">
        {ui.skip}
      </a>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <div className={styles.stage} data-stage>
          <TerracesPhoto />
          <Hero />
          <Challenges />
          <Decision />
          <Support />
          <Roles />
          <Execution />
          <Verification />
          <Contact />
        </div>
        <GmGauge />
        <GmTray />
      </main>
      <HomeFooter />
    </GmExperience>
  );
}
