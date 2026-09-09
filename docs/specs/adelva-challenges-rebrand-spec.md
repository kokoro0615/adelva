# ADELVA challenges — 2026-09-09

## Scope and authority

User requests shared HOME menu, first-slide-only ADELVA copy, wholly generated
Aman-like monumental HERO imagery, and working photo movement in HOW/WHY.
Workflow: image-to-code scoped rebrand + imagegen + systematic debugging.
Copy authority: references/adelva/sources/home-copy.md. Existing lower content,
16 category rows, destinations/fragment IDs, quotes, footer and consent remain.
No publishing. Existing unrelated worktree changes are preserved.

## Composition before implementation

- Shared SiteHeader rendered as a sibling of .ns-page, outside its broad text,
  button and image resets. HOME and challenges share exactly the same component,
  breakpoints, interactions and tokens; no duplicate header/menu or local fork.
- HERO remains 100svh at 1440x900, 768x1024 and 390x844. Replace the fifteen
  source projects with a coherent five-image original landscape sequence:
  mountains/cloud sea, coastal cliffs, desert, cedar forest/lake, alpine snow.
- Original generated 1672x941 raster images inspected, landscape object-fit cover.
  Mobile object-position protects the architecture; first image at 75% center,
  coast at 38% center, others central. No additional UI mock is needed for this
  unchanged section geometry and already directed asset replacement.
- First slide only: ADELVA + HOSPITALITY MANAGEMENT PARTNER and approved H1
  経営判断を、現場で動く仕組みと成果へ。 Text is HTML, no baked copy. Lower-left
  inset 48px desktop, 32px tablet, 24px phone; bottom 96px desktop/phone keeps
  copy separate from 44px accessible playback controls. Heading 48/40/24px,
  approximately 1.5 line height. No invented project links on decorative images.
- Other four slides have no caption or linked overlay. Keep six-second automatic
  advance, manual previous/next and global pause; manual selection pauses HERO
  only. Scope fix details and external measurements: motion report.
- Existing below-HERO keyvisual becomes a non-heading wrapper to preserve one H1.
  Reference typography/row geometry stays intact in this phase.
- First image eager/high priority; others lazy/low priority, local WebP source
  variants at 840 and original 1672 width. No hotlinks or copied Aman photography.
- Keyboard operation/focus, no horizontal overflow, target WCAG 2.2 AA,
  reduced-motion fallback and explicit playback retained. Motion tests cover
  both sections before and after manual hero selection.

## Verification contract

Three viewports: initial HERO, all slides and crops, shared menu open/close and
Escape/focus return, both photo sections normal/paused/reduced. Compare menu to
HOME as independent component authority; compare preserved row geometry/goldens
and motion to NOSIGNER separately from authored regression. New HERO direction
intentionally replaces source photography and copy, so old HERO pixel goldens
must be migrated only after inspection. Run format, lint, typecheck, unit,
Playwright/axe/visual and production build; record unrelated existing failures.

## User revision — persistent copy and autonomous HERO

Latest request supersedes first-slide-only copy and visible HERO controls.
Render one persistent copy/H1 above the image stack, visible through every
six-second image change. Remove HERO arrow/play/progress UI and hover-based
carousel suspension so the common pointer-over-HERO state still advances.
Pause in background/offscreen and honor reduced motion; retain an explicit
page motion setting as a plain footer text button, outside the HERO. Preserve
all five approved images and their responsive crops. Validate automatic cycling
while hovered, persistent heading on every slide, no HERO controls, system
preference and footer pause. Investigate category fidelity separately against
live normal-motion source; prior reduced-motion snapshots are insufficient.

### Category correction following live normal-motion measurement

The source slider's `data-speed=50` converts to 2000/50 = 40 CSS px/sec.
Use 40px/sec, not 50. Preserve all16 photo-row dimensions, image aspect ratios,
alternating directions, hover80% scrim and local pause. Remove opaque `.ns-heading`
and `.ns-why .ns-heading` backgrounds and inherit the animated surface's ink.
WHY initially remains light while HOW's trailing boundary is still visible;
only after that boundary exits the100px observer margin does it change to dark.
Both section headings must remain transparent through the change. The existing
shared HOME header remains intentional; the ambient renderer is an authored
approximation, not claimed identical to the source shader.

### Additional user revision — remove cookie notice

Remove the full cookie notice and both consent buttons, including all display
state, localStorage reads/writes and obsolete notice CSS. Verify first load and
reload without seeded storage: no notice/buttons and no consent-storage writes.
This revision does not alter third-party links or add tracking behavior.

## User revision — ADELVA identity and eight service photo bands

