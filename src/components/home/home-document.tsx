import Image from "next/image";
import Link from "next/link";

import { CampsFlow } from "@/components/home/camps-flow";
import { FounderSignature } from "@/components/home/founder-signature";
import { HeroStage } from "@/components/home/hero-stage";
import { HomeMotion } from "@/components/home/home-motion";
import { TravelRoute } from "@/components/home/travel-route";
import { TripFlick } from "@/components/home/trip-flick";
import { WhoWeSupport } from "@/components/home/who-we-support";
import { getAsset } from "@/content/assets";
import { homeTarget } from "@/content/home-target";

/**
 * HOME document — `home-target-v1`.
 *
 * `.page-content` exposes exactly **seven** direct children, matching the
 * measured target:
 *
 *   1 hero            2 last-continent   3 our-season
 *   4 our-trips title field              5 our-trips card list
 *   6 founder-quote   7 composite long-form wrapper
 *
 * The seventh nests our-camps, cpt-wfr-bridge, mist-divider, travel-globe and
 * planning-cta. Ten semantic stages are exposed via `data-fidelity-section`
 * with `data-fidelity-parent` on nested stages, so the comparator reads stable
 * project IDs rather than brittle target classes.
 *
 * The global footer is rendered by the layout, outside `.page-content`.
 */
export function HomeDocument() {
  const t = homeTarget;
  const ctaAsset = getAsset(t.planningCta.assetId);

  return (
    <HomeMotion>
      {/* 1 */}
      <HeroStage />

      {/* 2 */}
      <section
        className="band band--ice last-continent"
        data-fidelity-section="last-continent"
        data-fidelity-landmark="primary-content"
        data-reveal-group
      >
        <p className="last-continent__label" data-reveal>
          {t.lastContinent.label}
          <span className="home-title-ja" lang="ja">
            {t.lastContinent.titleJa}
          </span>
        </p>
        <h3 className="last-continent__quote adelva-purpose" lang="ja" data-reveal>
          {t.lastContinent.quote.match(/[^。]+。/g)?.map((sentence) => (
            <span key={sentence}>{sentence}</span>
          ))}
        </h3>
      </section>

      {/* 3 */}
      <WhoWeSupport />

      {/* 4 — title field is its own section on the target */}
      <section
        className="trips-title"
        data-fidelity-section="our-trips"
        aria-labelledby="trips-heading"
      >
        <div data-fidelity-section="title-field" data-fidelity-parent="our-trips">
          <h3 className="trips-title__heading" id="trips-heading">
            {t.ourTrips.title}
            <span className="home-title-ja" lang="ja">
              {t.ourTrips.titleJa}
            </span>
          </h3>
        </div>
      </section>

      {/* 5 */}
      <section
        className="trips-cards"
        data-fidelity-section="card-list"
        data-fidelity-parent="our-trips"
        aria-label={t.ourTrips.title}
      >
        <TripFlick />
      </section>

      {/* 6 */}
      <section
        className="founder"
        data-fidelity-section="founder-quote"
        data-reveal-group
      >
        <figure className="founder__figure">
          <span className="founder__quote-mark" aria-hidden="true">
            “
          </span>
          <blockquote
            className="founder__quote adelva-founder-copy"
            lang="ja"
            data-reveal
          >
            {t.founderQuote.text.match(/[^。]+。/g)?.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
          </blockquote>
          <span className="founder__dash" aria-hidden="true">
            -
          </span>
          <FounderSignature />
          <figcaption className="founder__attribution" data-reveal>
            <span className="founder__name">{t.founderQuote.author}</span>
            <span className="founder__role">{t.founderQuote.role}</span>
          </figcaption>
        </figure>
      </section>

      {/* 7 — composite long-form wrapper */}
      <div className="longform">
        <div className="longform__background" aria-hidden="true">
          <div className="longform__background-pin">
            <Image
              src={getAsset(t.ourCamps.finalAssetId).src}
              alt=""
              fill
              sizes="(max-aspect-ratio: 3/2) 160vh, 100vw"
              className="camps__image"
            />
          </div>
        </div>
        <CampsFlow />

        <TravelRoute />

        <section
          className="planning"
          data-fidelity-section="planning-cta"
          aria-labelledby="planning-heading"
          data-reveal-group
        >
          <div className="planning__media" aria-hidden="true">
            <Image
              src={ctaAsset.src}
              alt=""
              fill
              sizes="(max-aspect-ratio: 3/2) 160vh, 100vw"
              className="planning__image"
              style={{ objectPosition: ctaAsset.focal }}
            />
            <span className="planning__scrim" aria-hidden="true" />
          </div>
          <h3 className="planning__heading" id="planning-heading" data-reveal>
            {t.planningCta.title}
            <span className="home-title-ja" lang="ja">
              {t.planningCta.titleJa}
            </span>
          </h3>
          <Link className="planning__cta" href={t.planningCta.href} data-reveal>
            <span>{t.planningCta.label}</span>
            <span className="planning__cta-glyph" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </HomeMotion>
  );
}
