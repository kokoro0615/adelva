"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { getAsset } from "@/content/assets";
import { homeTarget } from "@/content/home-target";

/** Five source-derived challenges. Hover and keyboard focus expand a desktop
 * card; mobile exposes every card. Each card is one semantic link. */
export function TripFlick() {
  const [active, setActive] = useState(0);
  const trips = homeTarget.ourTrips;

  return (
    <ul className="flick flick--adelva" data-reveal-group lang="ja">
      {trips.cards.map((card, index) => {
        const asset = getAsset(card.assetId);
        const isActive = index === active;

        return (
          <li
            key={card.id}
            className={`flick__item${isActive ? " is-active" : ""}`}
            data-trip-card
            data-active={isActive ? "true" : "false"}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            <Link className="flick__link" href={card.href}>
              <div className="flick__media">
                <Image
                  src={asset.src}
                  alt=""
                  fill
                  sizes="(max-width: 47.99rem) 1100px, 1200px"
                  className="flick__image"
                  style={{ objectPosition: asset.focal }}
                />
                <span className="flick__scrim" aria-hidden="true" />
                {/* Measured: an inactive card is veiled by a `backdrop-filter`
                    plate at opacity 1 that fades to 0 when the card activates. */}
                <span className="flick__overlay" aria-hidden="true" />
              </div>

              <span className="flick__rail" aria-hidden="true">
                <span className="flick__rail-text">{card.title}</span>
              </span>
              <div className="flick__body">
                <div className="flick__header">
                  <h3 className="flick__title">
                    {card.title.split(/(?=を)/).map((part) => (
                      <span className="flick__title-part" key={part}>
                        {part}
                      </span>
                    ))}
                  </h3>
                </div>

                <div className="flick__footer">
                  <span className="flick__meta">
                    <span className="flick__price numeric">{card.number}</span>
                  </span>
                  <p className="flick__excerpt">{card.excerpt}</p>
                  <span className="flick__cue">
                    {trips.cardCta}
                    <span className="flick__cue-glyph" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
