# White Desert visual-adaptation implementation specification

Status: reconnaissance-informed specification; target-specific unknowns remain.
Updated: 2026-08-30 JST.

This specification defines the implementation contract for a measurable,
semantic visual adaptation of the public White Desert route set. It does not
grant permission to redistribute White Desert identity, copy, photography,
video, icons, logos, or fonts. Until ownership or redistribution permission is
recorded, target content is research-only and production must use an approved
original identity, copy, and owned/licensed/generated replacement assets.

## Source of truth and non-negotiable invariants

Resolve conflicts in this order: explicit approved requirements and copy;
existing routes, behavior, schemas, and tests; repository conventions and
owned/licensed assets; measured target evidence; approved visual references;
implementation judgment. The generated design-system master file is advisory
and cannot override measured evidence, rights restrictions, or accessibility
requirements.

The route authority is [`scripts/fidelity/route-manifest.mjs`](../../scripts/fidelity/route-manifest.mjs).
It defines 29 paths, 15 exact family values, and the three required named
viewports. The complete inventory and current measurements are in
[`white-desert-route-inventory.md`](../../.Codex/docs/research/white-desert-route-inventory.md).

The implementation must preserve these invariants:

- all 29 approved public paths and their internal destinations;
- the `/antarctica` redirect to
  `/antarctica/wolfs-fang-runway-mountains` (status, chain, and canonical
  behavior still require capture);
- global navigation, menu, footer, anchors, and browser back/forward behavior;
- semantic heading and landmark order, accessible names, metadata, and
  crawlable links once approved content is available;
- keyboard operation, visible focus, Escape/return-focus behavior, and
  meaningful hover/touch alternatives;
- validation and error behavior for the recreated enquiry demonstration form;
- responsive content order, stable media dimensions, and content that does not
  depend on hover or motion;
- native scrolling and an authored `prefers-reduced-motion` fallback.

No target form is submitted, no purchase or booking is initiated, and no
target data is uploaded or mutated during capture or local development.

## Template and data boundaries

### Route-to-template boundary

Use the exact `family` value from `routeManifest` to choose a template. Do not
infer a template from a pathname substring or maintain a second route list.
The practical grouping is below; `itinerary-day` and
`region-index-redirect` remain distinct exact manifest values.

| Exact family            | Routes                             | Template responsibility                        |
| ----------------------- | ---------------------------------- | ---------------------------------------------- |
| `home`                  | `/`                                | Long-form homepage shell and sections          |
| `itinerary-index`       | `/itineraries`                     | Itinerary index/list                           |
| `camp-index`            | `/camps`                           | Camp index/list                                |
| `about-story`           | `/about/founders`                  | Story/about page                               |
| `about-foundation`      | `/about/foundation`                | Foundation page                                |
| `about-sustainability`  | `/about/sustainability`            | Sustainability page                            |
| `operations`            | `/antarctica/behind-the-scenes`    | Operations page                                |
| `region-index-redirect` | `/antarctica`                      | Redirect response; no page template by default |
| `rates`                 | `/prices`                          | Rates/prices page                              |
| `enquiry-form`          | `/enquire`                         | Enquiry content and validation form            |
| `legal`                 | Five `/legal/*` paths              | Legal document shell with route data           |
| `camp-detail`           | Three `/camps/*` detail paths      | Shared camp-detail shell                       |
| `itinerary-detail`      | Five itinerary detail paths        | Shared itinerary-detail shell                  |
| `itinerary-day`         | `/itineraries/antarctica-in-a-day` | Explicit day-variant shell/data branch         |
| `region-detail`         | Five `/antarctica/*` detail paths  | Shared region-detail shell                     |

### Data model contract

The following are contract-level boundaries, not a demand to invent unmeasured
content. Field values that are not approved or observed remain explicitly
unknown/blocked.

`RouteRecord` is the only route lookup record:

- `path`: exact manifest path;
- `family`: exact manifest family;
- `redirectTo`: present only for a verified redirect, initially unknown for
  status/chain metadata;
