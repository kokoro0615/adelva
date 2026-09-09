# MORGHT HOME /about implementation specification

## Authority and invariants

2026-09-09, authorized source https://morght.com/, one HOME → /about,
image-to-code Mode C. User approved exact identity, copy and media. This document
owns the scoped decision; unrelated HOME, /challenges and /about/[topic] remain
unchanged. /about had no page. Use its own header, main, footer and menu through
existing RouteShell. Preserve the ADELVA navigation entry pointing to /about.
Source links to unimplemented pages remain explicit https://morght.com links;
Home points to /about. No forms or credentials are collected. Metadata is local,
Japanese content uses lang=ja, robots noindex for this authorized local replica.

## Reference mapping and framing

Original references: references/morght/{1440,768,390}-top.png,
*-section-{0..6}.png, *-full.png, *-menu.png and _-circle-_.png.
Browser: Chromium, DPR 1, default Japanese daytime theme. Raster and CSS pixels
are 1:1, scaleX=scaleY=1. Top rasters are 1440×900, 768×1024, 390×844.
Full-page rasters retain viewport width and document height, not viewport height.
All screenshot assets are research-only. Full-page native captures are overview
only: sticky circle cannot be reviewed from the apparent blank pinned interval;
dedicated start/mid/end/reverse samples are authoritative for that sequence.
Live clock and continuously moving carousel require phase normalization, only
after readiness. Shadow is fixed to viewport and uses the observed source image.

## Measured geometry (CSS px at 1440 / 768 / 390)

| Landmark        | 1440     | 768      | 390     | tolerance |
| --------------- | -------- | -------- | ------- | --------- |
| document height | 12133    | 10968    | 9544    | 8px       |
| hero height     | 1008.77  | 622.95   | 603.92  | 2px       |
| Mission top     | 1178.77  | 792.95   | 739.11  | 3px       |
| Service top     | 1892.45  | 1592.86  | 1375.11 | 5px       |
| Career top      | 3446.61  | 2787.97  | 2627.41 | 6px       |
| News top        | 7521.47  | 7212.59  | 5768.38 | 6px       |
| Company top     | 8857.97  | 8501.50  | 7106.33 | 8px       |
| Footer top      | 11145.05 | 10089.92 | 8378.95 | 8px       |

Content root: main; direct sequence exactly six sections: intro, mission,
service, career, news, company. Footer belongs to shell. Hero has logo field
and carousel; mission has heading, lettering figure and copy/CTA; service has
product figure plus text/photo split; career contains pinned circle and text;
news has heading, six-item list, CTA; company has lead photograph, text/photo row,
then two photographs. Preserve nested counts and semantic order. Each uses
stable data-section and data-motion attributes for independent capture.

## Layout and typography

Source root rem: 16px between 768 and 1439; 16×width/1440 above; 16×width/375 below 768. Main horizontal gutters 60/1440 desktop, 20/375 mobile. 1024 switches hero
logo from 707/1320 to 726/1320 of inner width and menu body from 1180/1440 to
767/1440. Headings 36px/1, tracking .04em desktop, 27px/1 .03em mobile using
locally served TTCommonsProMedium. Body 16px/1.95 .05em desktop, 14px/1.95 mobile,
weight 500 and palt. Final CDP platform-font inspection disproved the initial
fallback assumption: source Japanese text renders Zen Kaku Gothic New Medium.
The 32 HOME-used Google Fonts WOFF2 subsets (295,500 bytes) are now served locally;
the original SIL OFL 1.1 license is retained with them. English regular labels use
TTCommonsProRegular; headline 27px/.95
desktop, 19px/.9 mobile. Black #202020, yellow #fcd440, orange #ea6900.

Hero wordmark x60 y52 w726 h198.77 at desktop, mobile x20/375 viewport y75rem/16.
Symbol starts 100px below wordmark desktop / 142 mobile; desktop width112/1440,
mobile70/375. Right-aligned two-line tagline shares symbol baseline. Carousel
margin36 desktop/20 mobile; height510/1440×width desktop/182/375 mobile. Column
widths 24,37.6,24,36.8,24,37.6,24,27.7,24,37.6,36.8 vw desktop and
32.2,51.2,32.2,50,32.2,51.2,32.2,37.8,32.2,51.2,50 mobile; 1vw / 1.4vw insets.
Photographs use original slight ±1–3° rotation, rounded20px corners.

