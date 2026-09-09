# White Desert authorized-rebuild implementation specification

Status: **authorized client rebuild**; measured home manifest below is binding.
Updated: 2026-08-31 JST.

## 2026-09-08 Last Continent correction contract

### Additional authorized scope: hero mist seam

The user additionally requested repair of the horizontal line during hero exit.
Keep ADELVA content and the measured scroll functions unchanged. Reference and
before frames in `artifacts/hero-seam/{reference,before}` sample f=0.5, 0.8, 1,
1.1, 1.3, 1.5, 1.8 at all three named viewports/DPR 1, so raster/CSS scale is 1.
Videos are paused at time zero after hydration; hero image loading is eagerly
resolved for deterministic inspection. This is a diagnostic loading policy.

Observed target `.mist-transition_image`: `object-position:center top` and
`background:linear-gradient(360deg,#fff,transparent 15%)`. Local mist lacks both.
Its partially transparent lower edge reveals grey material until the next white
section begins. At desktop f=1.1, x=400, y=809/810, before pixels are 248/255;
target is 255/255. Restore the target's CSS backing gradient and focal alignment,
without changing assets, motion timing, stage geometry or hero typography.

Controlled follow-up isolated a second cause: the local mist parent adds
`perspective:900px`, absent from the target. With the image decoded and the
gradient restored, x=400/y=625 at desktop f=1.3 still read 245. Removing only
that perspective made it 255. This unnecessary descendant perspective affects
the rotated/clipped image compositing. Remove it; retain the parent's rotateX,
origin, sticky bounds and scroll linkage. No animation library changes needed.

Predeclared seam check: for f=1.1, 1.3, 1.5, 1.8, compare the 3-pixel bands just
above/below section document y=2×viewportHeight, excluding navigation, flyout and
vertical hairlines. Mean per-channel jump <=3/255, maximum sampled jump <=5/255.
Inspect the transition frame rasters and diff at original size. Test reversal,
normal/reduced motion and fractional viewport scroll positions. Existing
no-JS/reduced motion readability remains required.

Scope: `/`, only the Last Continent section and its decorative surface. Existing
client authorization applies. ADELVA hero/header, routes, copy, section order,
season imagery and global shell remain outside this correction. Mode C supplied
precise reference; no generation, recursive discovery or additional route work.

Live reference: `https://white-desert.com/`, captured 2026-09-08 at DPR 1 in
Chromium. `artifacts/last-continent/reference/{desktop,tablet,mobile}-{entry,start,center,reverse}.png`
are 1440×900, 768×1024 and 390×844 respectively: scaleX=scaleY=1.
The matching JSON records computed styles, bounds, scroll and browser errors.
Entry is section top minus half a viewport, start/reverse is section top,
center is section top plus 200px. References are research artifacts; existing
authorization covers the small target SVG ornament used in production.

| Landmark                      | Desktop            | Tablet             | Mobile                  | Tolerance |
| ----------------------------- | ------------------ | ------------------ | ----------------------- | --------- |
| White background x / width    | 0 / 1440           | 0 / 768            | 0 / 390                 | 0px       |
| Section document y / height   | 1800 / 785.55      | 2048 / 1037.59     | 1688 / 591.59           | 1px       |
| Content grid inner gutter     | 12px               | 12px               | 12px                    | 0px       |
| Label x / section-relative y  | 484 / 320          | 260 / 320          | 59.25 / 200             | 1px       |
| Quote x / y / width           | 484 / 373.56 / 708 | 260 / 373.59 / 379 | 59.25 / 257.59 / 318.75 | 1px       |
| Quote size / leading / indent | 42 / 42 / 33.3333% | 42 / 42 / 33.3333% | 26 / 26 / 25%           | 0.1px     |

Background authority: opaque white, no photograph. Current `width:calc(100% -
24px)` incorrectly applies the content inset to the painted surface, exposing
the translated hero video at both edges. Use full width and 12px inline padding
with the existing border-box sizing; this retains the original text grid and
does not add a structural wrapper. Retain the section stacking context.