- `dataKey`: stable key for family data, never a copy-derived pathname guess;
- `canonicalPath` and `locale`: approved metadata, currently unknown;
- `sections`: ordered, typed content section records;
- `assetRefs`: IDs into the provenance manifest, never remote target URLs;
- `stateRefs` and `motionRefs`: references to verified interaction records;
- `contentStatus`: `approved`, `research-only`, or `blocked`.

`TemplateData` owns ordered structure and behavior configuration. It must not
own target copy, unverified claims, hard-coded route checks, or asset URLs.
`ContentRecord` owns approved headings, body copy, labels, legal text, and
accessible names. `AssetRecord` owns provenance, rights, dimensions, loading,
and alt-text intent. `MotionRecord` owns measured trigger and fallback data.
These records are independently reviewable and testable.

### Server/client ownership

Following the project design decisions:

- App Router server components own static route shells, approved content,
  metadata, and crawlable links;
- client components are limited to navigation/menu state, media controls,
  carousels, accordions, form state, and measured motion;
- CSS owns ordinary hover/focus/open transitions;
- GSAP + ScrollTrigger is permitted only for measured pinned, scrubbed, or
  horizontal choreography;
- Lenis is a desktop enhancement only and never replaces native scroll
  semantics;
- every client effect has scoped cleanup and no effect is required for the
  content to be readable or navigable.

## DOM and semantic structure

Every document must provide:

1. an approved document language on `<html lang>` (the current default locale is
   not yet verified);
2. a keyboard-reachable skip link targeting a single `<main id="main-content">`;
3. a `<header>` containing the site identity and a `<nav>` with an explicit
   accessible name;
4. one meaningful document `<h1>` followed by a logical heading hierarchy;
5. a `<footer>` with navigational groups represented as lists of links;
6. visible focus indicators with sufficient contrast and no focus loss during
   motion or menu transitions.

Family-specific semantics:

- index pages use `<ul>`/`<ol>` and `<li>` for repeated cards; a card whose
  primary action changes location is an `<a>`, not a button;
- detail, story, operations, and region pages use an `<article>` or named
  `<section>` for each independently understandable section, with
  `aria-labelledby` only where a visible heading exists;
- legal pages use an `<article>` with real headings, paragraphs, lists, and
  links; legal text cannot be replaced by invented summary copy;
- the enquiry page uses a real `<form>`, associated `<label>` elements,
  `<fieldset>/<legend>` where groups exist, and programmatically associated
  error text. It is a non-submitting demonstration until a user explicitly
  approves a backend and submission behavior;
- `/antarctica` should be an HTTP-level redirect. If an accessible fallback is
  ever necessary, it must expose a clear status and a normal link to the
  destination rather than silently relying on client JavaScript;
- images with meaning have concise alt text from approved content; decorative
  imagery uses empty alt text and is not duplicated in accessible names;
  complex informational imagery gets a nearby text equivalent or caption;
- use buttons for state changes and links for navigation. Do not use click-only
  `<div>` elements, positive `tabindex`, or `aria-hidden` on focusable content.

No content may be hidden behind a fixed header, revealed only on hover, or made
available only after a motion sequence completes.

## Responsive and layout contract

All comparison and release captures use these exact CSS viewport sizes:

| Name      | Viewport   | Required behavior                                              |
| --------- | ---------- | -------------------------------------------------------------- |
| `desktop` | `1440x900` | Match measured desktop composition and landmarks               |
| `tablet`  | `768x1024` | Reflow without clipping, preserving reading order and controls |
| `mobile`  | `390x844`  | Linear, touch-first layout with no horizontal overflow         |

The target's breakpoint values, mobile section order, and per-family geometry
are not yet measured. Do not invent breakpoint numbers or extrapolate desktop
pixel positions to tablet/mobile. Determine those values from fresh target
captures and record them in the discrepancy ledger.

Baseline rules while those measurements are pending:

- use fluid containers and reflow rather than scaling a desktop screenshot or
  fixed canvas;
