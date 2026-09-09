# /about ADELVA identity revision — 2026-09-09

Mode B, focused revision of the existing approved composition. User requests:
ADELVA wordmark and existing monogram, unchanged animation, HOME's actual shared
navigation replacing the Morght header/clock/tagline, ADELVA circular lettering,
and a newly generated, centered landscape. Latest feedback rejects artificial
alpine symmetry, then rejects the subdued fjord for lacking Aman-like grandeur.
The current direction is a sunlit coastal headland and restrained infinity pool,
with natural geology, water, exposure and atmosphere.

## Authority / reference mapping

- Identity: existing `public/brand/adelva-logo.png` and HOME Oswald wordmark.
- Navigation: existing `SiteHeader`, `adelva-navigation.ts`, no copied fork.
- Circular copy: approved `references/adelva/sources/home-copy.md` HERO eyebrow:
  `HOSPITALITY MANAGEMENT PARTNER`. Use `ADELVA — HOSPITALITY MANAGEMENT PARTNER —`.
  PRODUCT.md establishes hotel/ryokan management implementation, not hotel ownership.
- Layout: previous independent `references/morght/final/{1440,768,390}.json/png`,
  natural pixels equal CSS pixels (scaleX=scaleY=1), route HOME mapped to /about.
  Changed identity/header/image regions are intentionally excluded from literal
  Morght pixel parity; unaffected section geometry and circle timing remain gated.
- Image: original fictional coastal retreat, not a claim about an Aman/ADELVA property.
  Aman official site and user-linked The Spirit of Aman are atmosphere research,
  not shipped artwork. Video observations 12/28/49s are valid; later seeks had
  readyState=1 and are not visual evidence.

## Geometry, type, responsive behavior

Hero keeps its 726×198.77 desktop / proportional mobile wordmark field, replacing
letterforms with an SVG text wordmark using the existing HOME Oswald font.
The existing outline drawing and fade timeline target the new letters.
Original 112px desktop / 72.8px mobile symbol field keeps its square footprint;
the authorized ADELVA monogram is optically centered using HOME's existing mask.
Remove top clock and English tagline, not lower-page section headings/body copy.
Place the HOME navigation outside the page's scoped reset to preserve all labels,
mega menus, mobile disclosures, focus treatment and existing route states.
Reserve an additional 72px before the wordmark at desktop/tablet, 24px at mobile
so the fixed HOME bar never overlaps the hero. Whole downstream flow shifts by
that declared offset only. Unchanged widths/heights tolerance 2px; starts 3px.
Scope the original rem-based fluid sizing to a page-local --mg-rem unit so the
shared HOME bar always retains HOME's root sizing at all three viewports.

Circle: retain 350lvh/300lvh track, .4w initial diameter, viewport diagonal final
diameter, quadratic-in-out crop, quadratic-out inner scale, 12s ring rotation,
fade threshold, interruption/reverse, pause/reduced motion. Native SVG textPath
replaces the original outlined ring lettering. Diameter samples tolerance 3px.
Landscape has centered focal x50%; bounded vertical focal compensation during
expansion keeps the ridge visible without exposing a blank edge. This does not
alter the circle's geometry, duration, easing or pin distance. Reduced motion
retains a static full viewport image with object-position 50% 25%.

## Invariants / boundaries

Keep all six sections, original carousel photographs, lower text/news and footer
content; a complete ADELVA editorial rewrite is not requested by this revision.
Do not invent company facts or recast Morght testimonials as ADELVA facts.
Retain /about#role, #stance, #company; use #main-content/data-site-footer and
data-skip-link to cooperate with shared navigation's inert management.
Main and footer become inert for a modal drawer; keyboard Escape/return work.
Metadata identifies ADELVA about, retains local noindex. HOME and other routes
are untouched. Old Morght header code is removed, not CSS-hidden.

## Assets / performance / acceptance

### Circle image quality investigation — 2026-09-09

