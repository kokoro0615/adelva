# NOSIGNER HOME /challenges implementation specification

Reference owner: **NOSIGNER**. Source: https://nosigner.com/ja/ (observed 2026-09-09).
User confirmed permission for identity, text, fonts and HOME imagery. This is a local
HOME-only rebuild, not a new ADELVA content redesign. No other target pages are copied.

## Reference mapping

| viewport | retained reference                         | scale | framing                                                       |
| -------- | ------------------------------------------ | ----- | ------------------------------------------------------------- |
| 1440×900 | `references/nosigner/reference/1440-*.png` | 1     | Chromium, public Japanese HOME                                |
| 768×1024 | `references/nosigner/reference/768-*.png`  | 1     | Chromium tablet viewport                                      |
| 390×844  | `references/nosigner/reference/390-*.png`  | 1     | Chromium narrow viewport; source `.pageContainer` scroll root |

Initial mobile window-scroll captures are invalid below-fold references: mobile
uses .pageContainer as its scroll root. They must be removed after final captures.
Desktop/tablet content widths are viewport minus 15px stable scrollbar gutter;
mobile has the same reserved gutter. Hero deliberately spans 100vw but is clipped
at the content viewport. All final comparisons must normalize this consistently.

## Authority ledger

Source HTML, CSS and screenshots in references/nosigner are research evidence.
Measured typography, layout and approved copy are authoritative. Time-dependent
image indexes, gradients, shader noise and marquee offsets must be sampled at a
named time; they are not random layout changes. Existing routes and navigation
on other pages remain authoritative and unchanged. The /challenges route gets
its own NOSIGNER header/footer to satisfy the explicit full-HOME match request.
ADELVA's existing課題一覧 entry continues to point to /challenges. Its five
fragment links are retained as anchors to appropriate positions in the new page.

## Measured geometry

| landmark          | desktop CSS px       | tablet CSS px        | mobile CSS px          | tolerance |
| ----------------- | -------------------- | -------------------- | ---------------------- | --------- |
| hero              | 0..900               | 0..1024              | 0..844                 | 1px       |
| intro end         | 2016                 | 2293.75              | 1688                   | 2px       |
| HOW heading start | 2336                 | 2613.75              | 1888                   | 2px       |
| HOW first strip   | 2507.1875            | 2784.9375            | 2006.78125             | 3px       |
| strip height      | 337.5                | 300                  | 257                    | 1px       |
| HOW strip count   | 9                    | 9                    | 9                      | exact     |
| first quote       | 5544.6875..6444.6875 | 5484.9375..6508.9375 | 4319.78125..5163.78125 | 4px       |
| WHY heading       | 6644.6875            | 6708.9375            | 5323.78125             | 4px       |
| WHY first strip   | 6815.875             | 6880.125             | 5442.5625              | 4px       |
| WHY strip count   | 7                    | 7                    | 7                      | exact     |
| news start        | 9378.375             | 9180.125             | 7401.5625              | 5px       |
| news items        | 4, 2 columns         | 4, 2 columns         | 4, 1 column            | exact     |
| footer start      | 10566.75             | 10509.390625         | 8714.40625             | 8px       |
| footer height     | 936.5                | 1027.03125           | 1033.1875              | 8px       |

Reference landmarks in extract-{width}.json record raw independent observations.
Mobile scrollHeight belongs to .pageContainer (~9748px), not document (844px).

## DOM and topology

Route root: hero/intro section; HOW virtual grouping of category section plus
first quote; WHY section; news section; closing quote. The global shell is a
fixed logo, language disclosure, menu dialog, floating contact link, consent
panel and footer. Semantic route sections have stable data-ns-section IDs;
category rows are list items with links, not background-image-only controls.
Do not add unrelated marketing sections, figures, CTAs or testimonials.
Content data: src/content/nosigner/home.json extracted verbatim from approved HOME.

## Typography

| role             | family                  | weight | desktop/tablet | mobile | line-height   |
| ---------------- | ----------------------- | ------ | -------------- | ------ | ------------- |
| body             | Zen Kaku Gothic New     | 700    | 12px           | 12px   | 1.15          |
| HOW/WHY heading  | NOSIGNER                | 700    | 16px           | 8px    | 1.15          |
| section lead     | NOSIGNER, Zen           | 700    | 28px           | 20px   | 1.6 / 1.68    |
| strip promise    | Zen                     | 700    | 16px           | 12px   | 1.15          |
| strip label/body | Zen                     | 700    | 10px           | 10px   | 1.71429       |
| hero lead        | NOSIGNER                | 700    | 16px           | 8px    | 1.15          |
| hero title       | Zen                     | 700    | 24px           | 14px   | 1.4 / 1.54286 |
| quote            | serif Japanese fallback | 400    | 16px           | 14px   | 2             |