Restore section-local 0.5px vertical rules, effective black 10% over white:
12px, 60px, 50%, width−60.5px, width−12.5px, plus desktop/tablet grid positions
12+(width−24)/6−0.5, 12+(width−24)/3,
12+2(width−24)/3−0.5, 12+5(width−24)/6.
Below 768px only the five outer/center rules remain. These decorative elements
are absolute, pointer-inert and aria-hidden, clipped to this section.
The label ornament uses the authorized 191×62 SVG, width 180% of the intrinsic
label, right −10%, with its lower edge 12.1875px below the label box.

Preserve Cardinal Classic Long 400 quote / italic 500 label and current semantic
HTML. Keep existing reveal and reduced-motion behavior. The target's mask fades
readable copy to 10% opacity and its scribble draws on entry; this correction
retains full text contrast and a static decorative stroke. These are explicit
accessibility/motion differences, not pixel-equivalence claims. ADELVA navigation,
target cookie UI and the adjacent season are excluded from section pixel metrics.

Acceptance: three viewport geometry checks above, white left/right edge pixels
at entry/start/center/reverse (excluding shell controls), no hero elements above
the section at the edges, no horizontal overflow, no new hydration/page errors.
Inspect reference, actual, overlay and difference at original resolution. Raw
pixel metrics remain diagnostic because of the documented mask/shell differences;
do not loosen the separate existing external-reference release gate.

Baseline: strict web audit 20/20 PASS. `pnpm build` and `pnpm exec tsc --noEmit`
are blocked by the pre-existing undefined `MENU_GEOMETRY` in
`tests/e2e/global-shell-clone.spec.ts:356`, associated with the ongoing ADELVA
navigation replacement. Do not modify that unrelated work to green this task.

This specification defines the implementation contract for a measurable,
semantic **exact reconstruction** of the public White Desert route set.

**Rights status (2026-08-31):** the authorized client representative gave
explicit written authorization covering all target identity, copy, images,
video, fonts, and other assets. Target content is therefore **approved for
production**, recorded per asset in `docs/asset-provenance.md`. The
research-only language retained further down this document is superseded
wherever it conflicts with this header; it is kept for audit continuity.

Fidelity target is exactness, not adaptation. A visual difference is a defect
unless it is listed as an intentional deviation with a stated reason
(accessibility, performance budget, or a documented technical blocker).

## Measured HOME manifest — `home-target-v1` (binding, corrected 2026-08-31)

Source of truth: `.Codex/docs/research/home-fidelity-gap-forensics.md`.
Topology is scoped to `main .page-content` **only**. Global flyouts, navigation
data and footer links are not HOME sections. A manifest derived from the whole
served heading stream is invalid; an earlier revision of this block made exactly
that error and is superseded here.

### Hierarchy

```text
home-target-v1
+-- hero
+-- last-continent
+-- our-season
+-- our-trips
|   +-- title-field
|   +-- card-list[5]
+-- founder-quote
+-- our-camps            (pinned horizontal flow, 5 panels)
|   +-- intro
|   +-- whichaway
|   +-- echo
|   +-- explorer
|   +-- camp-quote
+-- cpt-wfr-bridge
+-- mist-divider
+-- travel-globe
+-- planning-cta
+-- site-footer (global, outside .page-content)
```

Ten page-content semantic stages plus the global footer. `.page-content` exposes
exactly **seven direct children**; the seventh is a composite wrapper holding
`our-camps`, `cpt-wfr-bridge`, `mist-divider`, `travel-globe` and
`planning-cta`.

**"How it works" is a global flyout (`.flyout_popup .flyout_content`) and is NOT
HOME page content.** **"Discovery Week" is global nav data and a footer link and
is NOT a HOME trip card.**

### Implementation contract

Production emits stable semantic IDs, not copied target classes:

- `data-fidelity-section="<id>"` on every stage above.
- `data-fidelity-parent="<parent-id>"` on nested stages.
- `data-motion-layer="<id>"` on each animated hero/divider layer.

### Direct-child document bounds (`documentY / height`, CSS px)

