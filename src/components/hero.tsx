import Link from "next/link";
import type { CSSProperties } from "react";

import type { RoutePath } from "@/content/route-manifest";
import type { Hero, HeroTab } from "@/content/types";
import { FrameImage } from "@/components/frame-image";
import type { TemplateConfig } from "@/lib/templates";

const titleClassName: Record<Hero["titleStyle"], string> = {
  condensed: "hero__title hero__title--condensed",
  serif: "hero__title",
  "serif-italic": "hero__title hero__title--italic",
};

function HeroTabs({
  tabs,
  currentPath,
}: {
  readonly tabs: readonly HeroTab[];
  readonly currentPath: RoutePath;
}) {
  return (
    <nav className="hero-tabs" aria-label="Related pages">
      <ul className="hero-tabs__scroller">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              className="pill hero-tabs__tab"
              href={tab.href}
              aria-current={tab.href === currentPath ? "page" : undefined}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface PageHeroProps {
  readonly hero: Hero;
  readonly template: TemplateConfig;
  readonly currentPath: RoutePath;
  /** Section id the homepage scroll cue points at. */
  readonly anchorId?: string;
}

export function PageHero({ hero, template, currentPath, anchorId }: PageHeroProps) {
  const anchored = hero.align === "anchor";
  const tabbed = (hero.tabs?.length ?? 0) > 0;
  /**
   * Measured: the home and index heroes float the kicker near the optical
   * centre and drop the monumental title onto the fold; the tabbed detail
   * heroes group kicker and title above a bottom tab strip instead.
   */
  const bottomAnchored = anchored || (template.hero === "full" && !tabbed);
  const lede = hero.lede ? (
    <p
      className={`hero__lede${hero.ledeStyle === "serif" ? " hero__lede--serif" : ""}`}
    >
      {hero.lede}
    </p>
  ) : null;
  const title = (
    <h1
      className={titleClassName[hero.titleStyle]}
      id="page-title"
      data-fidelity-landmark="hero-title"
      style={{ "--title-length": hero.title.length } as CSSProperties}
    >
      {hero.title}
    </h1>
  );

  return (
    <section
      className={[
        "hero",
        anchored ? "hero--anchor" : "hero--center",
        template.hero === "short" ? "hero--short" : "hero--full",
        bottomAnchored ? "hero--bottom" : "",
        tabbed ? "hero--tabbed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-fidelity-landmark="hero"
      aria-labelledby="page-title"
      data-hero
    >
      <div className="hero__media" data-hero-media>
        <FrameImage assetId={hero.assetId} sizes="100vw" priority decorative />
      </div>
      <div className="hero__scrim" aria-hidden="true" data-hero-scrim />

      <div className="hero__body" data-hero-body>
        {hero.eyebrow ? (
          <p
            className={`eyebrow${hero.eyebrowStyle === "serif" ? " eyebrow--serif" : ""}`}
          >
            {hero.eyebrow}
          </p>
        ) : null}

        {anchored ? (
          <>
            {lede}
            {anchorId ? (
              <a className="hero__cue" href={`#section-${anchorId}`}>
                <span>Read the field notes</span>
                <span className="hero__cue-glyph" aria-hidden="true" />
              </a>
            ) : null}
            {title}
          </>
        ) : (
          <>
            {title}
            {lede}
          </>
        )}

        {hero.meta && hero.meta.length > 0 ? (
          <dl className="hero__meta numeric">
            {hero.meta.map((entry) => (
              <div key={entry.label}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {hero.tabs && hero.tabs.length > 0 ? (
        <div className="hero__foot">
          <HeroTabs tabs={hero.tabs} currentPath={currentPath} />
        </div>
      ) : null}
    </section>
  );
}
