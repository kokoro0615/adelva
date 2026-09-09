# ADELVA Who We Support — implementation specification

2026-09-09. Mode C: user-approved supplied section mock; implementation is scoped
to HOME's `our-season` stage. Production owner: image-to-code. Imagegen prepares
the text-free photograph; animate/GSAP guidance supports the existing stack.

## Reference mapping and authority

Approved reference: `references/adelva/mockups/who-we-support-2026-09-09/who-we-support-desktop.png`,
1448×1086 raster. This is a complete 4:3 section, not a 900px viewport screenshot.
At 1440 CSS px the complete reference section is 1080px high:
scaleX = 1448/1440 = 1.005556; scaleY = 1086/1080 = 1.005556.
Capture a full section separately from the required 1440×900 viewport frame.
Framing is HOME `/`, section-relative origin (0,0), settled text, reduced motion,
loaded fonts and image. Global header/fixed utility chrome is outside the mock;
hide those only in the isolated comparison, retain them in viewport evidence.

The approved photo, English/Japanese heading hierarchy, introduction, two equal
audience entrances and orange arrows are authoritative. Copy comes from the
approved conversation/prompt and existing `adelva-navigation.ts` audience records,
not OCR. Full-raster text must be replaced with selectable HTML. Generated glyph
shapes are not fonts. Use the existing Oswald and ADELVA Japanese font assets.

## Measured geometry (desktop)

| Landmark                     | Reference pixels                    | CSS pixels at 1440 | Tolerance                  |
| ---------------------------- | ----------------------------------- | ------------------ | -------------------------- |
| Section                      | 1448×1086                           | 1440×1080          | height ±32px               |
| Left/right content gutter    | 94                                  | 93.5               | ±10px                      |
| English ink top              | 470                                 | 467.4              | ±20px                      |
| English ink width/height     | approximately 662×69                | 658×69             | width ±10%, height ±12px   |
| Japanese ink top             | 566                                 | 562.9              | ±20px                      |
| Intro ink top                | 644                                 | 640.4              | ±24px                      |
| Intro                        | 3 lines, approximately 42px leading | 3 lines / 41.8px   | ±1 line for font variation |
| Audience rule top            | 803                                 | 798.6              | ±28px                      |
| Second audience left         | 775                                 | 770.7              | ±18px                      |
| Audience title ink top       | 842                                 | 837.3              | ±28px                      |
| Audience description ink top | 904                                 | 899                | ±28px                      |
| Bottom breathing room        | approximately 112                   | 111.4              | ±32px                      |

Use a section minimum height of 75vw (1080px at desktop), content-driven growth
for zoom, 6.5vw side gutters, approximately 31.4vw before the English heading,
7.5vw bottom padding. The two columns have a roughly 7vw gap. Typography: Oswald
300 at ~80px/1.15, tracking ~0.14em; Japanese subheading 32px/1.5; introduction
and audience descriptions 24px/1.75; audience titles 32px/1.5. Off-white text,
subtle white rules, existing orange accent. Tune within these declared bounds
to account for actual font metrics. No cards, extra claims or decorative badges.

## DOM, routes and invariants

- Keep HOME's seven direct children and all `data-fidelity-section` identities.
  Replace only the `our-season` section with a scoped `WhoWeSupport` component.
- Preserve the existing `season-heading` anchor and `.season` hook. Semantic h2
  contains English, Japanese language declared on the subtitle/body/link content.
- Introduction: 「ホテル・旅館の経営を担う方へ。日々の現場を動かす方へ。
  それぞれの立場から見える課題を整理し、経営と現場で共有できる改善計画につなげます。」
- Two audience links reuse the exact existing labels/descriptions/hrefs. They
  remain canonical `/challenges/owners` and `/challenges/general-managers` and
  retain the navigation's `data-route-status="pending"` convention. These pages
  are not implemented; this task does not create lower pages or redirect users
  to unrelated travel destinations.
- Remove only the superseded travel season body and four travel stats from this
  stage. Other copy, media, header, menus, film controls, founder signature, hero
  choreography, camp pin distances, globe movement and CTA destinations persist.
- The shorter approved section intentionally shifts later section document
  positions; their triggers derive from live DOM geometry. Do not restore stale
  Antarctica pixel coordinates by adding empty scroll space.

## Responsive composition

| Width    | Layout                                                                | Photograph and spacing                                                                                                     |
| -------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ≥1024    | Two equal audience columns, intro 3 authored phrases                  | Full 4:3 photograph; reference metrics above                                                                               |
| 600–1023 | Two equal columns, natural Japanese wrapping, heading ~54px           | Minimum 1024px at 768; left 48px/right 80px; ≥360px landscape lead-in                                                      |
| <600     | Audience links stack in source order; English wraps only if necessary | Left 24px/right 76px, ≥320px landscape lead-in, minimum 100svh with content-driven height; left-center crop preserves dawn |