- preserve content order and all primary actions at every viewport;
- reserve intrinsic media dimensions before loading to prevent layout shift;
- keep keyboard and touch controls reachable at the required sizes without
  relying on hover;
- prevent horizontal scrolling at `390x844` and `768x1024`;
- provide a static, readable mobile fallback for any parallax or pinned
  composition until target mobile behavior is measured;
- retain equivalent information and link destinations when columns stack or
  media crops change.

### Measured homepage desktop constraints

These values apply only to the observed homepage at `1440x900`; they are not
defaults for other routes or viewports:

- hero height: `1,800`;
- parallax banner height: `1,350`;
- H1 text: `Antarctica`, white, Oswald `256/256`;
- H1 observed bounds: `x=138`, `y=620`, `width=1,165`, `height=256`;
- detailed homepage `scrollHeight`: approximately `20,878`.

The route inventory also records a separate representative home value of
`20,782`; the 96 px difference is unresolved and must be explained by a fresh
deterministic capture before either value is a hard fidelity threshold.

Observed typography is Cardinal Classic Long for serif content and Inter Tight
for body/metrics. The measured names are research evidence, not permission to
ship those fonts. The generated master file's Playfair Display/Inter pairing is
advisory and must not silently override these observations or the rights gate.

## State inventory

Capture and implement the following states where the target proves them. A
state marked “verify” is not permission to invent target behavior; it is a
required reconnaissance check.

| State                                | Applies to                                  | Required contract                                                                                                           | Target status                                    |
| ------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Default, loaded                      | All rendered families                       | Content, links, media, and landmarks are readable after load                                                                | Verify per route                                 |
| Loading/font/media                   | Routes with deferred content/media          | Reserve space; expose no blank critical content; recover from failure                                                       | Verify                                           |
| Global navigation closed/open        | All page templates except redirect response | Menu button exposes `aria-expanded`/`aria-controls`; Escape closes and returns focus; tab order stays contained while modal | Target lacks these safeguards; improve           |
| Link/button hover                    | Interactive elements                        | Provide non-hover equivalent; no layout-shifting hover; keyboard focus has equivalent feedback                              | Verify                                           |
| Keyboard focus                       | All interactive routes                      | Visible focus, logical order, no focus loss during transition                                                               | Required implementation; target verify           |
| Touch/press                          | Tablet/mobile interactive routes            | Equivalent action without hover; no pointer-only dependency                                                                 | Verify                                           |
| Scroll/in-view                       | Long-form families                          | Content remains available at scroll start/middle/end; no pinned section traps native scroll                                 | Verify                                           |
| Carousel default/next/previous       | If a route contains a carousel              | Buttons have names, current item is announced, swipe has button equivalent, focus remains predictable                       | Presence verify                                  |
| Accordion collapsed/open             | If a route contains an accordion            | Button state and panel relationship are exposed; content is keyboard reachable                                              | Presence verify                                  |
| Enquiry pristine/focused/filled      | `/enquire`                                  | Labels, input purpose, and focus styles are exposed                                                                         | Required; exact fields verify                    |
| Enquiry invalid/valid/blocked submit | `/enquire`                                  | Inline errors plus summary/status; no target or external submission; preserve values on correction                          | Target empty submit is disabled; improve locally |
| Redirect response                    | `/antarctica`                               | Record status, `Location`, final URL, and chain; no duplicate client redirect                                               | Verify                                           |
| Reduced motion                       | All routes                                  | Skip/reduce transforms and loops; preserve final layout, content, and native scrolling                                      | Target keeps Lenis/GSAP/reveals; do not copy     |
| No-JavaScript fallback               | All routes                                  | Navigation, links, content, and form labels remain usable; enhanced motion is optional                                      | Required                                         |

The interaction audit found target accessibility defects that are explicitly
outside the fidelity contract: the mobile menu does not close on Escape, does
not return focus after its Close button, does not contain keyboard focus, and
does not expose effective scroll locking; the audited reduced-motion contexts
retain Lenis, GSAP transforms, and a 1.4-second reveal. The adaptation must
preserve the visible states and timing language while implementing the safer
behavior required above. See
`.Codex/docs/research/white-desert-interaction-state-audit.md`.

