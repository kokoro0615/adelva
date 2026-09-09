import Link from "next/link";

import { FrameImage } from "@/components/frame-image";
import { EnquiryForm } from "@/components/enquiry-form";
import { RatesPlanner } from "@/components/rates-planner";
import type { CallToAction, CardRef, DocumentBlock, Section } from "@/content/types";

/**
 * Reveal stagger by relationship, not by a single magic number: peers in a row
 * follow each other closely, an editorial sequence breathes between steps.
 */
const REVEAL_STAGGER: Record<Section["kind"], number> = {
  statement: 0.08,
  story: 0.09,
  facts: 0.05,
  sequence: 0.09,
  banner: 0,
  rail: 0.075,
  ownerContent: 0.06,
  document: 0.06,
  rates: 0.06,
  enquiry: 0.06,
};

const CARD_SIZES = "(min-width: 64rem) 22vw, (min-width: 48rem) 44vw, 88vw";
const STORY_SIZES = "(min-width: 64rem) 56vw, 100vw";
const BANNER_SIZES = "100vw";

function bandClass(section: Section, extra?: string): string {
  const tone = "tone" in section ? section.tone : "deep";
  return ["band", `band--${tone}`, extra].filter(Boolean).join(" ");
}

function Paragraphs({ body }: { readonly body: readonly string[] }) {
  return (
    <>
      {body.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </>
  );
}

function BandHead({
  headingId,
  heading,
  intro,
}: {
  readonly headingId: string;
  readonly heading: string;
  readonly intro?: string;
}) {
  return (
    <div className="band__head" data-reveal>
      <h2 className="band__title" id={headingId}>
        {heading}
      </h2>
      {intro ? <p className="lede">{intro}</p> : null}
    </div>
  );
}

function Card({ card }: { readonly card: CardRef }) {
  return (
    <li className="card" data-reveal>
      <div className="card__frame" data-reveal-media>
        <FrameImage assetId={card.assetId} sizes={CARD_SIZES} />
      </div>
      <p className="card__kicker">{card.kicker}</p>
      <h3 className="card__title">
        <Link href={card.href}>{card.title}</Link>
      </h3>
      <p className="card__body">{card.body}</p>
    </li>
  );
}

function DocumentBlocks({ blocks }: { readonly blocks: readonly DocumentBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        if (block.kind === "heading") {
          return <h3 key={block.text}>{block.text}</h3>;
        }
        if (block.kind === "list") {
          return (
            <ul key={block.items.join("|").slice(0, 48)}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={block.text.slice(0, 48)}>{block.text}</p>;
      })}
    </>
  );
}

interface SectionViewProps {
  readonly section: Section;
  /** Marks the first content band, which is the release-harness landmark. */
  readonly primary: boolean;
  /** The measured rates/enquiry/legal content panel, inset from the viewport. */
  readonly panelled: boolean;
  /** The first panel band, which lifts over the shallow hero on rounded corners. */
  readonly lifted: boolean;
}

export function SectionView({ section, primary, panelled, lifted }: SectionViewProps) {
  const sectionId = `section-${section.id}`;
  const headingId = `heading-${section.id}`;
  const landmark = primary ? "primary-content" : undefined;
  const extra =
    [panelled ? "band--panel" : "", lifted ? "band--lifted" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  switch (section.kind) {
    case "statement":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <div className="statement" data-reveal>
              <h2 className="statement__heading" id={headingId}>
                {section.heading}
              </h2>
              <div className="statement__body prose">
                <Paragraphs body={section.body} />
              </div>
            </div>
          </div>
        </section>
      );

    case "story":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="spread">
            <div className={`story${section.flip ? " story--flip" : ""}`}>
              <figure className="story__figure" data-reveal>
                <div className="story__media" data-reveal-media>
                  <FrameImage assetId={section.assetId} sizes={STORY_SIZES} />
                </div>
                <figcaption className="story__caption">{section.caption}</figcaption>
              </figure>
              <div className="story__copy prose" data-reveal>
                <h2 className="story__heading" id={headingId}>
                  {section.heading}
                </h2>
                <Paragraphs body={section.body} />
              </div>
            </div>
          </div>
        </section>
      );

    case "facts":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <BandHead
              headingId={headingId}
              heading={section.heading}
              intro={section.intro}
            />
            <dl className="facts">
              {section.items.map((item) => (
                <div className="facts__item" key={item.label} data-reveal>
                  <dt className="facts__label">{item.label}</dt>
                  <dd className="facts__value">{item.value}</dd>
                  <dd className="facts__note">{item.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );

    case "sequence":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <BandHead
              headingId={headingId}
              heading={section.heading}
              intro={section.intro}
            />
            <ol className="sequence">
              {section.steps.map((step) => (
                <li className="sequence__item" key={step.label} data-reveal>
                  <p className="sequence__label">{step.label}</p>
                  <h3 className="sequence__heading">{step.heading}</h3>
                  <p className="sequence__body">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );

    case "banner":
      return (
        <figure id={sectionId} className="banner" data-fidelity-landmark={landmark}>
          <div className="banner__frame">
            <div className="banner__parallax" data-parallax>
              <FrameImage assetId={section.assetId} sizes={BANNER_SIZES} />
            </div>
          </div>
          <figcaption className="banner__caption">{section.caption}</figcaption>
        </figure>
      );

    case "rail":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <BandHead
              headingId={headingId}
              heading={section.heading}
              intro={section.intro}
            />
            <ul className="rail">
              {section.cards.map((card) => (
                <Card card={card} key={card.href} />
              ))}
            </ul>
          </div>
        </section>
      );

    case "ownerContent":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <div className="owner-panel" data-reveal>
              <h2 className="band__title band__title--italic" id={headingId}>
                {section.heading}
              </h2>
              <p className="owner-panel__note">
                <span className="owner-panel__tag">Owner supplied</span>
                <span>{section.description}</span>
              </p>
              <dl className="owner-panel__rows">
                {section.rows.map((row) => (
                  <div className="owner-panel__row" key={row.label}>
                    <dt className="owner-panel__label">{row.label}</dt>
                    <dd className="owner-panel__hint">{row.hint}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      );

    case "document":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <article className="document" data-reveal>
              <h2 id={headingId}>{section.heading}</h2>
              <DocumentBlocks blocks={section.blocks} />
            </article>
          </div>
        </section>
      );

    case "rates":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <RatesPlanner headingId={headingId} />
          </div>
        </section>
      );

    case "enquiry":
      return (
        <section
          id={sectionId}
          className={bandClass(section, extra)}
          aria-labelledby={headingId}
          data-fidelity-landmark={landmark}
          data-reveal-group
          data-reveal-stagger={REVEAL_STAGGER[section.kind]}
        >
          <div className="shell">
            <EnquiryForm headingId={headingId} />
          </div>
        </section>
      );
  }
}

export function CallToActionBand({
  cta,
  panelled,
}: {
  readonly cta: CallToAction;
  readonly panelled: boolean;
}) {
  return (
    <section
      id="section-cta"
      className={`band band--${cta.tone}${panelled ? " band--panel" : ""}`}
      aria-labelledby="heading-cta"
      data-fidelity-landmark="cta"
      data-reveal-group
    >
      <div className="shell">
        <div className="cta" data-reveal>
          <h2 className="cta__heading" id="heading-cta">
            {cta.heading}
          </h2>
          <p className="cta__body">{cta.body}</p>
          <Link
            className="button"
            href={cta.href}
            data-fidelity-landmark="primary-action"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
