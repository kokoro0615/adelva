# White Desert route inventory

Status: reconnaissance input for the visual adaptation. Updated 2026-08-30 JST.

This document records the bounded public route set and the measurements currently
available to implementation. It is not evidence of permission to redistribute
White Desert identity, copy, media, fonts, or other protected material.

## Authority and scope

The exact route authority is [`scripts/fidelity/route-manifest.mjs`](../../../scripts/fidelity/route-manifest.mjs):

- target origin: `https://white-desert.com`;
- 29 same-origin public paths;
- required capture viewports: `1440x900` (`desktop`), `768x1024`
  (`tablet`), and `390x844` (`mobile`);
- `/antarctica` is represented by the manifest as
  `family: "region-index-redirect"` and redirects to
  `/antarctica/wolfs-fang-runway-mountains`.

The manifest family value is authoritative. A prose grouping such as “redirect”
or “itinerary detail, day variant” must not replace the manifest value in route
data or capture names.

## Route manifest inventory

|   # | Path                                       | Manifest family         | Route role / note                                                        |
| --: | ------------------------------------------ | ----------------------- | ------------------------------------------------------------------------ |
|   1 | `/`                                        | `home`                  | Homepage                                                                 |
|   2 | `/itineraries`                             | `itinerary-index`       | Itinerary index                                                          |
|   3 | `/camps`                                   | `camp-index`            | Camp index                                                               |
|   4 | `/about/founders`                          | `about-story`           | About/story page                                                         |
|   5 | `/about/foundation`                        | `about-foundation`      | Foundation page                                                          |
|   6 | `/about/sustainability`                    | `about-sustainability`  | Sustainability page                                                      |
|   7 | `/antarctica/behind-the-scenes`            | `operations`            | Operations page                                                          |
|   8 | `/antarctica`                              | `region-index-redirect` | Redirect entry; destination is `/antarctica/wolfs-fang-runway-mountains` |
|   9 | `/prices`                                  | `rates`                 | Rates/prices page                                                        |
|  10 | `/enquire`                                 | `enquiry-form`          | Enquiry form                                                             |
|  11 | `/legal/website-terms`                     | `legal`                 | Legal document                                                           |
|  12 | `/legal/booking-terms`                     | `legal`                 | Legal document                                                           |
|  13 | `/legal/privacy-policy`                    | `legal`                 | Legal document                                                           |
|  14 | `/legal/cookies`                           | `legal`                 | Legal document                                                           |
|  15 | `/legal/medical-disclaimer`                | `legal`                 | Legal document                                                           |
|  16 | `/camps/echo-base`                         | `camp-detail`           | Camp detail                                                              |
|  17 | `/camps/explorer-camp`                     | `camp-detail`           | Camp detail                                                              |
|  18 | `/camps/whichaway-camp`                    | `camp-detail`           | Camp detail                                                              |
|  19 | `/itineraries/discovery-week`              | `itinerary-detail`      | Itinerary detail                                                         |
|  20 | `/itineraries/south-pole-emperor-penguins` | `itinerary-detail`      | Itinerary detail                                                         |
|  21 | `/itineraries/south-pole-blue-rivers`      | `itinerary-detail`      | Itinerary detail                                                         |
|  22 | `/itineraries/antarctica-in-a-day`         | `itinerary-day`         | Itinerary detail, day variant                                            |
|  23 | `/itineraries/early-emperor-penguins`      | `itinerary-detail`      | Itinerary detail                                                         |
|  24 | `/itineraries/the-long-stay`               | `itinerary-detail`      | Itinerary detail                                                         |
|  25 | `/antarctica/wolfs-fang-runway-mountains`  | `region-detail`         | Region detail; redirect destination                                      |
|  26 | `/antarctica/schirmacher-oasis`            | `region-detail`         | Region detail                                                            |
|  27 | `/antarctica/polar-plateau`                | `region-detail`         | Region detail                                                            |
|  28 | `/antarctica/atka-penguin-colony`          | `region-detail`         | Region detail                                                            |
|  29 | `/antarctica/fuel-depot`                   | `region-detail`         | Region detail                                                            |

### Family counts

The manifest has 15 exact family values and 29 route records. A 14-family
operational roll-up treats `itinerary-day` as the day variant of itinerary
detail; the exact manifest value must still be retained in route data. The
itinerary-detail roll-up is six routes (`itinerary-detail` five plus
`itinerary-day` one), and the region-detail roll-up is five routes.

| Exact family            | Count | Paths                                   |
| ----------------------- | ----: | --------------------------------------- |
| `home`                  |     1 | `/`                                     |
| `itinerary-index`       |     1 | `/itineraries`                          |
| `camp-index`            |     1 | `/camps`                                |
| `about-story`           |     1 | `/about/founders`                       |
| `about-foundation`      |     1 | `/about/foundation`                     |
| `about-sustainability`  |     1 | `/about/sustainability`                 |
| `operations`            |     1 | `/antarctica/behind-the-scenes`         |
| `region-index-redirect` |     1 | `/antarctica`                           |
| `rates`                 |     1 | `/prices`                               |
| `enquiry-form`          |     1 | `/enquire`                              |
| `legal`                 |     5 | All five `/legal/*` paths               |
| `camp-detail`           |     3 | All three `/camps/*` detail paths       |
| `itinerary-detail`      |     5 | All five non-day itinerary detail paths |
| `itinerary-day`         |     1 | `/itineraries/antarctica-in-a-day`      |
| `region-detail`         |     5 | All five `/antarctica/*` detail paths   |

The 14-family figure is the normalized implementation grouping; the manifest's
15 exact values are the source of truth. Any implementation count must be
derived from the manifest rather than this prose.

## Representative scroll-height observations