Authority: current user's five-part request supersedes the sixteen source categories,
source keyvisual identity, chapter labels and floating CTA. Mode B, scoped to
/challenges. Keep the existing hero, shared header, pause control, section anchors,
news and quotes. Reuse approved navigation descriptions; no source project promises
remain in the eight revised bands. Use the existing ADELVA subtitle HOSPITALITY
MANAGEMENT PARTNER. Canonical ADELVA service/contact destinations match navigation;
those detail routes are still pending in this repository.

Before implementation: keyvisual becomes a centered ADELVA typographic mark on the
existing animated field, with three fine orbital ellipses suggesting connected
support domains. Reduce the prior empty 100svh interval to a self-contained 72svh
brand chapter (minimum 480px desktop, 420px mobile). Mark size 112px desktop,
80px tablet, 52px phone; subtitle 12/11/9px. All text remains semantic HTML.
Background field changes from neon cyan/purple to muted teal, mineral blue and
champagne; slower continuous motion, existing WebGL cleanup, pause and reduced
motion preserved. Ellipses are static decoration, no additional animation clock.

HOW becomes 課題から探す with five bands in requested order. WHY becomes
3つの支援領域 with three bands. Remove upper-left promise headings entirely; the
lower-left category is the sole h3, 28px desktop / 20px phone, with approved
navigation description shown on focus/hover and touch. Preserve existing band
height clamp(300px,23.4375vw,450px), mobile 257px and 40px/sec alternating photo
movement. One original generated photo per band, rendered at viewport width (minimum 500px)
and object-fit cover, repeated for continuous motion;
1536x1024 source requested landscape, responsive local WebP 768/1536 widths.
Dark lower gradient guarantees white category contrast. Images decorative (alt=""),
lazy loaded, dimensions specified; central composition protects mobile crops.

Existing source screenshots remain independent references for unchanged geometry
and behavior. Brand chapter, imagery, typography and 8-band count intentionally
replace the external design and must not be assessed by old pixel goldens. Inspect
all eight bands and keyvisual at 1440x900, 768x1024,390x844 against this spec and
original generated assets. Preserve regression separately; obsolete source 16-band
assertions must migrate to this explicit request. Run format/lint/typecheck/unit,
production build and route Playwright/axe/motion/visual. No deployment authorized.

## Corrective investigation — multiple small photos, not panoramic bands

Latest user correction explicitly rejects the one-photo-per-band interpretation.
Scope: read-only observation of https://nosigner.com/ja/ HOW/WHY photo strips at
1440x900,768x1024,390x844; adapt only the eight ADELVA bands. No crawl, no source
media redistribution, no submissions. Preserve original requested ADELVA labels,
five/three taxonomy, removed upper-left titles and consultation CTA. Research
owner is the primary agent. Image-to-code owns implementation; clone-website
supplies measured reference evidence; systematic-debugging traces the regression.

Confirmed code cause before further edits: bandImage returns a one-item array,
and the final .ns-strip-group img rule sets width:max(100vw,500px). Four cloned
groups therefore repeat one viewport-wide photo; cloning is not content variety.
Earlier height/speed tests checked 40px/s and band height but did not detect
unique-image count or tile width. Inspect the live reference before specifying
replacement tiles and add tests for this exact visual failure.

### Live evidence and corrective specification (before code)

Source captures and DOM/motion observations: references/nosigner/tile-study-2026-09-09/.
At 1440/768/390, band heights are exactly 337.5/300/257px. HOW images use
object-fit:contain, height:100%, width:auto, 1px black borders and zero gaps;
first two rows contain 9 and 6 distinct images (duplicated in the real track).
HOW native aspect ratios vary, including portrait and landscape; WHY photos are
square. Actual sampled horizontal velocities are approximately +/-40px/s at all
three viewports, linear and alternating left/right; data-speed="50" is not the
rendered pixels-per-second value. Source direction begins left in both chapters.
The target can show less than two whole HOW images on mobile; do not force a
miniature grid or claim multiple complete photos fit 390px at this band height.

Implementation: each of eight ADELVA bands has four distinct photographs (32 total),
24 newly generated plus 8 previously generated. Four is a deliberate bounded
ADELVA adaptation, not a claim to match source photo counts of 4–39 per row.
HOW mixes square, landscape and portrait, ordered to expose a second image at
390px in the initial frame. WHY uses four square cells. Existing landscape assets
in WHY receive a CSS square crop; newly generated WHY assets are natively square.
No contact sheet is used as a production image. Export each new photo separately
as local 400/800px WebP; inspect actual dimensions before writing metadata.

