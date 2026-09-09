# ADELVA HOME footer implementation specification

Integration finding: the inherited fixed utility obstructed the mobile contact
circle. During footer intersection its closed trigger is compacted to 44×44px
at bottom 16px / right 76px. Opening, Escape, name and focus restoration persist;
full dialog and other-route behavior are unchanged. Tablet content-driven final
height is ~1224px; its 40px gutters / stacked groups remain as specified.

2026-09-09. Mode C. User approves the desktop/mobile mockups and explicitly
replaces HOME's legacy footer. Follow-up requires the existing HOME fonts.
Image-to-code owns production; imagegen supplies clean background plates;
React performance and verification skills support implementation. No deployment.

## Reference mapping

References are complete footer sections, not single viewport screenshots.
Both were inspected at original detail before implementation.

| Width | Reference raster                     | Section CSS size        | scaleX / scaleY     | Framing                                 |
| ----- | ------------------------------------ | ----------------------- | ------------------- | --------------------------------------- |
| 1440  | home-footer-desktop.png, 1435 × 1096 | 1440 × 1099.82          | 0.996528 / 0.996528 | `/`, footer origin, full element        |
| 390   | home-footer-mobile.png, 747 × 2106   | 390 × 1099.52           | 1.915385 / 1.915385 | `/`, footer origin, full element        |
| 768   | no supplied raster                   | content-driven, ~1000px | n/a                 | review against responsive specification |

Paths: `references/adelva/mockups/home-footer-2026-09-09/`.
Capture actual browser viewports 1440×900, 768×1024, 390×844 and full footer
elements separately. The footer may exceed a viewport; never stretch to 900/844.

## Authority and invariants

| Region                    | Authority                                                       | Rule                                                                                       |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Composition and landscape | approved two mockups                                            | preserve sunset, crop, hierarchy and near-black fade                                       |
| Copy and destinations     | `src/content/adelva-navigation.ts`, approved HOME contact title | preserve verbatim, no generated claims                                                     |
| Fonts                     | latest user instruction, existing HOME                          | Oswald headings, ADELVA Navigation Sans (Noto Sans JP) Japanese, Inter Tight brand text    |
| Legacy HOME footer        | explicit replacement request                                    | remove its travel directories, newsletter, film, awards and legal composition on HOME only |
| Other routes              | existing implementation                                         | legacy footer and challenges shell unchanged                                               |
| Main HOME                 | existing implementation                                         | all seven direct children, ten stage identities, motion, forms and metadata unchanged      |

The new footer contains no data mutation, subscription or form. Canonical
`/contact`, audience, service and about links retain the header's pending-route
metadata; this request does not implement those pending destinations. Existing
film and utility UI remain available elsewhere. Preserve the shared header,
utility dialog keyboard operation, inert management and page scroll owner.

## Measured geometry

| Landmark             | Desktop reference px → CSS                | Mobile reference px → CSS              | Tolerance              |
| -------------------- | ----------------------------------------- | -------------------------------------- | ---------------------- |
| Divider gutters      | 47 → 47.2                                 | 47 → 24.5                              | ±4px                   |
| Text left            | 90 → 90.3                                 | 59 → 30.8                              | ±5px                   |
| Heading ink top      | 207 → 207.7                               | 547 → 285.6                            | ±8px                   |
| Heading second line  | 307 → 308.1                               | 638 → 333.1                            | ±8px                   |
| Contact Japanese top | 409 → 410.4                               | 750 → 391.6                            | ±8px                   |
| Contact circle       | 1217,289,143 → 1221,290,143.5             | 566,654,133 → 295.5,341.4,69.4         | ±8px                   |
| Main rule y          | 512 → 513.8                               | 853 → 445.3                            | ±5px                   |
| Directory headings y | 561 → 563                                 | 922/1169/1482 → 481.4/610.3/773.7      | ±8px                   |
| Directory columns x  | 92/534/966 → 92.3/535.9/969.4             | 59 → 30.8, all stacked                 | ±6px                   |
| Wordmark ink bounds  | 63,793,1294,180 → 63.2,795.8,1298.5,180.6 | 52,1819,644,99 → 27.1,949.6,336.2,51.7 | ±10px / font width ±4% |
| Bottom rule y        | 1006 → 1009.5                             | 1958 → 1022.2                          | ±6px                   |
| Section bottom       | 1096 → 1099.8                             | 2106 → 1099.5                          | ±12px                  |

## Typography and surfaces

