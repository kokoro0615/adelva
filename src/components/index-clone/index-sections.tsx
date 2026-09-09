import Image from "next/image";
import Link from "next/link";

import {
  type IndexCamp,
  type IndexImage,
  type IndexItinerary,
  type IndexPageContent,
  indexCamps,
  indexItineraries,
} from "@/content/index-target";

import styles from "./index-clone.module.css";

function CoverImage({
  image,
  className,
  priority = false,
}: {
  readonly image: IndexImage;
  readonly className?: string;
  readonly priority?: boolean;
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes="(max-width: 47.99rem) 100vw, 100vw"
      className={className}
      style={{ objectPosition: image.focal }}
      priority={priority}
    />
  );
}

export function IndexIntro({ page }: { readonly page: IndexPageContent }) {
  return (
    <section
      className={`${styles.intro} ${page.route === "camps" ? styles.campIntro : styles.itineraryIntro} padding-large bg-white`}
      data-index-stage="intro"
      data-fidelity-section="intro"
    >
      <div className={styles.introInner}>
        <p className={`${styles.sectionLabel} eyebrow`}>{page.intro.label}</p>
        <div className={styles.introCopy}>
          {page.intro.paragraphs.map((paragraph, index) => (
            <p key={`${page.route}-intro-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ItineraryItem({
  item,
  index,
}: {
  readonly item: IndexItinerary;
  readonly index: number;
}) {
  return (
    <article
      className={`${styles.itineraryItem} itinerary-item`}
      data-index-itinerary={item.id}
      data-index-order={index + 1}
    >
      <div className={styles.itemLabel}>
        <span>{item.sideLabel ?? ""}</span>
      </div>
      <Link
        href={item.href}
        className={`${styles.itineraryLink} itinerary-item_link`}
        data-index-link={item.href}
      >
        <span className={`${styles.cardInner} itinerary-item_inner`}>
          <span className={`${styles.cardMedia} itinerary-item_image`}>
            <CoverImage image={item.image} className={styles.cardImage} />
            <span className={styles.cardOverlay} aria-hidden="true" />
          </span>
          <span className={`${styles.cardContent} itinerary-item_content`}>
            <span className={`${styles.cardContentInner} itinerary-item_content-inner`}>
              <span className={`${styles.cardHeader} itinerary-item_header`}>
                <h3 className={`${styles.cardTitle} itinerary-item_title`}>
                  {item.title}
                </h3>
              </span>
              <span className={`${styles.cardFooter} itinerary-item_footer`}>
                <span className={`${styles.cardTopline} itinerary-item_meta`}>
                  <span>{item.price}</span>
                  {item.season || item.metaLabel ? (
                    <>
                      <span className={styles.metaDivider} aria-hidden="true" />
                      <span>{item.metaLabel ?? item.season}</span>
                    </>
                  ) : null}
                </span>
                <span className={`${styles.cardExcerpt} itinerary-item_excerpt`}>
                  {item.excerpt}
                </span>
              </span>
            </span>
          </span>
        </span>
      </Link>
    </article>
  );
}

export function ItineraryList() {
  return (
    <section
      className={`${styles.itineraryList} padding-large bg-transparent itineraries-section`}
      data-index-stage="itineraries"
      data-fidelity-section="itineraries"
      aria-labelledby="itineraries-heading"
    >
      <h2 id="itineraries-heading" className={styles.visuallyHidden}>
        Our trips
      </h2>
      <div className={styles.itineraryItems}>
        {indexItineraries.map((item, index) => (
          <ItineraryItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function CampCard({
  camp,
  index,
}: {
  readonly camp: IndexCamp;
  readonly index: number;
}) {
  return (
    <Link
      href={camp.href}
      className={`${styles.campCard} camp-card`}
      data-index-camp={camp.id}
      data-index-order={index + 1}
      data-index-link={camp.href}
    >
      <span className={`${styles.campInner} camp-card_inner`}>
        <span className={styles.campMedia}>
          <CoverImage image={camp.image} className={styles.campImage} />
          <span className={styles.campOverlay} aria-hidden="true" />
        </span>
        <span className={`${styles.campContent} camp-card_content`}>
          <span className={`${styles.campCoordinates} camp-coordinates`}>
            [ {camp.coordinates} ]
          </span>
          <h3 className="card-title">{camp.title}</h3>
          <span className={`${styles.campBody} card-excerpt_wrap`}>{camp.body}</span>
        </span>
      </span>
    </Link>
  );
}

export function CampList() {
  return (
    <section
      className={`${styles.campList} padding-large bg-transparent padding-none bg-white our-camps`}
      data-index-stage="camps"
      data-fidelity-section="camps"
      aria-labelledby="camps-heading"
    >
      <h2 id="camps-heading" className={styles.visuallyHidden}>
        Our camps
      </h2>
      <div className={styles.campItems}>
        {indexCamps.map((camp, index) => (
          <CampCard key={camp.id} camp={camp} index={index} />
        ))}
      </div>
    </section>
  );
}

export function TripsTitle() {
  return (
    <section
      className={`${styles.tripsTitle} padding-top-large-bottom-medium bg-white`}
      data-index-stage="trips-title"
      data-fidelity-section="trips-title"
    >
      <h3>Our Trips</h3>
    </section>
  );
}

export function IndexCta({ page }: { readonly page: IndexPageContent }) {
  return (
    <section
      className={`${styles.cta} basic-banner`}
      data-index-stage="cta"
      data-fidelity-section="cta"
      aria-labelledby="planning-heading"
    >
      <CoverImage image={page.cta.image} className={styles.ctaImage} />
      <span className={styles.ctaOverlay} aria-hidden="true" />
      <span className={styles.ctaContent}>
        <h3 id="planning-heading">{page.cta.title}</h3>
        <Link href={page.cta.href} className={styles.ctaLink} data-index-cta-link>
          Get in touch <span className={styles.ctaIcon} aria-hidden="true" />
        </Link>
      </span>
    </section>
  );
}