Fonts are local. Preserve palt and antialiasing. No text is baked into UI images.

## Surfaces and imagery

Hero images cover viewport at center, animated horizontal crop 70% → 30% over 6s;
25% black overlay. Fifteen images, first office image; 400ms opacity crossfade.
Strips retain each image's actual natural aspect ratio at full strip height,
1px black image edge, zero gap, 20% scrim desktop / 40% mobile. No cards or radii.
Display image groups twice for seamless loops (original target duplicates twice
within each real/decoy group; duplicates are presentational, not semantic items).
Background is black through hero/early intro, luminous blue/cyan diffuse field,
then pale noisy field for HOW, dark/light ambient field at quote/WHY positions.
Authored canvas recreates this decorative effect, not a raster screenshot.

## Responsive rules

767px breakpoint. Gutters 24px desktop, 26px tablet heading/news, 16px mobile.
Intro height after hero: 1.24svh desktop/tablet; 100svh mobile. Intro logo 328×52
or 176×28; original SVG. HOW top margin 320/200; section lead gap 28/16; strip
margin 80/60. WHY and news top gaps 200/160. Strip height clamp(300px,23.4375vw,450px)
or 257px mobile. Footer retains the measured responsive column arrangement.

## Motion / state / accessibility

- Hero: 6s dwell, 400ms crossfade; pause control and keyboard-accessible previous/
  next added for WCAG 2.2.2. Pause when offscreen/hidden. Reduced motion is static.
- Marquees: alternate direction at observed 50px/s; transform only, seamless,
  pause on focus/hover and global motion pause; reduced motion holds first group.
- Hover: scrim .2→.8 and body opacity 0→1, 400ms; 250ms return. Focus has same
  access. Mobile description accessible through link name; not hover-dependent.
- Ambient gradient: scroll-driven color transition, subtle noise; cleanup resize,
  scroll and animation resources. No interaction depends on canvas. Static
  reduced-motion equivalent; no copied target JS/tracking.
- Quotes: reveal when in view, preserve readable text without JS/reduced motion.
- Menu: modal with Escape, focus trap and focus return; scrollable mobile content.
  HOME anchor links stay local; other links retain original external destinations.
  Search restricted to visible HOME content (other target pages out of scope).
- Language selector: Japanese local; other language links point to source URLs
  and do not claim local translated pages.
- Consent stores only local preference; no analytics or third-party requests.
- Accessible h1/landmarks, focus rings, names and alt intent; no nested main.
  Ensure zoom/reflow, visible text contrast; record deliberate contrast changes.

## Assets and performance

references/nosigner/asset-manifest.json owns per-image provenance, natural size,
source, bytes, role and alt intent. Font manifest holds two locally served fonts.
Logo extracted as SVG from permitted source symbol. First hero eager; subsequent
hero and strips lazy, responsive browser sizing, explicit intrinsic dimensions.
The 183 unique HOME images have 735 original responsive files in the local registry;
not all candidates are requested by the browser. Strips use four inert decorative
copies to avoid empty edges during a complete loop.

## Acceptance thresholds

Predeclared before UI implementation: section/item/order exact; major geometry
within table tolerances; document height within 12px when matching shell; no
missing sections; image crop axes within 2px in normalized static states. Static
hero region normalized RGB MAE ≤0.02, changed pixels (channel delta >16) ≤3%,
excluding documented accessibility-only controls. Text anti-alias variation
≤2px. Decorative noise/ambient phase is compared separately by sampled color,
shape and motion; cannot assert literal pixel equality there. No silent masks.
All 3 viewport/state reference/actual/overlay/difference must be inspected.
Implementation screenshot regression is separate from external-reference fidelity.
Required: format, lint, typecheck, unit, build, Playwright, axe and fidelity.
Existing MENU_GEOMETRY undefined baseline failure must be addressed or explicitly
remain a release blocker; never suppress the check.

## Loaded-media correction (reference observation)

The initial desktop news measurement was taken before lazy images decoded. A
fresh source browser inspection at the news section proves currentSrc images
are 370×248 (not the placeholder attributes 1632×854). Therefore loaded news
height is 309.171875px and the footer begins at 10587.546875px; the implementation's
309.140625px/10587.515625px is within tolerance. This corrects reference readiness,
not acceptance thresholds. Tablet/mobile already match with their text-led rows.

Footer social controls are 51px desktop/tablet and 60px mobile; 3.1% horizontal /
12px vertical gap. Tablet conversions wrap at 142.8125px, total height 174.53125px.
Mobile conversion buttons total 131.6875px. These measured details correct the
first implementation, preserving the original 8px shell acceptance tolerance.

Intentional accessibility changes: background contrast behind the floating
contact link; static pause/previous/next carousel controls; stable chapter-specific text/background colors; Escape closes menu even
when the search field is populated; standard document scrolling on mobile.