| Direct child                |           `1440x900` |           `768x1024` |           `390x844` |
| --------------------------- | -------------------: | -------------------: | ------------------: |
| hero                        |     `0.00 / 1800.00` |     `0.00 / 2048.00` |    `0.00 / 1688.00` |
| last-continent              |   `1800.00 / 785.55` |  `2048.00 / 1037.59` |  `1688.00 / 591.59` |
| our-season                  |  `2585.55 / 1350.00` |  `3085.59 / 1536.00` | `2279.59 / 1266.00` |
| our-trips title-field       |   `3935.55 / 539.97` |   `4621.59 / 540.00` |  `3545.59 / 332.98` |
| our-trips card-list         |   `4475.52 / 765.00` |   `5161.59 / 870.39` | `3878.58 / 3626.95` |
| founder-quote               |   `5240.52 / 955.91` |  `6031.98 / 1055.19` |  `7505.53 / 738.63` |
| composite long-form wrapper | `6196.42 / 13644.94` | `7087.17 / 11973.73` | `8244.16 / 8940.34` |

### Nested stage bounds

| Stage          |           `1440x900` |           `768x1024` |            `390x844` |
| -------------- | -------------------: | -------------------: | -------------------: |
| cpt-wfr-bridge |  `15646.42 / 427.98` |  `14451.17 / 428.00` |  `13538.16 / 500.00` |
| mist-divider   |  `16074.41 / 900.00` | `14879.17 / 1024.00` |  `14038.16 / 844.00` |
| travel-globe   | `16974.41 / 1966.95` | `15903.17 / 2133.73` | `14882.16 / 1458.34` |
| planning-cta   |  `18941.36 / 900.00` | `18036.91 / 1024.00` |  `16340.50 / 844.00` |
| site-footer    |  `19841.36 / 945.97` | `19060.91 / 1024.00` | `17184.50 / 2132.94` |

### Our Camps pinned horizontal flow

| Viewport   |       Container | Panel widths, in order               |     Pinned interval | Final X   |
| ---------- | --------------: | ------------------------------------ | ------------------: | --------- |
| `1440x900` | `5639.95 x 900` | `1440, 919.98, 919.98, 919.98, 1440` | `6196.42..14746.42` | `-4200px` |
| `768x1024` |   `3288 x 1024` | `768, 584, 584, 584, 768`            | `7087.17..13427.17` | `-2520px` |
| `390x844`  |    `1950 x 844` | `390, 390, 390, 390, 390`            | `8244.16..12694.16` | `-1560px` |

Panels in order: intro (Our Camps / Polar Comfort), Whichaway, Echo, Explorer,
full-viewport camp quote.

### Our Trips composition

- Title is a **separate** white section before the card section.
- `section-title` is uppercase, centred, `60/60px` box `331x60` at
  desktop/tablet; `32/32px` box `270x32` at mobile.
- Card container has a 12px viewport inset.
- Desktop card field `1416x765`: active card `708px` (50%), four inactive at
  `177px` (12.5%).
- Tablet card field `744x870.39`: active `372px`, inactive `93px`.
- Mobile card field `366x3626.95`: five `366x717.39` cards, 10px gap, all
  content visible.
- Desktop/tablet inactive content opacity `0` behind an opacity `1` overlay;
  active content opacity `1`, overlay `0`.
- Hover switches `is-active` immediately; widths/content settle ~`600ms`; the
  active image zooms `1 -> 1.05` over `600ms cubic-bezier(0.4,0,0.2,1)`.
- **Intentional deviation:** the target does not activate an inactive card on
  keyboard focus (default 1px outline only). The rebuild adds a focus/touch
  equivalent while preserving the measured visual state.

Card identity, links, price/season meta and excerpts are owned by
`src/content/pages/home.ts`, not duplicated here.

### Hero layer stack and exact motion