Mission outer top gap170/130, heading at213/1440 or20/375; handwritten artwork
650/1440 wide at186/1440, then body400/1440 wide at827/1440. On mobile artwork
13/375 gutters, body40/375. Service uses 400/1440 product figure at60/1440;
next row left400/1167, right660/1167, right raised118px; title top178px.
Mobile stack product→copy→portrait, with 80px gaps. Service imagery 30px desktop
and20px mobile radius, decorations preserve source overhangs.

Career track350lvh desktop,300lvh mobile,300lvh above1680. Sticky stage100lvh.
Circle initial diameter min(.4×width,height), terminal diameter hypot(width,height).
Separate crop and inner-image scales: quadratic in-out vs quadratic out.
Progress interval is track height minus viewport; ring fades once crop easing
exceeds .17. No horizontal travel. Copy below has200px/120px top padding and
240px/160px bottom. Career headline684/1440 or268/375 width.

News grid3 columns desktop/2 mobile, gutters60/1320 or20/335, row gap80/60,
six observed articles dated 2026-08-21 through2026-09-07. Company lead figure
starts520/1440 or104/375; second row reversed on desktop and normal mobile;
third row reversed desktop, staggered mobile. Footer paper darker, round40px
page bottom overlaps footer40px. Footer two link columns, address, clock,
social links, privacy, copyright and large wordmark.

## State, motion, accessibility and performance

Marketing introduction delight; circle expansion explains continuity from an
individual to the team. Measured source motion wins over generic timing presets.
Carousel travels right at viewportWidth/500 per33ms, pauses offscreen; expose a
keyboard-accessible pause control without altering default framing. Reduced
motion keeps all content visible, freezes carousel/ring and uses a static full
image instead of a long sticky animation. Native dialog provides focus trapping,
Escape, background inertness and return focus. Menu circle expansion .9s with
(.47,.16,.24,1), body fade .6s/.2s; keyboard/reduced opens immediately. Hover CTAs
join yellow pill and circle, .5s (.43,.05,.17,1). Touch does not require hover.
SVG line draws replay only where observed, decorative and aria-hidden. Handwritten
artwork has exact matching real HTML text, hidden visually and exposed to assistive
technology. Text integrity and keyboard support override source accessibility
defects. Increase invisible hit areas to24px; darken small faint metadata where
necessary for AA, recording intentional pixel deltas. Pause stops ambient motion.

Use server page/static content with one scoped client interaction owner, refs for
transient animation values, passive listeners and cleanup; no React scroll renders.
Supporting Vercel React best practices informs these boundaries. Existing native
browser/CSS APIs suffice; no added dependency or target JS/tracker shipped.
Media list and rights: references/morght/asset-manifest.json. Local original WebP
photography, transparent decoration PNG, selective inline SVG, two WOFF2 fonts.
Reserve intrinsic size, eager visible hero, lazy below-fold media, async decode.

## Acceptance

Verified accessibility adaptation: desktop header links are 24px high rather
than the source's 15.5px targets at21.5px pitch. The first text baseline is kept;
subsequent labels move by at most10px to avoid overlapping click targets. Menu
secondary links also use24px targets with adjusted gaps. This small shell-only
divergence is required by WCAG2.2AA target-size; source defaults fail axe.

Shared reference/actual section geometry logic, all six sections and one shell,
three viewports plus menu and circle samples; document tolerance above, image
and text box tolerance2px, circle diameter3px. Pixel MAE <=.025 and changed pixel
ratio <=.08 (threshold .1) for normalized top and section states; photo carousel,
clock, rotating ring are compared at a controlled shared phase. No changing
thresholds to conceal failures. Missing artifacts or incomplete motion evidence
fail the gate. Full-page comparison follows structural completeness. Existing
implementation goldens are regression only, never MORGHT reference acceptance.
Baseline typecheck fails at tests/e2e/global-shell-clone.spec.ts:356 undefined
MENU_GEOMETRY before these production edits. Release remains open until all
required current-build gates and external fidelity are satisfied.
