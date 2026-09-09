# ADELVA site revision — implementation specification

Authority: current user's seven instructions, 2026-09-10. Owner: primary thread;
no delegation. Contact uses clone-website / image-to-code Mode C; existing UI
uses focused refinement and technical repair. No new raster assets needed.

## Reference and capture mapping

Source: https://morght.com/contact, observed read-only 2026-09-10. No submission.
Original captures: references/morght/contact/reference-{1440,768,390}.png;
computed DOM evidence: observations.json in the same directory. Full page rasters
are respectively 1440×3319, 768×3237, 390×3368, viewport heights 900/1024/844.
DPR=1; scaleX=scaleY=1 (full document height, not viewport height, on Y).
Loaded fonts, settled entrance, no cursor. Entire page inspected at original detail.

## Authority and invariants

- Shared HOME header on all requested pages; preserve keyboard, Escape, focus
  restoration, body scroll lock, theme adaptation, remaining mega menus.
- Remove cases navigation; About is one link to /about. Do not delete legacy
  /about/[topic] routes or unrelated content. Footer company destinations also
  resolve to /about; no obsolete fragment-only destinations.
- Remove challenges news and NOSIGNER footer; reuse HomeFooter component exactly.
  Preserve challenge bands, carousels, pause control, motion preferences.
- Preserve HOME seven top-level children, photographic approach geometry/path,
  hero film controls, existing generated assets, CTA and other sections.
- User's Japanese paragraphs remain verbatim, split only at sentence boundaries.
- /contact is new: no existing delivery endpoint or ADELVA privacy policy exists.
  Never use MORGHT's endpoint or the legacy White Desert policy. User explicitly limits this task to UI only; validate locally, visibly state
  that nothing is sent, do not issue a request or simulate success.

## Contact measured geometry (CSS px)

| Landmark              | 1440      | 768           | 390          | Tolerance |
| --------------------- | --------- | ------------- | ------------ | --------- |
| Main outer gutter     | 60        | 32            | 20.8         | 2px       |
| Heading top           | 367       | 367           | 171.6        | 8px       |
| Heading height        | 169.5     | 169.5         | 106.2        | 10px      |
| Intro left / width    | 520 / 707 | 277.3 / 377.1 | 20.8 / 348.4 | 3px       |
| Intro top             | 737.5     | 737.5         | 380.7        | 12px      |
| First field label top | 906.1     | 933.4         | 590          | 22px      |
| Field height          | 61.1      | 61.1          | 70.6         | 3px       |
| Textarea height       | 315.1     | 315.1         | 413.7        | 3px       |

Desktop/tablet content uses 36.1111vw left and 49.0972vw width. Below 768px,
full width within 5.3333vw gutters and stacked name inputs. Field labels 14px,
1.65 leading; 16px input text is an accessibility/mobile zoom adaptation.
Japanese heading 60px desktop, 31.2px mobile; English 18px/15px, existing locally
licensed MORGHT/Zen Kaku fonts where available. Warm #f6f5f1 ground (confirm
computed RGB in fidelity pass), rounded 10px fields, 40px inter-field gaps,
80px form lead-in, yellow segmented pill submit. Preserve existing HOME header
and ADELVA footer as explicit identity exceptions. Background ambience recreated
in CSS; no remote images, fonts, trackers, or scripts. Stronger borders,
placeholder contrast and focus rings intentionally meet WCAG 2.2 AA.

Use main > title section > form section, h1, native labels/select/inputs/textarea,
fieldset/legend for name, visible required markers, autocomplete, inline errors
with aria-describedby, validation error focus, pending/success/error announcements.
Never animate input values. Native form can be completed with keyboard. CSS-only
hover/focus transitions (180ms existing state ease), reduced-motion no translation.

## Existing UI measurements / corrections

Header mark was 22/24/26px and wordmark 15px at all sizes. Use 32/38/44px
mark and 21/26/30px wordmark, proportional optical mask, 12–16px gap. Desktop
bar 88px, compact 72px; mobile 68px. Keep contact/menu hit targets >=44px.

Purpose: two semantic sentence spans. At >=1024px exactly two visual lines,
font up to 25px fitting the longer second sentence; width up to 1320px. Smaller
screens use readable >=20px flowing sentences. Never shrink all copy to fit a
390px two-line box. Founder statement: four exact sentence paragraphs, 22px
at desktop /18px mobile, 1.95 line height, 1em paragraph gap, max 42em,
left-aligned text within centered composition; auto height for longer flow.

## Motion diagnosis and specification

Baseline live / at owned dev port 3002: data-motion=active, SVG progress advances
and reverses, no page errors. H2 transform always `none`; summary has no animation.
Unlike other sections, approach has no reveal markers/tweens. Path first node
begins 22% down scene and initial base stroke at 50% already resembles finished
path. This is missing entrance choreography / weak state separation, not a
proven global GSAP failure. Smooth scrolling must settle before sample reads.

Use existing scoped useGSAP/matchMedia: heading children y=36/opacity=0 ->0/1,
scroll top 88% to top 45%, linear scrub, slight stagger; summary similarly
reveals as it enters. No background-only parallax (it would break image/SVG
registration). Preserve reading-line cursor, forward/reverse path and six stages;
add each label's text translate 12px ->0 with 300ms ease-out on reached state;
all labels stay readable, base path reduced only under active motion. Reduced
motion/JS-off displays all content and complete path; cleanup restores styles.

## Verification

Run format, lint, typecheck, unit, fresh build, then production Playwright, axe,
local visual regression and external contact geometry comparison separately.
All four requested routes at 1440×900, 768×1024, 390×844. Cover menu open/close,
About direct navigation, contact default/invalid/consent/error, approach start,
mid,end,reverse and live preference switch. External comparison uses identical
DOM detectors for heading, form/select/textarea; metrics + overlays are separate
from implementation goldens. Predeclared geometry tolerances above; pixels are
diagnostic due to authorized ADELVA identity, accessible controls and copy.

Deploy only after current checks, through the user-confirmed Git project. Existing
clonetest has no remote; neighboring adelva worktree is dirty and must not be
modified or reset. Preserve recoverable deployment history.

User follow-up: `kokoro0615/adelva` confirmed; reuse of adjacent ADELVA resources
authorized. Browser Vercel Git settings independently confirm that repository is
already connected. GitHub currently empty; this will be its initial push.
