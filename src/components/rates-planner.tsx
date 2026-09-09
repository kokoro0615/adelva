"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";

import { journeyTabs } from "@/content/shared";

/**
 * Season selector for the rates template.
 *
 * The measured target switches a rate list with two season tabs. Nothing here
 * states a price, a date or an availability, because none has been supplied:
 * every commercial value stays an explicit owner-supplied slot.
 */
const seasons = [
  {
    id: "season-one",
    label: "Season one",
    summary:
      "The first operating window. Its exact opening and closing dates are owner-supplied.",
  },
  {
    id: "season-two",
    label: "Season two",
    summary:
      "The following operating window. Its exact opening and closing dates are owner-supplied.",
  },
] as const;

const rateSlots = [
  "Rate per person",
  "Departure window",
  "What the rate covers",
] as const;

export function RatesPlanner({ headingId }: { readonly headingId: string }) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const next = (index + seasons.length) % seasons.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(index + 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(index - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusTab(seasons.length - 1);
    }
  };

  return (
    <div className="rates">
      <h2 className="band__title band__title--italic" id={headingId}>
        Dates and rates
      </h2>
      <p className="lede rates__intro">
        The structure below is the measured planning layout. Every commercial value is
        left as a labelled owner-supplied slot rather than an invented figure.
      </p>

      <div className="rates__controls">
        <p className="rates__legend" id="rates-legend">
          Select a season
        </p>
        <div className="rates__tablist" role="tablist" aria-labelledby="rates-legend">
          {seasons.map((season, index) => (
            <button
              key={season.id}
              type="button"
              role="tab"
              id={`rates-tab-${season.id}`}
              className="rates__tab"
              aria-selected={selected === index}
              aria-controls={`rates-panel-${season.id}`}
              tabIndex={selected === index ? 0 : -1}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {season.label}
            </button>
          ))}
        </div>
      </div>

      {seasons.map((season, index) => (
        <div
          key={season.id}
          role="tabpanel"
          id={`rates-panel-${season.id}`}
          aria-labelledby={`rates-tab-${season.id}`}
          className="rates__panel"
          tabIndex={0}
          hidden={selected !== index}
        >
          <p className="rates__summary">{season.summary}</p>
          <ul className="rates__list">
            {journeyTabs.map((journey) => (
              <li className="rate-card" key={journey.href}>
                <div className="rate-card__head">
                  <p className="rate-card__tags">
                    <span className="rate-card__tag">{season.label}</span>
                  </p>
                  <h3 className="rate-card__title">
                    <Link href={journey.href}>{journey.label}</Link>
                  </h3>
                </div>
                <dl className="rate-card__slots">
                  {rateSlots.map((slot) => (
                    <div className="rate-card__slot" key={slot}>
                      <dt>{slot}</dt>
                      <dd>Owner-supplied</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