## Motion contract

Motion must communicate hierarchy, continuity, feedback, or causality. It must
not delay reading, trap focus, or be required for a task. Values below separate
measured observations from implementation recommendations; “unknown” is an
explicit capture task.

| Motion                              | Purpose                              | Tool                                                                                                 | Duration/easing                                            | Interrupt and exit                                                                                                      | Reduced-motion behavior                               |
| ----------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Homepage hero load                  | Establish opening hierarchy/reveal   | CSS keyframes preferred; observed runtime tool unknown                                               | Approximately `1,400 ms`, linear (observed)                | Never lock scroll or focus; user scroll/input can continue; settle on final state and keep it visible                   | Show final state immediately; no hidden critical text |
| Parallax banner                     | Spatial depth and scroll continuity  | GSAP/ScrollTrigger only if fresh capture confirms pinned/scrubbed choreography; otherwise CSS/static | Scroll-linked; duration, scrub, curve, and trigger unknown | Native scroll remains available; kill scoped trigger on unmount; exit cleanly at section boundary                       | Static media/position; no pinning or scroll hijack    |
| Common button/menu-label transition | State feedback and label continuity  | CSS transition                                                                                       | `300–450 ms` (observed); exact curve unknown               | Reverse from current computed state; text and focus remain readable; settle without layout shift                        | Instant/static state with visible focus               |
| Repeating icon motion               | Affordance or ambient cue            | CSS keyframes preferred                                                                              | `2 s` repeating loop (observed); curve and trigger unknown | Must not block interaction; stop when no longer relevant or when focus/hover policy requires; leave a stable final icon | Static icon; no required cue depends on movement      |
| Lenis-enhanced scroll               | Smooth desktop continuity            | Lenis only as desktop enhancement; exact target config unknown                                       | Scroll behavior/config unknown                             | Preserve native wheel, keyboard, anchor, back/forward, and focus semantics; destroy on unmount                          | Disable Lenis; use native scroll                      |
| Other route motion                  | Family-specific hierarchy/continuity | CSS first; GSAP only for measured scroll choreography                                                | Unknown until route study                                  | Unknown until route study; no motion may block reading or input                                                         | Static equivalent required                            |

The observed homepage root class `lenis` is evidence of a target state, not
proof that every route requires scroll hijacking. Motion tests must cover both
default and `prefers-reduced-motion: reduce`, including menu interruption and
focus restoration.

## Asset provenance and rights

Every production asset requires a provenance record with:

- stable asset ID and file path;
- source and owner;
- license/permission evidence and usage scope;
- status (`approved`, `pending`, `research-only`, or `blocked`);
- role (logo, photo, video, icon, font, replacement media, or screenshot);
- intrinsic dimensions/aspect ratio and responsive crop intent;
- loading strategy (`priority`, eager, lazy, or deferred) with rationale;
- alt-text intent (meaningful description, decorative, or text equivalent);
- processing/derivative notes and hash where useful for reproducibility.

Target screenshots, target logos, target photography/video, target icons, target
copy, and target fonts remain research-only until rights are documented. Do not
hotlink the target or place target assets in the deployable bundle. Generated
replacement media must be original, inspected, approved, and recorded in a
separate asset manifest. Generated image text is never production copy.

The measured Cardinal Classic Long, Oswald, and Inter Tight names require a
license/ownership decision. Until then, use only an approved replacement font
and record its metrics; do not claim typographic fidelity from an unlicensed
download.

## Accessibility and interaction requirements (WCAG 2.2 AA)

- meet WCAG 2.2 AA contrast for text and meaningful graphical controls (at
  least 4.5:1 for normal text and 3:1 for large text, with non-text contrast
  checked separately);
- ensure keyboard access and visible focus for every interactive control,
  including skip link, menu, carousels, accordions, anchors, and form fields;