```text
hero (200svh)
+-- mist plane      sticky, z-index 1, transform-origin 50% 100svh, rotateX(90deg)
+-- hero wrapper (100svh)
    +-- video       autoplay loop muted playsinline preload=metadata, no poster, object-fit cover
    +-- overlay
    +-- content     layout + title wrapper, both -60svh terminal
    +-- cloud 1     near, terminal -80%
    +-- cloud 2     far,  terminal -10%
```

Let `f = scrollY / viewportHeight`. All linkage is **linear (`ease: none`)**,
normalized identically at all three viewports:

| Layer          | Function                                  | Clamp          |
| -------------- | ----------------------------------------- | -------------- |
| hero wrapper   | `translateY(100f svh)`                    | `200svh`       |
| content layers | `translateY(-30f svh)`                    | `-60svh`       |
| `h1`           | `blur(5f px)`                             | `10px`         |
| cloud 1        | `translateY(100 - 90f %)`                 | `-80%`         |
| cloud 2        | `translateY(100 - 55f %)`                 | `-10%`         |
| mist plane     | `rotateX(90deg -> 0deg)` over `0.8..1.5f` | hold both ends |

Checkpoints: at `f=1.0` -> wrapper `100svh`, content `-30svh`, `blur(5px)`,
clouds `10%` / `45%`, mist `64.2857deg`. At `f=2.0` everything clamps.

The wrapper's positive translation cancels ordinary document scroll, keeping the
one-viewport composition optically pinned across the two-viewport stage.

**Interruption:** a scroll jump or mid-sequence reversal resolves directly to the
exact scroll-linked state on the next animation frame. No catch-up tween, no
queued forward completion, no overshoot.

### Founder signature draw motion

User-approved replacement (2026-09-08): render `kokoro nakagawa` in the
HOME attribution and replace the former signature with original lowercase
single-line cursive SVG lettering. Keep the existing semantic figure, quote,
role, responsive width and `656.82 × 120.12` viewBox. Align the new mark
with the attribution (remove the old negative inline margin). The decorative SVG is
`aria-hidden`; the adjacent real text supplies the accessible name.

Fourteen letter strokes draw in reading order, followed by a fine underline.
Distribute 1.65 seconds of pen travel proportionally to SVG path length, with
25ms pen lifts, a 120ms word break and a 100ms pause before the final flourish
(total about 2.17s). Use linear pen travel, round caps/joins, and the existing
GSAP DrawSVG/ScrollTrigger dependencies with scoped `useGSAP` cleanup.
Retain `top 75%` and `play none none reverse`, including interruption from the
current playhead. Stroke drawing is the intentional paint-property exception
for this requested handwriting effect; no layout properties animate.

SSR, JavaScript-disabled and reduced-motion states show the complete signature.
Switching motion preference must restore the complete mark and remove the trigger.
Verify initial, intermediate, final and reversed states at 1440×900, 768×1024 and
390×844. The new name and handwriting intentionally differ from the historical
external reference; retain that reference independently, without relabelling it
as a passing comparison. No image/font download or additional dependency.

### Intentional deviations (must stay explicit)

1. **Reduced motion.** The target ignores `prefers-reduced-motion: reduce` —
   transforms are numerically identical under both preferences and the video
   keeps advancing. The rebuild instead builds **no** ScrollTrigger, tween or
   scroll listener under `reduce`, settles every layer at its readable end
   state, and does not autoplay the video. This is a deliberate WCAG 2.2 AA
   improvement over the target, not a fidelity miss.
2. **Keyboard activation of Our Trips cards** (see above).

### Acceptance thresholds

| Assertion                       | Threshold                                                    |
| ------------------------------- | ------------------------------------------------------------ |
| `.page-content` direct children | exactly 7 at all three viewports                             |
| Semantic stages                 | exactly the 10 IDs above, in order; `missing=[]`, `extra=[]` |
| Our Trips cards                 | exactly 5                                                    |
| Our Camps panels                | exactly 5                                                    |
| Hero motion layers              | 1 video + 1 mist plane + 2 cloud wraps                       |
| Founder signature motion        | 6 paths; `0 -> partial -> 1 -> 0` under no-preference        |
| Route statistics                | 3, exact strings                                             |
| `how-it-works` as HOME section  | must be absent                                               |
| `Discovery Week` as a HOME card | must be absent                                               |
| Total `scrollHeight`            | `20787` / `20085` / `19317`, tolerance +/-3%                 |
| Horizontal overflow             | 0 px at all three viewports                                  |
| Production external requests    | 0 to white-desert.com / sanity.io / cloudflarestream         |

