# ADELVA audience V3 implementation

## Authority and scope

User request 2026-09-09: implement Figma `ChpQzLAbKeC3HORU2TILlz` nodes
189:65 (owners desktop), 189:358 (owners mobile), 189:669 (GM desktop),
189:870 (GM mobile), 189:1174 (motion score), 195:98 (review decisions).
Production owner: image-to-code Mode C, supported by Figma design-to-code,
React performance and motion implementation guidance. No subagents, generation,
Figma writes, deployment or form submission. Preserve the existing dirty tree.

## Reference mapping

| Reference in references/adelva/audience-v3 | Raster / CSS full page | scaleX / scaleY | Viewport   |
| ------------------------------------------ | ---------------------- | --------------- | ---------- |
| owners-desktop.png                         | 1440 × 4660            | 1 / 1           | 1440 × 900 |
| owners-mobile.png                          | 390 × 6891             | 1 / 1           | 390 × 844  |
| gm-desktop.png                             | 1440 × 4556            | 1 / 1           | 1440 × 900 |
| gm-mobile.png                              | 390 × 7705             | 1 / 1           | 390 × 844  |

Full page, scroll zero, no browser chrome. Original detail inspected. Tablet has
no approved Figma raster: 768 × 1024 is checked against the responsive rules below,
not a stretched reference. Source `.txt` files retain the exact design-context
measurements and approved copy. A diagnostic external reference comparator already
exists; project strict audit passes 20/20 before production edits.

## Functional invariants and DOM

Create `/challenges/owner` and `/challenges/general-managers`. Preserve the existing
plural owners navigation URL through a redirect. Separate these routes from the
legacy expedition layout so that there is one header/main/footer. Reuse navigation
data, brand assets, local Noto Sans JP / Oswald fonts and existing motion dependencies.
One accessible Japanese H1 per page; semantic sections/H2, link lists, support
mapping lists, role definitions, ordered six-step process, footer navigation.
Challenge links navigate to the corresponding support row and work without JS.
Canonical global destinations remain unchanged, including currently pending
`/contact`, `/services`, `/approach`, `/cases`. Do not invent form handling.

## Measured geometry

| Page   | Section heights at 1440                             | Section heights at 390                                      |
| ------ | --------------------------------------------------- | ----------------------------------------------------------- |
| Owners | 865 / 519 / 569 / 676 / 396 / 340 / 424 / 278 / 593 | 780 / 680 / 780 / 1500 / 730 / 901 / 580 / 940              |
| GM     | 915 / 467 / 453 / 737 / 275 / 417 / 571 / 286 / 435 | 780 / 901 / 799 / 1799 incl. dining / 901 / 914 / 660 / 951 |

Owners desktop gutter 56–60px; GM 69–74px. Desktop owner hero H1 (56,237),
64/80 serif; CTA (56,475), 280×62; monument (54,566), 200/204 then 72/76.
GM H1 (72,217), 64/80; message gap 20; CTA (72,481), 280×62;
monument (67,554), 178/170, tracking -3.6226. Mobile outer gutters 20–29px;
hero 24px, CTA 342×56. Owner H1 32px, three lines; GM 34/46, two lines.
Owner challenge grid 2 columns on desktop, 4 rows mobile. GM challenge 2-column
intro/list desktop, single-column mobile. Photos reserve exact section dimensions.
Owners background plate is the existing text-free composite used by Figma; match
its section crops and offsets rather than substitute different photographs.

## Typography and surfaces

Noto Serif JP 400/500/600 for Japanese editorial headings; Noto Sans JP for body.
League Gothic for owner monuments and GM mobile hero, Oswald Bold for GM desktop.
Use measured family distinctions despite the older v2 unification proposal.
Desktop H2 generally 52/64–66; mobile 28–38/40–48. Desktop body 18–22/26–34;
mobile 14–18/22–28. Preserve Figma desktop/mobile line breaks without raster text.
Ink #1f2a44, paper #fff, ice #f1efea, flare #ff7e15, flare ink #b04a08,
muted #586078, line #c9c8c2. Mobile gradient #072a3e→#0c2436 and
#f3f0ea→#f5f2ed are authoritative in these latest frames.

## Responsive behavior

Desktop composition at >=1100px, proportionate gutters and grid tracks; exact
reference geometry at 1440. Below 1100 use the mobile information order with
fluid content widths, capped readable text measures and full-bleed photographs.
At 768 provide larger gutters/heading sizes, preserve semantic order, allow natural
height growth, no stretched desktop. At 390 match the supplied mobile sections.
At narrow widths/zoom allow content growth rather than clip text or horizontal scroll.