The asymmetric small-screen right gutter reserves the existing 60px fixed
utility control, preventing it from obscuring audience text or arrows. This is
an accessibility-driven responsive deviation from the section-only mock.

Tablet/mobile have no separately approved raster. Their first renders are
reviewed against this explicit composition, not stretched desktop images or
falsely labelled external references. No further generation is needed for this
straightforward two-column to single-column decision. At 200% text zoom all
content grows without fixed-height clipping; at 320px width links remain usable.

## Motion and states

Source audit: HOME does not wrap its document in `MotionStage`; the old season's
`data-parallax`/`data-reveal` attributes alone had no live animation owner. Add
one scoped `useGSAP` owner to the new section. Do not wrap the full HOME in
MotionStage or alter other section timelines. Register ScrollTrigger inside
the client lifecycle, use scoped refs, matchMedia and revert on unmount/change.

- Purpose: spatial depth and ordered introduction on an occasional marketing visit.
- Landscape: scroll from `top bottom` to `bottom top`, direct scrub, yPercent
  -6→6 and scale 1.06→1 within a ±10% overscan frame; ease none. No pin or
  interception. Reverse follows the same progress; refresh on font/image
  readiness and resize. The text stays independent of the photograph.
- Heading/subtitle/intro: once when their content group reaches 88% viewport,
  y 28→0, opacity 0.2→1, 0.9s power3.out, stagger 0.1s. A direct load already
  at that group skips entrance. Content ships visible without JavaScript.
- Each link rule: scaleX 0→1 when that link reaches 90% viewport, 0.9s power3.out.
  Link text is always fully visible and operable. No animation delays navigation.
- Pointer hover only: arrow translates 5px in existing ~180ms CSS UI easing;
  keyboard focus is immediate with a visible off-white outline. Touch receives
  no persistent hover motion. Accessible name is the audience title, with body
  as its description. Decorative image and arrows have empty alt/aria-hidden.
- Reduced motion: no GSAP tweens/triggers or transforms; original 4:3 crop,
  completed rules, visible content; no hover translation. Preference changes
  revert live animation. No new loops, pointer tracking, shaders or video.

## Asset and performance

Background is a text-removal edit of the approved generated scene, created with
built-in subscription imagegen. Preserve source under `assets/source/generated/`;
serve an optimized WebP via the local asset registry/Next Image with `sizes="(max-aspect-ratio: 4/3) 160vh, 100vw"`,
explicit positioned fill container, lazy loading and empty alt. No third-party
video thumbnail or UI raster ships. Asset source/approval/dimensions/loading
must be recorded in `docs/asset-provenance.md`. No new package or font download.

## Acceptance and comparison

- Deterministic external-reference comparison uses the existing comparator with
  explicit `--reference` and `--actual` section files. Inspect actual, overlay
  and amplified diff; global photo metrics are diagnostic. Text-free inpainting,
  added contrast scrim, real font metrics and normal-motion crop are intentional
  differences. Preserve the original approved mock unchanged.
- Gate the declared section/gutter/type/rule geometry with the same raster
  white-text/rule detectors for reference and actual. Do not use separate DOM
  and raster detectors as proof of equal pixel bounds. Responsive checks are
  semantic/overflow/layout checks, not independent image-reference proof.
- Browser evidence at 1440×900, 768×1024, 390×844: normal/reduced, entry/mid/exit/
  reverse, hover/focus, preference change, resize, and keyboard link reachability.
  Background translation must change ≥20px (≥10px mobile), reverse return within
  3px, no blank background edges. Other HOME motion stays measurable.
- Run format, lint, typecheck, unit, scoped Playwright/axe, existing visual gate,
  explicit reference comparator and production build. Keep the already-recorded
  unrelated `MENU_GEOMETRY` type/build blocker visible if it persists. Do not
  weaken or skip a required gate to claim production release readiness.

## Font and vertical-rule correction — 2026-09-09

The user's follow-up explicitly preserves the site's shared vertical rules,
including over this photographic section. They supersede the mock's omission
of those lines. Keep the isolated section at automatic stack level below the
existing fixed `.grid-rules` (z-index 1); do not duplicate the rules or animate
them with the landscape. Background, scrim, copy and GSAP ownership stay intact.

CDP identified 20 system fallback glyphs in the introduction despite its correct
CSS family name. Extend the existing licensed Noto Sans JP subset with the
approved HOME content while preserving all 271 previously included codepoints.
The new subset has 304 codepoints and is 127,612 bytes. English headings continue
to use the shared Oswald family; Japanese text uses the same delivered Noto Sans
JP as navigation and the other HOME subtitles. Verify actual rendered glyphs,
not merely computed family names, at all three required viewports. Verify rules
by comparing a static sky strip with the shared overlay visible/hidden.