| Role              | Family / weight           | Desktop                    | Mobile                     | Wrapping                       |
| ----------------- | ------------------------- | -------------------------- | -------------------------- | ------------------------------ |
| Contact h2        | existing Oswald 300       | ~94px/1.07, tracking .10em | ~46px/1.10, tracking .07em | two explicit lines             |
| Contact Japanese  | existing Noto Sans JP 400 | 30px/1.5, .08em            | 20px/1.5, .06em            | one line                       |
| Directory heading | existing Noto Sans JP 400 | 21px/1.5                   | 16px/1.5                   | natural                        |
| Directory link    | existing Noto Sans JP 400 | 22px/1.95                  | 16px/2.1                   | one line at 390, natural below |
| Wordmark          | existing Inter Tight 500  | fitted single line, ~248px | ~70px                      | never clip                     |
| Micro brand       | existing Inter Tight 500  | 14px, .3em                 | 9px, .3em                  | one line                       |

Surface #050908; main ink #f4ecdf, body #ece9e3, muted #a29f98, rules
#8b8982, orange #ff8a2b. No cards, rounded containers or shadows. Circle is a
fine outlined link; arrows are authored SVG, decorative. Background plate has
no baked UI. Scoped footer stacking covers underlying grid lines as in the mock.

## Responsive behavior

≥1024: three directory columns, proportional geometry with rem readability
floors; full-width landscape. <600: independent portrait image and stacked
groups, natural content height, 24.5px rules /31px text gutters at 390. 600–1023:
same stacked hierarchy with 40px gutters, heading 64px, photograph lead-in
~280px, 18px directory text, tighter vertical rhythm than enlarged mobile.
All content visible. At 320px and 200% text size allow natural wraps and footer
growth; fidelity heights apply only at default font size. No overflow clipping.

## DOM, state, motion, accessibility and performance

- One HOME `footer`, lang=ja, accessible label ADELVA, data-site-footer and
  data-fidelity-landmark=footer. h2 contact title (lang=en), nav with three named
  groups and lists. One accessible contact anchor; decorative arrow hidden.
- Server-rendered content passed through a small pathname selection boundary.
  Plain anchors for existing pending destinations; no prefetch of missing pages.
  Brand is real selectable text. Back-to-top targets the existing main landmark.
- Hover changes ink/arrow translation over 180ms; focus-visible uses an immediate
  2px orange outline with 5px clearance. Active returns translation. No custom
  visited state. No loading/empty/error/disabled state for this static footer.
- Reduced motion disables transitions/transforms. No entrance animation, pinning,
  timers, scroll interception or new GSAP owner. Visible without JavaScript.
- Main interactive hit areas ≥24px (contact/back-to-top ≥44px); keyboard follows
  visual order. Verify focus and no fixed utility collision at each viewport.
- Decorative picture empty alt; desktop/mobile source via picture, lazy decoding,
  explicit dimensions and fixed background plane. Optimized WebP, no preload.
  Reuse local fonts, no new dependency. Background full frame has reserved geometry.

## Assets and intentional deviations

Background source plates will live in `assets/source/generated/adelva/home-footer/`;
optimized variants in `public/media/adelva/home-footer/`. Source is built-in
imagegen text-removal edits of the approved generated mockups; user-approved
generated artwork, no third-party location/ownership claim. Record exact prompt,
actual dimensions, output and file size in the task report. Raster is decorative.

User-mandated shared fonts override generated glyph shapes. Inpainting can vary
the forest under removed letters, but must preserve the visible horizon and
upper photograph. Muted labels may be raised to meet contrast. Tablet is a
specification-based review, not an approved external raster. Existing fixed
header/utility chrome is outside the isolated mock, retained in viewport evidence.

## Capture and acceptance

Own a fresh server port and record PID/build identity. Wait for fonts/images,
use reduced motion, hide caret and development chrome, scroll to footer start.
Full element capture hides only fixed header/utility chrome, never footer content.
Viewport evidence retains that UI. Repeat with keyboard, hover, normal motion,
320px and enlarged text. No new navigation destination is fabricated.

Run repository `scripts/fidelity/compare-reference.mjs` with explicit reference
and actual for desktop/mobile; retain overlay, amplified diff, metrics. Global
photo MAE is diagnostic. Same raster bright-ink/horizontal-rule detectors for
reference and actual gate the bounds above; no detector based only on DOM.
Inspect reference, actual, overlay and difference at original detail. Fix
unexplained discrepancies; typography differences remain explicit under the
font instruction. Tablet requires user visual review before any golden adoption.

Run format, lint, typecheck, unit, Playwright, axe, visual regression and build.
Legacy White Desert HOME snapshots are separate superseded references, not new
goldens; report their mismatch without silently updating. Gate E remains open
until technical gates and user visual review are resolved.
