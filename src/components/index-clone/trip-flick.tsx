"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { indexTrips } from "@/content/index-target";

import styles from "./index-clone.module.css";

/**
 * Camps' five-card `card-flick` field. The target uses a 50/12.5 split on
 * wider screens and a full-width, vertically stacked reading order on phones.
 * Focus and pointer entry both select a card so the collapsed desktop state
 * never hides a keyboard user's only copy of an itinerary.
 */
export function TripFlick() {
  const [active, setActive] = useState(0);

  return (
    <div
      className={`${styles.tripWrap} cardflick-wrap`}
      data-index-stage="trips-cards"
      data-fidelity-section="trips-cards"
    >
      <section
        className={`${styles.tripSection} padding-top-none-bottom-large bg-transparent`}
      >
        <div className={styles.tripContainer}>
          <div className={`${styles.tripFlick} card-flick`} data-index-card-flick>
            <div className={`${styles.tripGrid} card-flick_grid`}>
              {indexTrips.map((trip, index) => {
                const selected = active === index;
                return (
                  <Link
                    key={trip.id}
                    className={`${styles.tripCard} card-flick_item${selected ? ` ${styles.tripCardActive} is-active` : ""}`}
                    data-index-trip={trip.id}
                    data-index-order={index + 1}
                    data-active={selected ? "true" : "false"}
                    data-index-link={trip.href}
                    href={trip.href}
                    onPointerEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                  >
                    <span
                      className={`${styles.tripLink} card-flick_item-inner card-flick_link`}
                      data-index-link={trip.href}
                    >
                      <span className={styles.tripMedia}>
                        <Image
                          src={trip.image.src}
                          alt={trip.image.alt}
                          fill
                          sizes="(max-width: 47.99rem) 100vw, 50vw"
                          className={styles.tripImage}
                          style={{ objectPosition: trip.image.focal }}
                        />
                        <span className={styles.tripOverlay} aria-hidden="true" />
                      </span>
                      <span className={styles.tripRail} aria-hidden={selected}>
                        <span>{trip.title}</span>
                      </span>
                      <span className={`${styles.tripBody} card-flick_content`}>
                        <span className={styles.tripBodyInner}>
                          <span className={`${styles.tripHeader} card-flick_header`}>
                            <span className={`${styles.tripTitle} card-flick_title`}>
                              {trip.title}
                            </span>
                          </span>
                          <span className={`${styles.tripFooter} card-flick_footer`}>
                            <span className={`${styles.tripMeta} card-flick_meta`}>
                              <span>{trip.price}</span>
                              {trip.season ? (
                                <>
                                  <span
                                    className={styles.metaDivider}
                                    aria-hidden="true"
                                  />
                                  <span>{trip.season}</span>
                                </>
                              ) : null}
                            </span>
                            <span
                              className={`${styles.tripExcerpt} card-flick_excerpt`}
                            >
                              {trip.excerpt}
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