- use a target-size minimum of 24 CSS px where WCAG exceptions apply and aim
  for a 44 CSS px touch target for primary controls;
- preserve logical focus order and return focus to the invoking menu/accordion
  control after closing; Escape must close dismissible overlays;
- announce validation errors and meaningful async status without moving focus
  unexpectedly; associate messages with fields using `aria-describedby` or
  equivalent semantics;
- support zoom/reflow and text resizing without clipping, overlap, or loss of
  controls at the required viewports;
- do not communicate status by color alone, autoplay essential audio/video, or
  expose a motion-only cue;
- honor `prefers-reduced-motion: reduce` and keep all navigation/content usable
  with JavaScript disabled;
- test landmarks, names/roles/values, contrast, keyboard traversal, and
  reduced-motion behavior with automated axe checks plus manual review.

## Performance budgets and delivery rules

The following are provisional engineering caps, not measurements of the target.
They must be accepted or revised before the release gate; target scroll height
and visual similarity must not be used to excuse a failed performance budget.

| Metric                   |           Provisional cap | Measurement condition                                                           |
| ------------------------ | ------------------------: | ------------------------------------------------------------------------------- |
| LCP                      |                 `≤ 2.5 s` | Fresh production build at each required viewport under a recorded fixed profile |
| INP                      |                `≤ 200 ms` | Representative menu, carousel/accordion, and form interactions                  |
| CLS                      |                   `≤ 0.1` | Full route load and first interaction; media/font space reserved                |
| Initial route JavaScript |           `≤ 200 KB` gzip | First-load route transfer, excluding cached shared chunks; record actual values |
| Critical CSS             |            `≤ 50 KB` gzip | CSS needed before first meaningful render                                       |
| Above-fold media         | `≤ 1 MB` compressed total | Per required viewport; use responsive formats and priority only for LCP media   |
| Post-ready long task     |        No task `> 200 ms` | During load completion and representative interaction trace                     |

Use responsive image sources, intrinsic dimensions, lazy loading below the first
viewport, and local/approved fonts. Avoid shipping full-page target screenshots
as layout backgrounds. Animate opacity/transform where possible, do not read
layout and write layout in the same scroll frame, and clean up all observers,
timelines, and Lenis instances. No unmeasured third-party script may consume a
budget.

## Deterministic target-vs-local capture and comparison

Reference fidelity and implementation-authored visual regression are separate
gates. A local screenshot that resembles the target cannot replace a captured
external reference.

### Capture protocol