Retain four identical presentation groups, aria-hidden decorative photos, one
semantic heading/link per band, 40px/s linear translation by exactly one group's
measured width. Group copies must have identical order, dimensions and spacing.
Use ResizeObserver for recalibration, preserve pause on hover/focus and global
pause/reduced motion. Retain 5/3 labels, descriptions, links and header behavior.
Do not alter hero or brand chapter during this correction.

Acceptance thresholds fixed before implementation: band height within 1px of
live source; HOW width equals intrinsic aspect ratio at band height within 2px;
WHY cells square within 1px; 1px image border, adjacent tile gap <=1px; all rows
have >=4 unique image URLs per source group and at least two distinct cells
intersect a 1440px viewport. Speed within 1px/s of 40 with the correct sign;
loop reset must reproduce identical visible pixels, including resize and pause.
All images load at all three viewports, no horizontal overflow. External fidelity
is measured by the source-derived geometry/motion contract and juxtaposed source
and actual captures; pixel matching different generated subjects is inapplicable.
Keep authored screenshot regression separate. Run route Playwright/axe/visual,
unit, format/lint/typecheck/build and report existing unrelated failures.

## Typography, centered bands and original statements — 2026-09-09

Latest user correction authorizes typography refinement, all eight band text blocks
centered in both axes, and replacement of the Evolution Thinking quotation with
ADELVA language. Scoped Mode D correction using existing reference geometry; no
new layout concept, imagery or routing. Existing navigation, 5/3 taxonomy, links,
hero, 40px/s motion, pause/focus/reduced states and imagery remain invariants.

Reference mapping: tile-study-2026-09-09/{1440,768,390}-row-0.png are native
1425x338,753x300,375x257 strip crops of 1440x900,768x1024,390x844 viewports;
scaleX=scaleY=1 (15px scrollbar gutter, cropped section framing, rounded raster
height). All three inspected at original detail. Source band width is the full
content viewport, height 337.5/300/257px. Local desktop already measures
1425x337.5: no arbitrary container narrowing. Retain heights and full width;
verify all three within 1px. Photo subjects, eight-band count and new centered
text deliberately differ from NOSIGNER under current user requirements.

Typography diagnosis: page body uses a source-only Zen subset at weight700;
ADELVA titles use a navigation-only Noto subset, while descriptions inherit Zen.
Quote uses Times New Roman with system Japanese fallback. Unify route text with
one local OFL Noto Sans JP variable subset containing every rendered page glyph,
including new statements. Dedicated face avoids changing unrelated HOME/header.
Keep source display font only for unchanged source identity assets. Use normal
Japanese spacing (disable inherited palt), no faux bold, weight400 body and
weight500 headings. All text is selectable HTML.

Bands: retain li > a > text group, make link grid place-items:center; text group
width:min(100%,960px), centered flex column and text-align:center, 12px gap.
Both title and explanation stay visible in every state so their combined visible
bounds remain centered (<=1px horizontal/vertical error). Desktop titles32px,
tablet28px, mobile22px; line-height1.55, tracking.04em. Explanation14px/1.9,
mobile13px; max measure44em, balanced Japanese wrapping. Padding24px desktop,
20px mobile. Minimum uniform black scrim60% ensures white small-text contrast,
hover/focus retains existing80% feedback. No animated text transform or new JS.
Chapter titles use the same family, 36/30/26px and1.5 line-height,24/16px gutter.

Copy rationale from references/adelva/sources/home-copy.md sections1,5:
ADELVA connects management decisions, operations, brand and digital support into
one improvement plan, then hands over a process clients can keep improving.
The nature/form quote does not explain that role. Author two original statements,
not an adaptation attributed to Tachikawa or a fictitious published work:

- Opening: 経営と現場の課題を、一つの改善計画へ。 / ホテル・旅館の経営・運営、収益・ブランド、DX・IT・調達を横断し、 / 担当範囲を明確に、実行・運用から検証・引継ぎまで支援します。
- Closing: ともにつくるのは、支援の先も続く力。 / 判断し、実行し、確かめる。 / 改善が続く仕組みを、宿の中に。
  Signature is ADELVA plus existing HOSPITALITY MANAGEMENT PARTNER. No invented
  outcomes, clients, statistics or third-party attribution. Statement lead28/24/22px,
  body20/18/16px, line-height2, max-width960px; mobile phrases wrap naturally.
  Retain chapter heights, ambient locking and heading hierarchy.

Acceptance: all text glyphs supplied by local webfont, no system fallback in band
or statement CDP font inventory; no overflow at required viewports or200% zoom;
center bounds<=1px in default/hover/focus; all8 bands source width/height<=1px.
Capture all8 bands and both statements at3 viewports. Compare external geometry
separately from authored regression; old left-aligned category goldens must be
reviewed and migrated for this explicit revision. Run all configured relevant
gates; record pre-existing unrelated failures without masking them.