Tolerances are predeclared here and must not be widened after observing a
mismatch.

## Source of truth and non-negotiable invariants

Resolve conflicts in this order: explicit approved requirements and copy;
existing routes, behavior, schemas, and tests; repository conventions and
owned/licensed assets; measured target evidence; approved visual references;
implementation judgment. The generated design-system master file is advisory
and cannot override measured evidence, rights restrictions, or accessibility
requirements.

The route authority is [`scripts/fidelity/route-manifest.mjs`](../../scripts/fidelity/route-manifest.mjs).
It defines 30 paths, 16 exact family values, and the three required named
viewports. The complete inventory and current measurements are in
[`white-desert-route-inventory.md`](../../.Codex/docs/research/white-desert-route-inventory.md).

The implementation must preserve these invariants:

- all 30 approved public paths and their internal destinations;
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

| Exact family            | Routes                                     | Template responsibility                        |
| ----------------------- | ------------------------------------------ | ---------------------------------------------- |
| `home`                  | `/`                                        | Long-form homepage shell and sections          |
| `itinerary-index`       | `/itineraries`                             | Itinerary index/list                           |
| `camp-index`            | `/camps`                                   | Camp index/list                                |
| `about-story`           | `/about/founders`                          | Story/about page                               |
| `about-foundation`      | `/about/foundation`                        | Foundation page                                |
| `about-sustainability`  | `/about/sustainability`                    | Sustainability page                            |
| `operations`            | `/antarctica/behind-the-scenes`            | Operations page                                |
| `aviation`              | `/antarctica/direct-flights-to-antarctica` | Aviation/logistics long-form page              |
| `region-index-redirect` | `/antarctica`                              | Redirect response; no page template by default |
| `rates`                 | `/prices`                                  | Rates/prices page                              |
| `enquiry-form`          | `/enquire`                                 | Enquiry content and validation form            |
| `legal`                 | Five `/legal/*` paths                      | Legal document shell with route data           |
| `camp-detail`           | Three `/camps/*` detail paths              | Shared camp-detail shell                       |
| `itinerary-detail`      | Five itinerary detail paths                | Shared itinerary-detail shell                  |
| `itinerary-day`         | `/itineraries/antarctica-in-a-day`         | Explicit day-variant shell/data branch         |
| `region-detail`         | Five `/antarctica/*` detail paths          | Shared region-detail shell                     |

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

Breakpoint behavior, mobile section order, and per-family geometry have now
been measured at all three required viewports. The versioned HOME, index,
detail, legal, global-shell, and full-page manifests are the authority; values
must not be extrapolated from desktop or changed after observing local output.

The following baseline rules continue to apply between measured viewports:

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

### Measured homepage constraints

These values are HOME-specific and do not become defaults for other families:

- hero height: `1,800`;
- parallax banner height: `1,350`;
- H1 text: `Antarctica`, white, Oswald `256/256`;
- H1 observed bounds: `x=138`, `y=620`, `width=1,165`, `height=256`;
- deterministic target `scrollHeight`: `20,787 / 20,085 / 19,317` at desktop,
  tablet, and mobile respectively.

Observed and authorized typography is Cardinal Classic Long for serif content,
Inter Tight for body/metrics, and Oswald for condensed display. Same-origin
WOFF2 files are recorded in `docs/asset-provenance.md`; generated font pairings
must not override these measured faces.

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

The user's 2026-08-31 client authorization covers the target logos,
photography/video, icons, copy, and fonts used by this reconstruction. Approved
production derivatives are local and recorded in `docs/asset-provenance.md`.
Target screenshots remain research-only evidence, hotlinking remains forbidden,
and generated image text is never production copy.

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
current target copy and identity are authorized by the client attestation
recorded in the workflow ledger; placeholder scaffolding must not pass a
release gate.