Measured source: 1254×1254. At 1440×900 the preserved diagonal expansion renders
1698.109 CSS px, requiring 3396.219 image pixels at DPR 2. This is a 2.708×
linear upscale; the CSS has no blur filter. Existing quality-90 WebP also differs
from the PNG (8-bit RGB RMSE 3.164, maximum channel error 49).
The scoped mitigation replaces only the delivery asset with a lossless WebP,
preserving original RGB pixels, intrinsic dimensions, lazy/async loading, circle
geometry, focal compensation and all motion. Use a new URL to avoid stale caches.
No extra React state, runtime dependency, sharpening or synthetic resize.
The new generation requested 4096×4096 but returned 1254×1254; reject it as a
resolution fix. Native detail at DPR 2 remains a blocked acceptance criterion,
not solved by lossless encoding or by resampling to a larger file.
Check decoded pixel equality and all three required viewports at DPR 2, as well
as the existing animation/menu/axe tests. Future replacement must meet measured
maximum rendered diameter × DPR without changing approved composition/motion.

Use built-in imagegen, original retained in project assets/source/generated/adelva.
Deliver WebP without upscaling the observed 1254px source, width/height reserved,
lazy image loading; no new runtime package or third-party image hotlink.
Asset records and exact generation prompts: references/adelva/about-2026-09-09/.
Generate only the requested landscape, no unnecessary UI mocks.

Capture 1440×900 / 768×1024 / 390×844 top, menu, circle start/mid/end/reverse.
Compare shared header regions with HOME and unchanged body/circle bounds with
the external reference. Review all generated landscape crops at original detail.
Run formatting/lint/typecheck/unit/browser/axe/build gates, keeping the previous
unrelated MENU_GEOMETRY failure explicit. Do not label development checks as
production-build verification or new goldens as external-reference fidelity.

## Carousel playback correction — 2026-09-09

Scoped Mode D bug fix: reference https://morght.com/, local /about, existing
client authorization and ADELVA identity remain authoritative. One image strip,
three required viewports, normal/reduced/pause/resume states; no new assets,
routes, copy changes outside the playback control, generation or deployment.
Normal playback reproduced at approximately 87px/s at 1440px. Under reduced
motion the strip stops but the control incorrectly says Pause motion; toggling
Play motion cannot restart it because the frame loop unconditionally rejects
reduced motion. This is a reproduced defect, not confirmation of the reporting
user's OS setting.

Keep default reduced-motion stills and circle fallback. Reflect effective strip
playback in the existing button and keep it visible while stopped and on touch.
An explicit Play motion action may enable only carousel translation under reduce;
APNG, introduction and circle remain reduced. A media-preference change clears
that explicit override. Pause/resume must retain phase, rightward speed remains
viewportWidth/16.5 per second, wrapping and offscreen suspension are preserved.
Use the existing frame loop and refs, no per-frame React updates or dependencies.
Keep carousel geometry, 16 photographs, asset provenance, all six sections,
shared navigation and links. Test actual displacement, pause, explicit reduced
playback and renewed preference changes at 1440x900, 768x1024 and 390x844.

## About editorial replacement — 2026-09-09

User supersedes old six-section/carousel/copy/footer invariants. Mode B, bounded
existing composition update: centered ADELVA, remove lower-left symbol, generate
all 16 carousel assets, replace Mission/copy and remove View more, reuse HOME
signature, remove NELL service and News onward, add Company info and HOME footer.
Preserve circle landscape/geometry, #role/#stance/#company, shared navigation,
carousel phase/speed/pause/reduced override, metadata and all other routes.
Career recruitment prose is removed with obsolete Morght editorial content.

References: `references/adelva/about-refresh-2026-09-09/company-reference-{1440,768,390}.png`
are CSS-pixel screenshots at 1440x900, 768x1024, 390x844; scaleX=scaleY=1.
Framing: Company info h2 top at y=0 ±1px. Source https://morght.com/company.
Measured title x=60/32/20.797, title font 52/52/44.72px, line-height 1.1.
DL x=520.016/277.344/41.594; width=859.984/458.656/306.813.
Desktop title-to-DL gap=60px; mobile photo lies between title and list.
Authoritative: gutters, table columns, dashed row rules, section rhythm.
Intentional changes: ADELVA facts only, original generated hotel in photo slot,
HOME font for English title, shared HOME footer outside Morght reset. Different
row count, content height, header and photo are excluded from literal pixel parity.
Aman screenshot is atmospheric research only; no transferred images or copy.