The values below are representative observations supplied for reconnaissance.
They are recorded as `scrollHeight` values in presumed CSS pixels; the capture
browser, DPR, exact viewport, locale, font-load state, and scroll-height
measurement procedure were not supplied. They must therefore be re-captured
before becoming fidelity thresholds.

| Route or family                                  | Observed `scrollHeight` | Coverage note                                                                                   |
| ------------------------------------------------ | ----------------------: | ----------------------------------------------------------------------------------------------- |
| `/` (`home`)                                     |                `20,782` | Representative home value                                                                       |
| `/` (`home`)                                     |               `~20,878` | Separate detailed 1440x900 homepage observation; differs from the representative value by 96 px |
| `/itineraries` (`itinerary-index`)               |                 `9,181` | Representative index value                                                                      |
| `/camps` (`camp-index`)                          |                 `8,753` | Representative index value                                                                      |
| `/about/founders` (`about-story`)                |                `12,190` | Representative route value                                                                      |
| `/about/foundation` (`about-foundation`)         |                 `9,390` | Representative route value                                                                      |
| `/about/sustainability` (`about-sustainability`) |                `10,877` | Representative route value                                                                      |
| `/antarctica/behind-the-scenes` (`operations`)   |                 `8,450` | Representative route value                                                                      |
| `/prices` (`rates`)                              |                `10,190` | Representative route value                                                                      |
| `/enquire` (`enquiry-form`)                      |                 `4,574` | Representative route value                                                                      |
| `legal`                                          |          `2,662–19,157` | Range across the five legal routes; per-path mapping unknown                                    |
| `camp-detail`                                    |         `12,192–12,348` | Range across the three camp details; per-path mapping unknown                                   |
| `itinerary-detail` / `itinerary-day`             |         `14,206–23,635` | Range across six itinerary detail routes; per-path mapping and day-variant value unknown        |
| `region-detail`                                  |           `9,120–9,643` | Range across five region details; per-path mapping unknown                                      |
| `/antarctica` (`region-index-redirect`)          |          Not applicable | Final document height is unknown until redirect status/chain is captured                        |

The two homepage observations are intentionally not reconciled here. A fresh
deterministic capture must identify whether the 96 px difference comes from
font readiness, viewport/capture conditions, dynamic content, or a measurement
error.

## Homepage 1440x900 measurement notes

These are measured homepage observations, not defaults for the other families:

- viewport: `1440x900`;
- `scrollHeight`: approximately `20,878` in the detailed observation above;
- hero section height: `1,800`;
- parallax banner height: `1,350`;
- H1 text: `Antarctica`;
- H1 bounding box: `x=138`, `y=620`, `width=1,165`, `height=256`;
- H1 type: Oswald, `256/256`, white;
- serif type observed: Cardinal Classic Long;
- body/metrics type observed: Inter Tight;
- root class observed: `lenis`;
- hero load animation: approximately `1,400 ms`, linear;
- common button/menu-label transitions: `300–450 ms`;
- repeating icon motion: `2 s`.

The observed font names and `lenis` class are evidence to verify, not a license
grant or proof of a particular runtime implementation. Target fonts and target
media remain research-only until ownership or redistribution rights are
documented.

## Template-family inventory

Implementation should use the exact manifest family as the route-to-template
boundary. The family-to-route mapping is:

| Template family         | Route set                          | Known variant boundary                                                  |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `home`                  | `/`                                | Homepage composition and long-form scroll                               |
| `itinerary-index`       | `/itineraries`                     | Index/list composition                                                  |
| `camp-index`            | `/camps`                           | Index/list composition                                                  |
| `about-story`           | `/about/founders`                  | Story/about composition                                                 |
| `about-foundation`      | `/about/foundation`                | Foundation composition                                                  |
| `about-sustainability`  | `/about/sustainability`            | Sustainability composition                                              |
| `operations`            | `/antarctica/behind-the-scenes`    | Operations composition                                                  |
| `region-index-redirect` | `/antarctica`                      | Redirect only; no page template unless target behavior proves otherwise |
| `rates`                 | `/prices`                          | Rates composition                                                       |
| `enquiry-form`          | `/enquire`                         | Form composition and validation states                                  |
| `legal`                 | five `/legal/*` paths              | Document length/content varies by route                                 |
| `camp-detail`           | three `/camps/*` detail paths      | Shared detail shell with route data                                     |
| `itinerary-detail`      | five itinerary detail paths        | Shared detail shell with route data                                     |
| `itinerary-day`         | `/itineraries/antarctica-in-a-day` | Explicit day-variant template/data branch                               |
| `region-detail`         | five `/antarctica/*` detail paths  | Shared detail shell with route data                                     |

## Unknowns requiring reconnaissance

- HTTP status, redirect chain, `Location`, canonical URL, and trailing-slash
  behavior for `/antarctica`;
- per-route scroll height at all three required viewports, including the exact
  route represented by each range endpoint;
- section order, heading hierarchy, landmark bounds, link destinations, and
  content states for every family;
- whether hover, touch, carousel, accordion, loading, error, or validation
  states exist on each route;
- exact motion triggers, curves, implementation tools, interruption behavior,
  and mobile/reduced-motion alternatives beyond the measured homepage timings;
- browser/version, DPR, locale, timezone, network, font readiness, and other
  conditions for the supplied measurements;
- owner/license status for target copy, identity, photographs, video, icons,
  logos, and fonts;
- approved replacement identity/copy/media when target rights are unavailable;
- metadata, locale, analytics, consent, and security-header behavior;
- final performance budgets and target-vs-local visual tolerance thresholds.

These unknowns are blockers for claiming full external-reference fidelity, not
reasons to invent values in the implementation.