Preserve measured behavior and destinations, including navigation, menu close
and focus restoration, anchors, back/forward, carousel/accordion equivalents,
validation feedback, redirect semantics, responsive order, and reduced-motion
fallbacks. A visual change that removes a behavior is a spec deviation even if
its screenshot appears similar.

## Unknowns and release blockers

Rights, the 30-route union, required scripts, target section order, primary
interactions, and the three viewport dimensions are resolved. Release remains
open until the fresh integrated format, lint, typecheck, unit, Playwright, axe,
section/reference fidelity, production-build, and final Opus 5 Max review
complete. The 235.7 MB long-form film is a recorded deployment/performance risk.
Deployment, publishing, form submission, and production mutation remain out of
scope without explicit human approval.

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

## HOME lower sequence correction — 2026-09-08

Scope: HOME Our Camps through planning CTA and footer comparison. Existing ADE LVA
navigation is an earlier approved product change and remains authoritative.
Read-only live Chromium captures at 1440×900, 768×1024, 390×844 establish:

- Horizontal distances are already correct; intro overflow incorrectly clips the
  counter-translated background. Keep panel overflow visible inside the clipped
  sticky viewport. Separate title/background mask from vertically moving prose.
- Asset roles were inverted: gallery-1 is the mountain introduction, gallery-2
  the overhead blue ice, gallery-3 the final crevasse background. Reuse authorized
  local assets; no new production asset acquisition.
- Intro title is centered Cardinal, 90px desktop/tablet, 32px mobile. Prose is
  14/21px, at 2/3 of the 12px-gutter grid (mobile 3/4-width centered).
- Card contents are centered with 32px gaps (20px mobile), 14/19.6px excerpts;
  coordinates use Oswald at the bottom. Mobile excerpts must remain visible.
- Final background must remain pinned through the bridge and mist. Bridge text
  moves beyond its flow box, so clipping it is a defect. Mist is a rotating
  transparent plane spanning the transition, not an opaque white section.
- Travel heading sits on white; map remains dark. CTA overlay is 20% black,
  button is rectangular 160×50, sentence case, heading has normal tracking.
  Preserve routes, film dialog, keyboard links and reduced-motion vertical reading.
  Validation: forward/reverse checkpoints, responsive resize, section-aligned
  external screenshots at all three viewports, technical release gates. Captures
  and measured computed styles initially reside in /tmp/home-audit; durable task
  report will record retained evidence and unresolved differences.

Responsive verification additionally exposed a second travel-layout bug: the
map-stage height includes the stacked cards, but the implementation positioned
those cards at its top and drove them with desktop translations. At tablet and
mobile the cards belong after the actual image height (917.86/466.09px), with
32/48px statistics and a 385px information card. Measure the image independently
from the composite stage when deriving parallax. Keep the intro heading nowrap;
the global heading wrap override must not split it during the column wipe.

### Last Continent → Our Season boundary — 2026-09-08

Focused correction requested by user: remove the apparent horizontal white line
below the Last Continent quote. Live target uses the image's white upper sky
without a dark overlay. Local `.season__scrim` darkens that white from its first
pixel (15% at media top, about 18% at the cropped section edge), producing a
255→211 RGB step. Disabling only that overlay removes the discontinuity.

Keep image, crop, DOM, section geometry, copy and motion unchanged. Make the
scrim transparent through 25% of its height, meet the previous gradient at 50%
(alpha .385), then retain its previous lower-half interpolation to alpha .62.
This preserves existing lower copy contrast while exposing the white upper sky.
No new asset or dependency. Verify decoded-image boundary pixels at forward,
fractional and reverse positions, all three required viewports and both motion
preferences (maximum per-channel boundary jump 5/255). Record live reference
and before/after images independently from stored full-site visual baselines.

## 2026-09-09 HOME mobile scroll correction