Implementation: semantic h1, mission h2 and paragraph group, decorative signature
with accessible printed name, circle section #stance, h2 Company info and dl,
shared HomeFooter. Center hero field using auto margins at width 50.4167vw on
1440, 64vw tablet, 89.3333vw mobile; retain outline entry. Reserve navigation
clearance; no orphan symbol animation selectors. Carousel retains 11 columns,
16 slots, pair/single proportions and rotations; all images 3:2 original fictional
landscape/architecture, no deco overlays. Intrinsic dimensions, async decode,
responsive WebP delivery; no claim these are client properties.
Mission: headline left and 600px max body right on desktop; stack on mobile,
16px minimum body, 2.1 line height, 24px paragraph gap. Copy grounded in PRODUCT.md:
宿の価値を、未来へつなぐ。Describe owners, workers and guests, obstacles between
management and operations, integrated implementation/verification/handover.
No new statistics, legal identity, address or unverified founder title.
Signature reuses FounderSignature unchanged (1.65s path duration plus pen lifts,
linear, top 75% trigger, reverse on exit above, reduced-motion static complete).
Company rows initially use verified brand, audience, three service domains and
implementation stance; formal corporate fields remain absent pending user data.

Predeclared acceptance: hero center ±1px each viewport; no symbol/NELL/News/View
more/Morght copy in main; 16 distinct generated loaded carousel assets; no overflow;
company title and DL x/width versus external reference ±2px. Typography differs
intentionally to share HOME tokens. Footer must reuse component, not a copy;
compare HOME/footer appearance at same local framing. Test signature initial,
drawn, reverse and reduced; carousel normal/pause/reduced override; circle
initial/end/reverse; keyboard modal inert including footer and axe. Run format,
lint, typecheck, unit, affected Playwright/axe, visual evidence and build; preserve
unrelated dirty work and report pre-existing failures without weakening gates.

## About copy grounding correction — 2026-09-09

User challenges the editorial grounding. Copy-only correction of #role, no visual
redesign. Previous prose cited PRODUCT and HOME but added an unsupported central
mission of travel memory/cultural inheritance and underweighted responsibility,
execution and post-engagement self-sufficiency. Source ledger for replacement:

- Heading: verbatim approved home-copy.md HERO statement.
- Opening purpose and audience: PRODUCT Positioning/Users and HOME Approach.
- Concrete symptoms: information-architecture §2.1 and content-taxonomy services
  01/02/03/06/12/17 (interdependent operations, sales, implementation/ownership).
- Three domain names: exact approved names, no scope expansion.
- Delivery and end state: HOME Approach responsibility/KPI/continued improvement;
  do not promise measured results, universal full outsourcing or qualifications.
  Retain four semantic paragraphs, signature, #role and h2 id, all image/motion/footer
  behavior. Allow existing title to wrap naturally after its first clause. Verify
  body/title clipping at 1440x900, 768x1024, 390x844, plus existing About browser tests.

## Founder signature and company facts — 2026-09-10

The `kokoro nakagawa` signature now sits directly below the approved heading
`経営判断を、現場で動く仕組みと成果へ。`. It is the second element in the
left purpose lead on desktop and remains directly below the heading on mobile.
The existing drawing trigger, pen sequence and reduced-motion behavior are
unchanged.

Company info now uses the user-supplied legal facts exactly: ADELVA 合同会社;
2026年07月28日; 100万円; 中川　心; 〒666-0145 兵庫県川西市けやき坂2-67-6.
The previous brand/service/support rows are removed from that table. No other
section, image, footer or route changes.
