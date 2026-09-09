# ADELVA audience pages — Figma v2 (system + motion), 2026-09-09

Figma file `ChpQzLAbKeC3HORU2TILlz`. Figma-only pass. No application code, route,
asset pipeline or deployment was changed. The four frames the user supplied were
cloned; **the originals on pages `21:2` and `66:52` are untouched.**

Source frames: `21:3` GM / Desktop 1440, `67:2` OWNERS / Desktop 1440,
`97:52` GM / Mobile 390, `97:75` OWNERS / Mobile 390.

Working page: `144:50` — `03 — V2 / SYSTEM & MOTION`.

| v2 frame                   | node      | from    |
| -------------------------- | --------- | ------- |
| V2 / OWNERS / Desktop 1440 | `146:50`  | `67:2`  |
| V2 / OWNERS / Mobile 390   | `146:329` | `97:75` |
| V2 / GM / Desktop 1440     | `146:665` | `21:3`  |
| V2 / GM / Mobile 390       | `146:838` | `97:52` |
| V2 / MOTION SCORE          | `178:98`  | new     |

## What the audit measured

Measured from the Figma document and from full-resolution renders, not estimated.

- **Four frames used four palettes.** Desktop frames were largely bound to the
  shared variables; both mobile frames had **zero** variable bindings and used
  `#092338`, `#cf6628`, `#f78c42`, `#31465a`, `#d5dce0`, `#83919a`, `#d1ceca`,
  `#415666`, `#08283c`, `#456071`, `#f3f0ea` directly.
- **Three Latin display families.** OWNERS used League Gothic, GM used Oswald,
  GM mobile used both. The implementation ships Oswald
  (`src/app/globals.css`, `--font-narrow`), so Oswald is the system family.
- **No text style was applied to any node**, although four styles existed — and
  `ADELVA / Heading` was Noto Sans JP Light while every heading on canvas was
  Noto Serif JP.
- **`67:2` was authored at 1448×4344 and uniformly scaled by 0.9944751** to fit 1440. Verified: `55.6906→56`, `99.4475→100`, `865.193→870`, `1.9890→2`,
  `1.1934→1.2`, `3.9779→4`. Every coordinate and every rule was fractional.
  `21:3` had 436 of 692 coordinates (63%) off whole pixels.
- **Contrast failures** (measured):
  - `flare #ff7e15` as chapter numerals on cream — **2.22:1** (2.38:1 on the
    OWNERS `#f9f7f3`). Below AA 4.5 and below the 3.0 large-text floor.
  - GM mobile hero body copy over the sunset window — **3.11:1 / 3.26:1**.
  - OWNERS mobile monument over the bright water — **2.16:1**.
- **The OWNERS desktop backdrop is a raster.** All eight sections carry a copy of
  the same 1440×4320 image plate, and the source file
  `references/adelva/mockups/owners-2026-09-09/figma/desktop-background.png`
  is **724×2172** — the page backdrop renders at 2× upscale.
- `get_motion_context` (recursive) returned `{"nodes":[]}` — no motion existed.
- No 768 frame existed, although `AGENTS.md` requires 1440 / 768 / 390.

## What v2 changes

### Foundations

- Variables added to `ADELVA / Owners mock`:
  - `flare-ink` `#b04a08` — orange for text and rules on light fields.
    **4.77:1 on `ice`, 5.48:1 on `paper`.** The implementation's existing
    `--flare-ink #c2540a` clears 4.5:1 on white (4.60) but only reaches
    **4.00:1 on `ice`**, so the mock uses the darker value for cream fields.
  - `scrim` `rgba(31,42,68,.70)` — copy over photography.
  - `rule-dark` `rgba(255,255,255,.34)` — hairline on ink/deep fields.
  - `focus` `#ff8a2b` — keyboard focus ring.
- 25 text styles on integer sizes: `ADELVA / Desktop /` (11),
  `/ Tablet /` (5), `/ Mobile /` (9). The four stale styles were repurposed
  rather than left as a contradicting second ramp.
- Ramp steps used when snapping: serif `64 52 44 32 28 24 20 16 14`,
  sans `48 32 26 22 20 18 16 14 12 11`,
  display `224 184 168 120 96 88 64 48 32 24 20 16 12`.
  Mobile: serif `38 32 26 22 20 17 16 14 13`, sans `22 20 18 16 15 14 13 12 11`,
  display `96 84 64 56 40 32 24 20 12`.

### Geometry

| frame          | type snapped | geometry snapped | rules snapped |
| -------------- | ------------ | ---------------- | ------------- |
| OWNERS desktop | 98           | 280              | 63            |
| GM desktop     | 98           | 135              | 10            |
| OWNERS mobile  | 25           | —                | 45            |
| GM mobile      | 40           | —                | 37            |

Rules are now exactly 1 / 2 / 4 px. Auto-layout gaps and padding snap to the
existing `space/*` scale. GM desktop sections were re-stacked to remove
sub-pixel seams; frame height 4555.47 → 4556.

### Colour

- OWNERS mobile: 191 fills bound to tokens; GM mobile: 183. Backgrounds are
  resolved by walking to the nearest filled ancestor, so orange on light maps to
  `flare-ink` and orange on dark stays `flare`.