Scope: HOME only, existing authorized client rebuild. ADELVA copy, approved
navigation, support scene and footer remain authoritative. This is a focused
motion repair; no route discovery expansion, asset acquisition or publication.
Live reference evidence: `artifacts/home-mobile-motion-2026-09-09/` contains
independent `reference-{390,768,1440}-samples.json`, refined entry samples and
390px state rasters. CSS viewport/raster mapping is 1:1 at DPR 1; 390×844,
768×1024, 1440×900. Content differences require section-relative framing.

### Measured motion contract (before implementation)

| Layer             | Reference and implementation requirement                                                                                                                                                                                                                                                                                                                | Tolerance                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Hero wrapper      | Direct y = clamp(local scroll, 0, 2×rendered hero viewport height), in CSS pixels. Current scrollY/innerHeight followed by svh output drifts when browser chrome changes innerHeight independently of svh. Content y=-0.3×clamped scroll. Existing clouds, blur and mist retain their measured functions.                                               | 1px at static and changed visual viewport heights                                   |
| Purpose paragraph | Linear mask parameter -40→100, from paragraph top at 80% viewport to bottom at 60%. Reference gradient alpha stops 1/.9/.8/.6/.4/.2/.1 at parameter +0/5/10/20/30/35/40. Direct scrub, reversible, no duration/lag. This request supersedes the earlier static-mask exception for normal motion; reduce, forced colors and no-JS remain fully readable. | 1 percentage point; compare by paragraph bounds, not replaced-copy document offsets |
| Longform entry    | Clip left/right 10%→0% while longform top travels from viewport bottom to top, linear and reversible. Existing longform DOM owns clip; no extra section wrapper.                                                                                                                                                                                        | 0.1 percentage point                                                                |
| Camp title entry  | At mobile, 60→32px while section top enters from bottom to top. At tablet/desktop, 140→90px. Then 32→24px mobile, 90→60px others over the existing lead-in×5/7. Implement equivalent scale on base font, centered, preserving bilingual copy.                                                                                                           | effective type size 0.2px                                                           |
| Camp description  | y = clamp((4/7 - 15/14×localScroll/renderedViewportHeight), -.5, 1)×renderedViewportHeight. Current clamp of localScroll at 0 makes the text enter too early before pin.                                                                                                                                                                                | 1px                                                                                 |
| Camps pin         | Preserve independent pin reserves 4450/6340/8550 and horizontal endpoints 1560/2520/4200 at reviewed sizes. Measure sticky element's rendered height for progress rather than dynamic innerHeight. Existing hold and three-strip wipe remain.                                                                                                           | track x 2px; strip widths .002                                                      |

ADELVA copy may change wrapping/height. It does not authorize changing the
scroll functions or making all title sizes a shared desktop shrink ratio.
Keep semantic content, film controls, keyboard navigation, reduced motion and
all seven direct page-content children. CSS native states remain CSS; existing
useGSAP/ScrollTrigger manage scoped lifecycle and revert on preference change.
Cache fixed descendant references outside scroll callbacks and avoid React state
updates during scroll. No new dependencies or production assets.

Second mist hypothesis was disproved for visible frames: the target's second
plane is already fully rotated before it enters the viewport. Preserve the
existing static visible divider; adding a new visible rotation would reduce
fidelity. The approved ADELVA header and existing flyout are separate shell
contracts; retain them and record their visible difference.

Acceptance: compare start/mid/end/reverse by section-relative positions at all
three viewports, independent target numeric measurements and unmasked diagnostic
rasters. ADELVA copy, approved shell/support/footer, video phase and photographic
encoding are excluded from motion metrics but remain visible in screenshots.
No global pixel-equality claim. Run existing technical and fidelity gates and
report their actual status; baseline currently has five format failures, six
lint warnings and an undefined MENU_GEOMETRY in a pre-existing shell test.

Static fallback check: the 90px tablet title is enabled only after HOME's
readiness marker and under normal motion. Without JS or under reduced motion,
keep the existing fluid 48px tablet fit so ADELVA's longer heading stays readable.
The animated measured sizes and tolerances above are unchanged.