### Brand section correction — live measurements, current request

Read-only source: https://nosigner.com/ja/, single page, three viewports. Evidence:
references/nosigner/brand-study-2026-09-09/measurements.json and native viewport
screenshots (1 CSS px = 1 raster px). The live reference's mark is 328x52 at
1440/768 and 176x28 at390, with24/16px subtitle gap. Its chapter is full-width;
desktop/tablet top=2 viewport heights, chapter height=24dvh, canvas width800px,
bottom8px, text bottom padding min(140px,16vh). Mobile chapter starts after HERO,
is100svh, with a bottom-aligned square canvas and14vh (max120px) bottom padding.
These measurements supersede the earlier72svh/orbit design, which was not faithful.
Restore reference section geometry, clamp canvas to available width at tablet to
avoid source overflow. Remove authored orbital decoration. ADELVA uses original
HTML lettering in licensed Noto Sans JP bold, approximately328/176px wide,
normal spacing and a compact12/9px subtitle (longer approved ADELVA subtitle
intentionally wider than the reference's shorter wording). Do not stretch glyphs.
Acceptance: section and canvas geometry within1px of the above, brand width within
5% of328/176px, center error<=1px. Actual ink height differs with ADELVA's letters.
Existing header, hero and band motion remain unchanged. Original statements and
centered bands follow the preceding specification; no new images or third-party
quotation attribution. Noto subset source is the existing licensed full variable
font in the adjacent ADELVA project's source assets; output is dedicated to this
route. Capture before/after fonts using CDP to prove fallback removal.

### User addition — bilingual chapter headings

Reuse HOME's exact pairings: Your Challenges / 課題から探す and Our Expertise /
3つの支援領域. English display uses HOME's already authorized Cardinal Classic
Long regular font, Japanese uses dedicated Noto. One semantic h2 per chapter,
English span lang=en and Japanese span lang=ja; preserve existing h2 IDs and
section anchors. Center both axes in an open title field; English uppercase,
font-size clamp(38px,6.25vw,90px), line-height1.05, weight400, balanced wrapping.
Japanese14px/1.6, tracking.08em,16px separation. Heading minimum height180px
PC/tablet and120px mobile; 24/16px gutters, existing80/60px gap before photos.
No opaque panel, new effects, or animation: inherit the existing ambient ink.
Existing reference chapter labels are intentionally replaced by user-selected
HOME typography. Capture both headings at all3 viewports and test bilingual
names, centering, no clipping and light/dark transitions.

### User addition — use HOME fonts throughout challenges

Latest instruction supersedes the dedicated route font face. Reuse HOME's actual
font roles: Cardinal Classic Long for English display/headings, Oswald for ADELVA
wordmarks, Inter Tight for English utility/subtitle text, ADELVA Navigation Sans
(Noto Sans JP) for Japanese content. Preserve chosen sizes, responsive hierarchy
and centered bands. Remove NS Display, NS Japanese and Times New Roman from this
route's font declarations. Extend the existing shared Noto subset by union with
all current challenges characters; never remove any previously shipped glyph.
This improves glyph coverage without changing HOME/header glyph outlines/weights.
Delete the task-created dedicated font as superseded. Use source metadata and
existing shared licenses; no new typeface/download or global font-size changes.
Reverify HOME menu/hero and challenges font inventory after the shared-file update.

### Opening statement: business-copy correction — 2026-09-09

The user questions the business basis of the opening statement. The prior
research did cite PRODUCT.md and home-copy.md, but its poetic paraphrase omitted
the concrete three-domain scope, unified improvement plan and delivery/handover
responsibility. This revision supersedes only the opening wording above.

- Lead: 経営と現場の課題を、一つの改善計画へ。
- Body: ホテル・旅館の経営・運営、収益・ブランド、DX・IT・調達を横断し、 / 担当範囲を明確に、実行・運用から検証・引継ぎまで支援します。
- Signature: ADELVA / HOSPITALITY MANAGEMENT PARTNER. This English descriptor
  is already present in the supplied home-copy.md HERO, not a new translation.

Authority: references/adelva/sources/PRODUCT.md Positioning, Operating Context,
Brand Commitments; home-copy.md sections 1, 4, 5. New wording is an authored
source-derived summary, not a verbatim approved quotation or proven outcome.
Keep existing statement markup, typography, motion, closing statement and other
sections. Verify all glyphs use the existing local font and that the longer
copy fits at 1440x900, 768x1024, 390x844. No new raster assets or deployment.