- Orange text and rules on light fields → `flare-ink`: OWNERS desktop 16 fills,
  GM desktop 1 (GM had already avoided this).

### Photography and composition

Three new photographs generated with the built-in subscription `image_gen` via
`codex exec --model gpt-6-astra` (medium effort); prompts, originals and
constraint checks are recorded in
`references/adelva/mockups/owners-2026-09-09/figma-v2/images/README.md`.

- **New section `05b Climax panorama`** (`154:50`, 1440×520) between
  05 責任分界 and 06 実行 — the full-bleed photographic pause OWNERS lacked.
  No copy, matching the precedent of GM's dining panorama. Page 4320 → 4840.
- **08 Contact backdrop** replaced with the native-resolution dawn interior,
  plus a left-to-right ink reading field and an `ink` 80% footer bar.
  Measured after: headline 6.57–14.56:1, monument 4.84–9.74:1,
  footer 9.62–14.26:1, and the right-hand sky stays open (1.21:1 background).
- The third image (stone / wood / linen still life) is generated and recorded but
  **not yet placed** — it is intended for the 768 責任分界 section.

### Accessibility

- GM mobile hero: `ink` 45% reading scrim. Body copy **3.11 → 6.55–9.89:1**,
  H1 4.29:1 (large text, ≥3:1). The photograph is still legible; an earlier
  0.5 solid flattened it and was reduced.
- OWNERS mobile: `ink` 42% lift over the lower 300px so the monument clears the
  bright water.
- State design is specified so that no state is carried by colour alone
  (see the motion score, block 05).

### Masthead

OWNERS desktop now carries the brand monogram beside the wordmark, matching GM
and both mobile frames, and its lone `↓` glyph is replaced by the shared
`SCROLL` label plus a 27px hairline. Placement differs by hero: GM bottom-left,
OWNERS bottom-right, because the OWNERS monument occupies the lower left.

### Motion

`V2 / MOTION SCORE` (`178:98`) defines, with drawn easing curves:

- durations `instant 80 / quick 160 / base 260 / slow 420 / cinematic 720` ms
- easings `standard (.2,0,0,1)`, `enter (0,0,.2,1)`, `exit (.4,0,1,1)`,
  `editorial (.16,1,.3,1)`
- distance 4 / 8 / 16 / 24 px for text, 40px only for the monument, photographic
  parallax capped at 6% of section height, stagger 40–60ms and never past six
  siblings, at most two moving groups per screen
- a ten-row choreography table covering every section of both pages
- a five-row state table (list row, both CTAs, nav disclosure, process dot)
- reduced-motion: all translate / scale / clip / parallax / looping cues off,
  everything drawn in its final state, only ≤120ms opacity cross-fades kept,
  nothing gated on animation completion, focus order unchanged
- performance: transform / opacity / clip-path only, one rAF, `will-change`
  only while in view, parallax reduced to 3% at 390, reserved media ratios

These build on the earlier proposal in
`references/adelva/mockups/general-managers-2026-09-08/REVISION-v2.md` and do not
contradict it. They are design values, not measurements of any reference site,
and not verified in a running implementation.

## Known gaps

1. **768 frames are not built.** The tablet type ramp exists; the frames do not.
2. **The OWNERS desktop backdrop is still the 2× upscaled 724×2172 raster,
   duplicated across eight section plates.** Only the climax band and the contact
   band are native resolution. Fixing this properly needs the backdrop rebuilt
   as real surfaces plus separately placed photographs.
3. **Text nodes are not bound to the new text styles.** Sizes and line heights
   were snapped to the ramp numerically; binding each node to a named style is a
   separate pass.
4. **No component library.** The CTA variant set (`22:2` / `22:5`) is still the
   only shared component; list row, mapping row, chapter label, party column and
   process node remain loose nodes.
5. **OWNERS still uses two chapter-label formats** (`01 —` in section 02,
   `NN / label` elsewhere). Unifying them requires a copy decision.
6. **No Figma prototype or keyframe animation.** Motion is specified, not animated.
7. Contrast figures are sampled at the points listed above from full-resolution
   renders. This is evidence, not an exhaustive per-glyph audit, and no axe or
   browser check applies to a Figma-only task.
8. Copy still differs between the GM editable rebuild
   (「現場の課題を、続けられる改善へ。」) and the source raster `21:4`
   (「現場課題を、継続運用できる仕組みへ。」). Which is canonical is undecided;
   Codex found no record resolving it.

## Authority

Per an independent Codex review of this repository's records: IA is
`references/adelva/sources/information-architecture.md` §8.2 (OWNERS) and §8.3
(GM); colours are defined in `src/app/globals.css`; there is no record approving
a separate palette for these pages, and no record explaining the cream and
label-format divergence between the two desktop frames. `docs/adelva-owners-figma-mock.md`
describes a different, earlier Figma file and is not authoritative for these frames.
Planned routes `/challenges/owners` and `/challenges/general-managers` exist in the
IA and in `src/content/adelva-navigation.ts`, but are not implemented in `src/app`.