Use Playwright (or the repository's equivalent runner) for both origins with
the same:

- route path and manifest family;
- named viewport (`desktop`, `tablet`, or `mobile`) and exact width/height;
- browser/version, device scale factor, locale, timezone, color scheme, and
  reduced-motion preference;
- font/media readiness procedure, network policy, cache policy, and fixed test
  data;
- state and scroll position.

For every capture:

1. record the response status, redirect chain, final URL, and canonical where
   applicable;
2. wait for DOM readiness, `document.fonts.ready`, required image readiness,
   and a bounded stable-frame condition; record the wait policy and any
   timeout instead of silently proceeding;
3. capture default state at `scrollY=0` and at each declared
   `data-fidelity-landmark`; capture required interactive and reduced-motion
   states separately;
4. record `scrollHeight`, viewport, scroll position, route, family, state,
   browser metadata, font readiness, asset readiness, and a screenshot hash;
5. run the identical sequence against local output.

Long pages must be compared by deterministic viewport/landmark captures and
measurements, not by an unmeasured compressed full-page board. Looping motion
must use an explicit animation phase or a documented freeze point. Dynamic
regions may be masked only when the mask is documented in the discrepancy
ledger; masks cannot cover structural content.

### Landmark and comparison contract

Each implemented template exposes stable, non-visual landmark identifiers for
the header/nav, H1, hero, first primary action, section headings, major media,
form/error regions, and footer as applicable. The comparator records each
landmark's `x`, `y`, `width`, `height`, visibility, and accessible name where
available. The homepage H1 at `1440x900` is currently the only supplied exact
landmark (`138, 620, 1165, 256`); all other landmarks and viewport tolerances
are unknown until capture.

Compare like-for-like route, family, viewport, state, and scroll position for:

- redirect/status and final URL;
- document and landmark geometry;
- scroll height and section order;
- typography readiness and line wrapping;
- screenshot pixels after documented dynamic masks;
- interaction outcomes and accessibility tree/axe results.

The run must emit a discrepancy record containing observed values, expected
reference values, tolerance, artifact path, and disposition. Tolerances are
not supplied yet and must be approved/recorded before the final fidelity gate;
do not backfill them after seeing a mismatch. Reference artifacts stay outside
the deployable bundle and local visual-regression artifacts remain a separate
test output.

## Privacy, security, and prohibited trackers

The production adaptation must not include:

- Google Analytics, Google Tag Manager, Meta Pixel, Hotjar, FullStory, session
  replay, fingerprinting, ad beacons, marketing tags, or equivalent telemetry;
- third-party cookies, tracking local storage, cross-site identifiers, hidden
  iframes, or unapproved remote scripts/fonts/assets;
- network requests from production to `white-desert.com` for tracking, content
  hotlinking, or form submission;
- collection, upload, or telemetry of enquiry form values; the recreated form
  remains non-submitting until explicitly authorized;
- analytics consent prompts whose only purpose is to enable prohibited
  tracking.

Prefer a restrictive CSP and same-origin asset/connect policy, with exceptions
documented and approved. Keep secrets out of client code, validate form input
at the boundary, and do not log personal data. Any future analytics or
consent requirement is a new approved decision, not an implicit clone feature.

## Approved copy and behavior preservation

Approved copy, legal claims, labels, accessible names, prices, and calls to
action are immutable inputs to the templates. Do not invent testimonials,
prices, statistics, customers, legal text, navigation labels, or claims. The
current target copy and identity have no recorded redistribution permission,
so production copy/identity is blocked pending user approval. Placeholder
content used during scaffolding must be clearly marked and must not pass a
release gate.

Preserve measured behavior and destinations, including navigation, menu close
and focus restoration, anchors, back/forward, carousel/accordion equivalents,
validation feedback, redirect semantics, responsive order, and reduced-motion
fallbacks. A visual change that removes a behavior is a spec deviation even if
its screenshot appears similar.

## Unknowns and release blockers

The following remain open and must be recorded rather than guessed:

- ownership/redistribution permission and approved replacement identity, copy,
  legal content, media, logos, icons, and fonts;
- per-route HTTP status, redirect chain, canonical, locale, and trailing-slash
  behavior;
- section order, DOM landmarks, content lengths, link destinations, and
  per-route scroll heights at all three viewports;
- presence and exact behavior of hover, touch, carousel, accordion, loading,
  error, validation, and reduced-motion states;
- motion triggers, curves, tools, interruption, and mobile fallbacks outside
  the supplied homepage observations;
- target capture browser/DPR/font/network conditions and final comparator
  tolerances;
- final approved performance caps if the provisional budgets above are not
  accepted;
- available format, lint, typecheck, unit, Playwright, axe, visual/reference,
  motion, and production-build commands in the application scaffold.

Full external-reference fidelity is blocked until these unknowns have evidence.
If a mandatory quality gate is absent for an affected application, the release
gate is blocked or the user must explicitly accept a documented exception and
residual risk. Deployment, publishing, form submission, and production
mutation remain out of scope without explicit human approval.

## Required verification evidence before completion

Before claiming implementation completion, report:

- changed files and route families affected;
- exact commands and fresh format/lint/typecheck/unit/Playwright/axe,
  visual/reference, motion, and production-build results;
- target and local screenshot/artifact locations for all changed routes,
  states, and `1440x900`, `768x1024`, `390x844` viewports;
- asset provenance and rights status for every shipped asset;
- measured discrepancies, approved tolerances, intentional deviations, and
  unresolved residual risks;
- final accessible interaction review and reduced-motion evidence.