## Final accessibility and menu decisions

Explicit pale HOW heading surfaces, dark WHY/news surfaces, quote surfaces and a surface-matched
introductory caption prevent offscreen text from depending on the fixed canvas's
current color. The floating contact action retains a dark translucent fill.
These differ from the source's variable-background treatment. Source mobile menu
inspection places its search and first navigation rows above the viewport even at
scrollTop 0; the local modal opens at the beginning and scrolls naturally so all
links remain reachable. This is an intentional accessibility repair, not a
pixel-identical menu state. Source search beyond HOME remains out of scope.

Regression goldens under `tests/nosigner/home.spec.ts-snapshots` are authored from
the implementation after initial external geometry/hero checks. They prevent
regression; they do not constitute external full-page fidelity approval.

Final reference capture waits 1.8 seconds after each scroll and a further 1.5
seconds for chapter/state captures. This allows the source's color transition and
text reveal to settle. Older 700ms captures could contain intermediate colors;
they are superseded, not treated as visual acceptance evidence. Grain phase still
varies because the original canvas runs continuously.

Settled theme verification supersedes earlier transient color interpretations:
`index-main` observes the HOW wrapper with a 100px top margin. The wrapper's
intersection selects light; outside it the theme is dark. Source color tweens
reach different intermediate values; paused local rendering resolves the final
state immediately. `theme-behavior.json` and `change-color-source.txt` retain
read-only observations. The production canvas is an approximation of the shape,
not the source WebGL implementation. The full fidelity gate remains blocked.

## Ambient correction specification — 2026-09-09

Supersedes the two-circle approximation and static chapter-background decisions
above for the decorative field only. ADELVA content, header and route geometry
remain unchanged. Reference: live HOME, Chromium with software WebGL enabled;
`references/nosigner/ambient-2026-09-09/reference-observations.json` records the sampled
uniforms. Canvas captures use 1 CSS px per screenshot px at 1440×900, 768×1024,
390×844 (desktop/tablet canvas width excludes the 15px scrollbar). Sample time
12s; scrolling uses .pageContainer on source mobile and window on local mobile.

The source uses one visible fullscreen background canvas. The intro container
exists but live observation finds no active intro canvas; do not add a speculative
second field. Source background has a centered, aspect-correct noise-distorted
radial envelope, with four colors mixed by 3D simplex fields at 1×, 5× and 2×
spatial frequencies. Time speed .296, dark organic speed .345, light .051.
Dark radius .624, blur .402, alpha .053, lightness (5,5); light radius/blur 2,
alpha 1, lightness (0,0). Grain subtracts 0..0.1 rather than overlaying gray tiles.
Scroll shifts UV by (sin(y*.0008), sin(y*.001))*.5. Citation visibility at 10%
blends that shift to zero over 1s power2.inOut, and reverses on exit.
HOW wrapper intersection with a 100px top root margin selects light; other
states select dark. Individual color/shape channels have distinct 4–860ms
transition timings; preserve interruption from current values. News, both quotes
and footer must show the same field without radial-gradient seams. Text colors
follow theme where necessary; test contrast in the light and dark settled states.

Implement a small local WebGL renderer without a new dependency or remote code.
Keep animation values out of React state. Cache DOM nodes; one rAF owner, max
30fps, DPR capped at 1.5; resize uniforms and framebuffer together. Stop time while
paused, reduced-motion or document hidden; resume without a time jump. Scroll and
resize still produce a static correct theme. Handle context loss/unavailable GPU
with an explicit legible CSS fallback. Release GPU resources/listeners on unmount.
Decorative canvas stays aria-hidden and pointer-events:none.

Acceptance: compare dark intro/news, light quote, closing lock and reverse states
at all three viewports at the same time/scroll/theme. Background-only comparison
must exclude neither color fields nor grain; diagnostic mean RGB error ≤0.08
and active-field centroid delta ≤8% of the short viewport dimension (allowing
backend noise precision). Preserve section bounds within existing tolerances.
Also prove live time evolution, pause/resume, reduced motion changes, reverse
scroll and resize; no WebGL/hydration errors. Existing full-page target gate stays
separate from this focused background gate and implementation regression goldens.

Capture correction: use a settled 4.5s source delay; 1.8s sometimes retains the
source background-color tween. GPU time is fixed at the uniform boundary at 12s
(the source's JS clock value is retained as observation metadata, not mistaken
for the injected GPU time). Preserve HDR values until after the grain pass.
An immediate jump from the first citation into the second can race the source's
two independent IntersectionObservers: the departing citation releases the
arriving citation's position lock. Capture via a citation-free intermediate
position (7000 desktop/tablet; 6000 mobile). The local controller intentionally
aggregates visible citations so rapid jumps keep the correct lock reliably.