## Motion, states, accessibility and performance

Figma score is the authority: hero image 1.03→1 in 720ms editorial
cubic-bezier(.16,1,.3,1); monument 420ms +160ms; all body/CTA visible immediately.
Rules enter 260ms cubic-bezier(.2,0,0,1), 40ms stagger <=160ms. Decision photo
420ms clip on desktop, opacity 160ms mobile. Desktop photographic parallax <=3%,
none mobile; panorama scale 1.03→1; six-step decorative rail follows scroll.
One scoped GSAP/useGSAP owner, matchMedia cleanup, no pinning/scroll hijack/replay.
CSS hover/focus/active only; arrow +4px on fine-pointer hover, keyboard focus 2px
with offset, focus settles animations. Reduced motion: static transforms/clips,
full rails, no hidden content. Navigation disclosure immediate geometry, 160ms
opacity, Escape closes and restores focus. No fake business progress on the rail.

Use local exact photo assets optimized to WebP, picture art direction, hero high
priority and lower imagery lazy, reserved image bounds. OFL Noto Serif JP subset
and League Gothic WOFF2; preserve license notices. Photography provenance:
existing user-commissioned fictional hotel assets in the supplied Figma and local
mock records; never claims client projects. Asset map and manifests retain sources.

## Intentional deviations and acceptance thresholds

Correct Figma code's incorrectly inherited oversized CTA fonts to match the
actual Figma raster (18px main action) and avoid clipped text. Real links/buttons
replace painted controls. Accessibility may require a bounded reading scrim.
Reference line-break/content agreement is required; desktop/mobile section starts
and major image bounds <=4px, text anchors <=4px, font size <=1px; anti-aliasing
and lossy photo RGB error are diagnostic, not a substitute for geometry.
Tablet requires review against this spec, never automatic reference approval.
Capture each route at all three viewports with loaded fonts/images, reduced motion
and owned server; compare original-reference overlay/difference and record
remaining defects separately from implementation regression. Run format, lint,
typecheck, unit, Playwright, axe, reference comparison and production build;
report pre-existing failures rather than treating unavailable gates as passed.

## Authorized photographic and shared-shell correction — 2026-09-10

User supersedes V3's photographs, bespoke audience navigation/footer and the owner
panorama between roles and execution. Mode C with these explicit deviations;
no subagents. Preserve the two URLs, all main-body approved copy, issue anchors,
role cross-links, six-step sequence and reduced-motion contract.

Confirmed image defect: the owner composite is 724×2172 displayed as 1440×4320;
GM corridor/dining were extracted from a 795×1978 composite. Enlarged small
photo regions cannot recover native detail. Replace every audience body photo
with an individually generated original, natural editorial hotel photograph;
Aman.com is a photographic mood reference only, not an asset/copy source.
Use separate photo elements instead of the multi-section composite. No fake 4K
claim: verify actual tool output, do not upscale delivered assets. Landscape
masters must cover their 1440px/900px slots without natural-dimension enlargement.
Keep source PNGs and generate responsive WebP variants; hero eager, lower images
lazy, aspect-ratio/slot bounds reserved. Actual generation metadata governs.

Reuse SiteHeader and HomeFooter directly, outside the audience CSS scope, so
HOME typography, fixed compact header, desktop menus, mobile drawer, footer art,
links and top control remain identical. HOME's shared footer artwork is preserved
under the explicit same-HOME requirement; the seven new photos replace audience
body imagery, with two additional native portrait compositions selected below 600px.
No copied/rebuilt header/footer. Header heights/breakpoint are owned
by the existing component (desktop >=1024), not the former audience header.

Remove the owner 340px desktop panorama from the DOM. Roles now immediately
precedes execution; mobile already hid the panorama. Preserve remaining main
section heights and heading anchors at 1440/390. Owner light bands use native CSS
paper; challenge inset uses a separate corridor photo (desktop 390×487 approx),
decision photo left 56.5%×569px, support uses a detailed stone/water photo behind
a strong left reading scrim. Hero 865px owner/915px GM desktop, 780px mobile.
Execution keeps reserved photo slots and a bounded desktop reading scrim;
mobile text stays on opaque fields. Keep 768 rules and test 320px reflow.

Final visual gates: compare preserved body geometry with original Figma except
removed panorama/footer; compare header/footer with live HOME at all three
viewports in matching compact/menu/scroll states. New photographic composition
is user-authorized; old RGB equality is no longer the acceptance criterion.
Verify source-to-display sampling and all network image requests, loaded fonts,
no horizontal overflow, keyboard menus, anchors, back-to-top, reduced motion,
axe and repository gates. Record current repository blockers separately.
