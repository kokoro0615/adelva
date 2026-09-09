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
        <div className="last-continent__rules" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <p className="last-continent__label" data-reveal>
          {t.lastContinent.label}
          <span className="home-title-ja" lang="ja">
            {t.lastContinent.titleJa}
          </span>
          <svg
            className="last-continent__scribble"
            viewBox="0 0 191 62"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M118.724 58.7528C118.294 58.6791 117.864 58.6055 100.366 49.0644C82.8682 39.5233 48.315 20.517 30.4718 10.0644C12.6285 -0.388222 12.5421 -1.71124 36.0859 2.44741C59.6297 6.60606 106.806 16.2865 133.762 22.9765C160.717 29.6666 166.022 33.0729 169.147 35.3181C172.273 37.5633 173.058 38.5442 173.1 39.5016C173.35 45.3222 163.85 46.2865 149.288 49.0828C138.092 51.2326 118.988 52.1583 97.2931 48.3677C75.5984 44.5772 51.8457 35.3501 39.7294 29.4302C27.613 23.5104 27.8526 21.1774 28.4154 19.295C28.9781 17.4126 29.8566 16.0515 31.4371 14.7652C33.0175 13.4788 35.2731 12.3084 43.4827 11.3262C51.6922 10.344 65.7874 9.58545 82.6551 10.7279C99.5227 11.8703 118.736 14.9367 135.943 19.125C153.149 23.3133 167.767 28.5306 176.506 31.9721C185.244 35.4136 187.659 36.9213 189.084 38.436C190.509 39.9507 190.87 41.4267 188.779 43.548C186.688 45.6693 182.134 48.391 173.577 51.3311C165.02 54.2713 152.599 57.3473 123.174 59.0529C93.7497 60.7585 47.6976 61.0006 0.25 61.25"
              stroke="#BABABA"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
          </svg>
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
