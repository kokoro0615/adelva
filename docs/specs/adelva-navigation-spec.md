# ADELVA global navigation — implementation specification

## 2026-09-10 current navigation authority

User removes 導入事例 and makes ADELVAについて a direct `/about` link on desktop
and mobile; no About mega panel, drawer disclosure, or company fragment links.
HOME/challenges/contact share HomeFooter with a single company destination.
Header identity grows from 22–26px mark /15px text to 32–44px mark /21–30px
text. Shared HOME header also serves the new `/contact` UI-only form. These
instructions supersede older navigation arrays and panel descriptions below.
Implementation measurements and verification are recorded in
`docs/reports/site-revision-2026-09-10/implementation-spec.md`.

## 2026-09-08 rendered-font correction

Browser CDP `CSS.getPlatformFontsForNode` confirmed that Japanese navigation
labels rendered in the system font WenQuanYi Zen Hei, not the declared Hiragino,
Noto Sans JP or Yu Gothic. None of those declared Japanese faces was delivered
by this application. The inherited system-font list therefore produced a
different typeface on each operating system and mixed Latin/Japanese faces.

Use the licensed `clients/adelva` Noto Sans JP source to produce a navigation
subset covering every header/drawer character plus printable ASCII. The old
HOME subset omitted characters such as those in 一覧, 対象 and 困りごと, which
caused per-character fallback even after loading that file. Use the regenerated
font as the single interface family for the header, expanded menus and drawer, at its
400–600 variable weights. Serve it locally with `font-display: swap`; keep the
existing Oswald identity and numbering roles. Use native Japanese widths rather
than proportional-alternate (`palt`) compression, 0.02em label tracking, and an
explicit 1.5 label line-height. Primary navigation and contact labels share
500 weight. Preserve the transparent materials, content, hierarchy and behavior.
Verify actual rendered faces (not just computed CSS), all displayed glyphs,
loading, hover geometry, three required viewports and keyboard/axe behavior.

## 2026-09-08 transparent material refinement

Latest user direction: make the bar and hover state as transparent as practicable.
This scoped Impeccable refinement uses the explicitly requested UI/UX Pro Max
database as research only. It preserves layout, navigation hierarchy and behavior.
The database's generic Liquid Glass, new fonts, chromatic aberration and morphing
recommendations are rejected: the existing imagery and Japanese text lead.

- Bar: transparent fill; a neutral, feathered shadow behind the reading band
  protects white text over bright imagery without a hard navy rectangle. No
  animation of blur and no backdrop blur on the default bar.
- Hover/expanded: white layers at 3%/5%, a 1px traveling underline, stable font
  weight. Contact uses a transparent outlined treatment with a visible 44px target.
- Shelf/drawer: 68% white material with a fixed 20px backdrop blur; dark text
  tokens retain contrast even over black imagery. Cards and hover states remain
  transparent so nested opaque rectangles do not hide the scene.
- Reduced transparency and increased contrast: opaque readable surfaces.
  Backdrop-filter unsupported: opaque shelf/drawer fallback. Forced colors retain
  system foreground, background, outlines and disclosure indicators.
- Ordinary state feedback: 180–220ms color/opacity, with the existing authored
  reduced-motion fallback. No new JavaScript, image or font asset.
- Verify default, hover, all three panels, mobile nested disclosures, scroll,
  keyboard focus and reduced motion at 1440×900, 768×1024, 390×844, plus narrow
  and landscape stress cases. Compare with the saved pre-change implementation;
  these are review captures, not newly approved visual goldens.

Research: [W3C G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)
requires text contrast against the actual surrounding background;
[MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
explains translucent backing and backdrop roots;
[MDN reduced transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency)
documents the preference and its limited support. The preference is an enhancement,
not the sole means of making the navigation readable.

Scope owner: delegated Claude Code implementation, 2026-09-08 JST.
Authority: `/tmp/adelva-menu-delegation/brief.md` (explicit user authorization).
Repository: `/home/kokoro/projects/clients/clonetest`.

## 2026-09-09 one-sheet glass refinement

User report: the menu bar looked broken and its background had to be transparent,
with the hover/expanded state's UI, motion and layout raised to a much higher
standard. Direction selected by the user from three options: **keep the light
glass**, remove the dark plate, and make the bar and the shelf one surface.

### What was actually wrong

- `.bar::before` was a 62% black plate 44px deep past the bar. That plate, not
  any declared background, is what read as an opaque strip over the hero, and on
  open it became a flat `oklch(0 0 0 / 62%)` rectangle sitting directly on a 68%
  white shelf. A dark bar butted against a light sheet with a hard seam is what
  "崩壊" described.
- The shelf's 68%/20px material passed recognisable shapes of the moving hero
  through, which read as dirt under Japanese text rather than as glass.
- `.cards` stretched two audience cards to the height of a five-row list and
  parked the arrow on the bottom edge, leaving two near-empty boxes.

### Material

- **Veil (resting bar).** `backdrop-filter: brightness(0.44)` with a mask that
  feathers it out below the label band, replacing the flat plate. A flat overlay
  must be dark enough for the worst backdrop a hero can present — measured, 53%
  black — and that same value over a night scene is the strip being removed.
  Reducing the backdrop's own brightness scales itself, and multiplication keeps
  all of the photograph's internal contrast. Measured against a pure white
  backdrop, white bar text lands at **4.81–4.95:1** across brand, labels and
  contact; over the home hero it measures 5.6:1 at the brightest single pixel and
  7.3–9.3:1 on average. The bar carries no fill of its own in any state.
- **Sheet (expanded).** One `.pane` element spanning the bar _and_ the shelf at
  `oklch(1 0 0 / 86%)` with `blur(32px)`. Two adjacent backdrop-filtered boxes
  each blur only the backdrop they clip and therefore seam at the join; one
  element cannot. The shelf keeps only its clipping rectangle. Against a black
  hero — the worst case for dark ink — the composited surface is rgb(219,219,219)
  and every text role clears AA: labels/title/rows **12.47:1**, descriptions
  **10.85:1**, group labels **9.44:1**.
- **Inversion.** With the sheet down the bar stands on paper, so its ink turns
  over with the material over `--nav-open`. The travelling rule, brand mask,
  chevrons and focus ring all inherit that ink. `.item` declines a colour
  transition of its own: the global `a { transition: color }` would otherwise
  give the two link items a second, shorter curve and invert the row in two waves.

### Motion

The stylesheet's governing idea is that things are uncovered by an edge that
sweeps. The panel is parked at the top of the shelf's clipping box, so growing
that box _is_ the reveal; the previous build cross-faded the panel on top of the
same reveal and cancelled it out. Supporting states: the intro and each body
group settle behind the descending edge on a capped three-step stagger; the
shelf's bottom hairline and the intro's vertical rule are drawn rather than
switched on; the item chip rises from the rule's baseline; the contact call fills
from its leading edge. Open `--nav-open` 440ms, close `--nav-close` 280ms.

### Measured performance

Software rasteriser (SwiftShader, no GPU) — a floor, not a target device.

- The height transition on `.shelf` and `.pane` is free: 16.7ms per frame, the
  same as the page with no navigation animation at all. Both boxes are out of
  flow inside a fixed header whose only children are also out of flow.
- Blur radius is not a factor: 6px and 32px measured identically.
- The one real cost was **nested backdrop roots** — the sheet re-filtering the
  veil's output every frame the hero moves. It halved the descent to 33ms and
  kept dropping frames for as long as the menu stayed open. The veil's filter is
  now switched off at exactly the moment its own opacity reaches zero
  (`--nav-veil-fade` 200ms), where nothing can see it go. Steady-state open
  returns to a clean 16.7/16.8ms; the descent is 60fps in most runs, with the
  first 200ms still nested.

### Fallbacks

Reduced transparency / increased contrast: the veil drops its filter and mask and
becomes the opaque reading band; the sheet and drawer drop blur for paper. No
backdrop-filter support: the veil falls back to the measured flat equivalent
(56% black, feathered the same way) and the sheet to paper. Forced colours: system
canvas and text, no veil, no wipes. Reduced motion: presence transitions and their
delays resolve at 0s — verified, the sheet is at its full measured height and every
column is at `opacity: 1` / `transform: none` within two frames of the click.

### Verification

Evidence: `artifacts/adelva-navigation-glass-2026-09-09/` — three required
viewports, all three panels, drawer and nested drawer, scrolled, keyboard focus,
reduced motion, and same-frame before/after captures of the plate versus the veil.

Green: `format:check`, `lint` (changed files), `typecheck`, `test:unit` (99),
production build, `test:axe` (8/8), and release-coverage "menu is accessible at
desktop" (15/15).

Pre-existing and untouched by this pass, recorded rather than fixed:

- `release-coverage` fails at tablet and mobile on `getByRole("navigation")`
  being visible. Below 64rem this navigation is intentionally a closed drawer
  (§4), so no navigation landmark is visible until it is opened. The last green
  run of this gate, `artifacts/release/release-coverage.log` (2026-08-30, 142
  passed), predates the ADELVA navigation entirely.
- `interaction-regressions` has 18 failures querying `.masthead__bar` and
  `.masthead__brand`, selectors of the retired White Desert masthead that no
  longer exists in `src/`.
- `tests/e2e/global-shell-clone.spec.ts` (untracked) fails typecheck on an
  undefined `MENU_GEOMETRY`, which blocks `pnpm build`. It was set aside to run
  the build gate and restored unchanged; it is mid-refactor work owned elsewhere.

Scope owner: Claude Code, 2026-09-09 JST. Files changed:
`src/components/site-header.tsx`, `src/components/site-header.module.css`.
No deployment authorized.

## 1. Scope, authority and boundaries

| Field              | Decision                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In scope           | The shared header: brand lockup, primary navigation, desktop mega menu, mobile drawer, their styles, data, behaviour tests, and this specification.                        |
| Out of scope       | Page bodies, the global footer, `HowItWorks`, route content, the White Desert route set, asset pipeline, and every non-navigation template.                                |
| Content authority  | `references/adelva/sources/home-content.ts` (byte-identical snapshot of `clients/adelva/src/content/home.ts`) plus `information-architecture.md` §6–7.                     |
| Fidelity authority | The navigation is an **authorized replacement**, not a White Desert reconstruction. Sections 6.x of the clone ledger no longer govern the header.                          |
| Preserved gates    | Every non-navigation reference gate, route manifest, footer contract, motion contract, and asset provenance rule is untouched.                                             |
| Prohibited         | Inventing destination pages, business claims, metrics, testimonials, prices, or new marketing copy; introducing unlicensed assets; deleting shared footer navigation data. |

### 1.1 Route availability — recorded honestly

This repository implements the 30-route White Desert manifest
(`src/content/route-manifest.ts`). **None of the ADELVA destinations exist here.**
The ADELVA source project itself only implements `/`
(`references/adelva/README.md` §「計画と実装状況の違い」), so these routes are
planned in both projects, not merely missing in this one.

The navigation therefore emits the canonical ADELVA hrefs, marks each one
`data-route-status="pending"` in the DOM, and links them with plain anchors so
Next.js never prefetches a route that cannot resolve. Nothing in the interface
claims these destinations work. The complete list is recorded in §8.

The existing 30 White Desert routes remain reachable: the global footer
(`src/components/site-footer.tsx`, `footerGroups` in `src/lib/navigation.ts`)
carries the full route set by design and is explicitly not modified.

## 2. Information architecture

Order is fixed by `information-architecture.md` §6.1 —
「顧客の状況 → 支援体系 → ADELVA固有の進め方 → 証拠 → 会社」.

| #   | Item           | Behaviour             | Destination / panel                         |
| --- | -------------- | --------------------- | ------------------------------------------- |
| 1   | 課題から探す   | Mega panel            | `site-menu-challenges`, index `/challenges` |
| 2   | 支援内容       | Mega panel            | `site-menu-services`, index `/services`     |
| 3   | 支援の進め方   | Direct link           | `/approach`                                 |
| 4   | 導入事例       | Direct link           | `/cases`                                    |
| 5   | ADELVAについて | Mega panel            | `site-menu-about`, index `/about`           |
| —   | お問い合わせ   | Primary button, right | `/contact`                                  |

### 2.1 課題から探す

- Group 「対象者から探す」 — the two audiences at equal area and weight
  (`information-architecture.md` §6.2 forbids subordinating either):
  - オーナー・経営者の方へ → `/challenges/owners` — 経営判断、収益、投資、開業・再建、運営体制から支援を探す
  - 総支配人・現場責任者の方へ → `/challenges/general-managers` — 現場品質、人材、生産性、販売、システム定着から支援を探す
- Group 「困りごとから探す」 — five challenge rows, label + description, hrefs
  `/challenges#management-profit`, `#opening-operations`, `#operations-people`,
  `#revenue-brand`, `#digital-foundation`.
- Index link 「課題一覧を見る」 → `/challenges`.

### 2.2 支援内容

Three domain columns, each carrying number, title, description, its support
themes, and its service count (count is supporting information only, never the
value proposition — `information-architecture.md` §6.3):

| Number | Domain             | Themes                                                           | Count |
| ------ | ------------------ | ---------------------------------------------------------------- | ----- |
| 01     | 経営・運営統括     | 経営診断・改善 / 開業・運営体制 / 現場運営改善 / 人材・採用      | 11    |
| 02     | 収益・ブランド成長 | 集客・販売チャネル支援 / Webサイト・ビジュアル制作 / SNS運用支援 | 5     |
| 03     | DX・IT・調達基盤   | DX・システム導入・個別開発 / IT運用・保守 / アメニティ調達支援   | 4     |

Index link 「支援内容一覧」 → `/services`.

### 2.3 ADELVAについて

Four destinations, no descriptions (the reference data carries none, and none
are invented): ADELVAについて `/about`, 私たちの役割 `/about#role`,
支援スタンス `/about#stance`, 会社概要 `/about#company`.

## 3. DOM contract

```
<header data-fidelity-landmark="header-nav" lang="ja" data-compact data-menu-open>
  <div class=bar>
    <a class=brand href="/">           mark + ADELVA wordmark, accessible name "ADELVA"
    <nav class=primary aria-label="グローバルナビゲーション">
      <button aria-expanded aria-controls="site-menu-…">課題から探す + chevron
      <button …>支援内容
      <a href="/approach">支援の進め方
      <a href="/cases">導入事例
      <button …>ADELVAについて
      <span class=rule aria-hidden>          travelling accent rule
    </nav>
    <a class=cta href="/contact">お問い合わせ</a>        ≥64rem
    <a class=ctaCompact href="/contact">お問い合わせ</a>       <64rem
    <button class=burger aria-expanded aria-controls="site-menu" aria-label="メニューを開く">
  </div>
  <div class=shelf data-site-nav-shelf data-open>
    <nav id="site-menu-challenges" aria-label="課題から探すメニュー" inert?>
    <nav id="site-menu-services"   aria-label="支援内容メニュー"     inert?>
    <nav id="site-menu-about"      aria-label="ADELVAについてメニュー" inert?>
  </div>
</header>
<div class=scrim data-open aria-hidden="true">
<div id="site-menu" data-site-nav-drawer role="dialog" aria-modal="true"
     aria-label="サイトメニュー" data-open inert?>
```

- `#site-menu` and `data-fidelity-landmark="header-nav"` are preserved DOM
  contracts: `HowItWorks` inert handling, `capture-section-evidence.mjs`, and
  `release-coverage.spec.ts` all key on them.
- The drawer and scrim are siblings of `<header>` so the fixed masthead's
  stacking context cannot clip a full-viewport modal.
- Every mega panel is a `<nav>` landmark with a unique accessible name. Closed
  panels are `visibility: hidden` **and** `inert`, so they leave both the tab
  order and the accessibility tree.
- `lang="ja"` marks the Japanese navigation inside the `lang="en"` document
  (WCAG 2.2 §3.1.2 Language of Parts).

## 4. Layout and responsive behaviour

Breakpoint: **64rem (1024px)**. ≥64rem = desktop mega. <64rem = drawer.
Required viewports: 1440×900 → mega, 768×1024 → drawer, 390×844 → drawer.

| Token / measure        | 1440                                      | 768               | 390     |
| ---------------------- | ----------------------------------------- | ----------------- | ------- |
| Bar height (top state) | 76px                                      | 64px              | 60px    |
| Bar height (compact)   | 60px                                      | 56px              | 54px    |
| Bar inline padding     | `clamp(1.25rem, 3vw, 3rem)`               | 1.5rem            | 1.25rem |
| Brand mark             | 26px tall                                 | 24px              | 22px    |
| Nav item               | 44px min height                           | —                 | —       |
| Mega shelf max width   | `--shell` (1440px)                        | —                 | —       |
| Mega intro column      | 240px                                     | —                 | —       |
| Mega body columns      | challenges 1fr / 1.15fr; services 3 × 1fr | —                 | —       |
| Drawer width           | —                                         | min(420px, 100vw) | 100vw   |
| Drawer row min height  | —                                         | 56px              | 56px    |

- The shelf is full-bleed; its inner grid is centred at `--shell`.
- At desktop widths the primary navigation and contact CTA form one right-aligned
  cluster, while the brand remains anchored to the left edge.
- Between 64rem and 80rem the challenges body collapses to a single column
  stack so Japanese labels never wrap mid-phrase.
- The drawer scrolls internally (`overflow-y: auto; overscroll-behavior: contain`)
  and reserves its CTA outside the scroll area.
- No element may introduce horizontal document overflow at any viewport.

## 5. Typography

| Role           | Family                   | Size / leading   | Tracking |
| -------------- | ------------------------ | ---------------- | -------- |
| Brand wordmark | Oswald (`--font-narrow`) | 15px / 1         | .30em    |
| Nav label      | JP stack                 | 15px / 1.2, 600  | .04em    |
| CTA            | JP stack                 | 14px / 1, 600    | .04em    |
| Mega eyebrow   | Oswald                   | 11px / 1, 500    | .34em    |
| Mega title     | JP stack                 | 26px / 1.35, 500 | .02em    |
| Group label    | JP stack                 | 11px / 1, 600    | .22em    |
| Card title     | JP stack                 | 17px / 1.5, 600  | .02em    |
| Description    | JP stack                 | 13px / 1.85      | .02em    |
| Theme link     | JP stack                 | 14px / 1.6, 500  | .02em    |
| Service count  | Oswald, tabular          | 12px / 1         | .12em    |

JP stack: `"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP",
"Yu Gothic", "Yu Gothic UI", Meiryo, var(--font-sans), sans-serif` — system
faces only. No font file is added, so no new licence is created.
`font-feature-settings: "palt" 1` tightens Japanese proportional metrics on
labels; `line-break: strict` and `word-break: normal` keep Japanese line
breaking correct; leading is 1.85 on running text because Japanese needs more
than the 1.6 body default.

## 6. Colour, surface and contrast

| Surface         | Value                                            | Text            | Measured contrast                                                        |
| --------------- | ------------------------------------------------ | --------------- | ------------------------------------------------------------------------ |
| Bar, top state  | no fill; veil `backdrop-filter: brightness(.44)` | `--paper` white | 4.81–4.95:1 against pure white (2026-09-09 measurement)                  |
| Bar, compact    | `--pill-strong` `rgba(31,42,68,.86)`             | white           | ≥7:1                                                                     |
| CTA             | `--flare` `#ff7e15`                              | `--ink-deep`    | 5.5:1 (the recorded replacement for the failing white-on-orange pairing) |
| Mega shelf      | `--paper` `#ffffff`                              | `--ink`         | 12.6:1                                                                   |
| Description ink | `--ink-soft` `#33405c`                           | on `--paper`    | 9.6:1                                                                    |
| Group label     | `--charcoal` `#535353`                           | on `--paper`    | 7.5:1                                                                    |
| Drawer          | `--paper`                                        | `--ink`         | 12.6:1                                                                   |
| Scrim           | `rgba(9,11,16,.55)` + blur 15px                  | —               | —                                                                        |

Accent for hover/current is `--flare-ink` `#c2540a` (4.5:1 on white), never the
raw `--flare` orange as text.

## 7. States, motion and interaction

Ordinary state transitions are CSS. No GSAP, no scroll library, no new
dependency.

| State             | Trigger                                                    | From → to                                                              | Duration / easing                  | Reduced motion                         |
| ----------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- | -------------------------------------- |
| Bar compact       | `scrollY > 24`                                             | height + background + hairline                                         | `--dur-state` 300ms `--ease-state` | Instant state change (40ms global cap) |
| Mega open         | click, or mouse hover after 90ms intent                    | shelf `height 0 → measured`, panel `opacity 0→1`, `translateY(-6px)→0` | 380ms `--ease-panel` / 240ms       | 0s, painted settled                    |
| Mega switch       | hover/click another trigger                                | shelf re-measures, panels cross-fade                                   | same                               | 0s                                     |
| Mega close        | Escape, outside pointer, scroll, blur out, 220ms hover-out | reverse                                                                | 260ms                              | 0s                                     |
| Travelling rule   | hover / open trigger                                       | `translate3d(x) scaleX(w/100)`                                         | 320ms `--ease-panel`               | no travel; appears in place            |
| Drawer open       | burger click                                               | `translateX(100%) → 0`, scrim `opacity 0→1`                            | `--dur-wipe` 460ms `--ease-wipe`   | 0s, present immediately                |
| Drawer close      | Escape, Close, scrim, link, resize ≥64rem                  | reverse                                                                | `--dur-wipe-out` 260ms             | 0s                                     |
| Drawer disclosure | click                                                      | `grid-template-rows: 0fr → 1fr`                                        | `--dur-panel` 400ms `--ease-panel` | 0s                                     |
| Press feedback    | `:active`                                                  | `scale(.978)`                                                          | `--dur-press` 90ms                 | suppressed                             |

Reduced motion is authored, not disabled: the same composition, hierarchy,
links and focus order arrive already settled. The navigation's presence
transitions resolve at `0s` under `reduce` with module-scoped
`transition-duration: 0s !important`, which outranks the global stylesheet's
`* { transition-duration: 40ms !important }` on specificity. This is the same
class of defect the 2026-08-31 audit found: an element that is painted must be
focusable in the same frame.

### 7.1 Interaction rules

- **Hover intent** applies to `pointerType === "mouse"` only. 90ms to open,
  220ms to close; switching between already-open panels does not re-pay the
  open delay. Touch and pen open on tap.
- **Click on an open trigger** closes it and suppresses the hover-reopen that
  the resting pointer would otherwise fire.
- **Escape** closes the open mega panel or the drawer and returns focus to the
  control that opened it.
- **Outside pointerdown** closes.
- **Scroll while a mega panel is open** closes it: a panel anchored to a fixed
  bar must never float over content the reader has scrolled to. The desktop
  mega deliberately does **not** lock the document — it is a non-modal
  disclosure, and locking a page behind a non-modal surface is wrong.
- **Drawer is modal**: `lockScroll()` from `src/lib/motion.ts` holds the exact
  reading position against script, `scrollIntoView`, wheel and keys; the
  background (`#main-content`, footer, skip link) is `inert`.
- **Resize across 64rem while open** closes whichever surface no longer applies.
- **Focus into the drawer** is conditioned on the Close control plus its 6px
  focus-ring clearance being inside both the viewport and the moving panel's
  clipping rectangle, sampled per animation frame; under `reduce` it is
  immediate. Early `Tab` uses the same predicate. This carries over the proven
  2026-08-31 correction verbatim.
- **Focus into a mega panel** is not forced: a non-modal disclosure keeps focus
  on its trigger and the reader tabs in. Tab order is trigger → panel contents
  → next header control.

## 8. Accessibility contract

- WCAG 2.2 AA. Semantic `header` / `nav` / `ul` / `button` / `a`; no
  `div` masquerading as a control.
- Disclosure buttons expose `aria-expanded` + `aria-controls`; panels are
  `inert` and `visibility: hidden` when closed.
- The drawer is `role="dialog" aria-modal="true"` with an accessible name, a
  focus trap, Escape dismissal, and focus restoration on every close path.
- Every interactive target is ≥44×44px (well above the 24px 2.5.8 floor).
- Visible focus uses the global `:focus-visible` ring (3px `--focus`, 3px
  offset); the ring is never clipped by an `overflow: hidden` ancestor.
- Group lists are named with `aria-labelledby` pointing at their visible group
  label, so no heading is invented to carry a label.
- `aria-current="page"` marks the active destination.
- 200% zoom and 320px width: the drawer and bar reflow without horizontal
  scrolling.
- Chevrons, the travelling rule, and the scrim are `aria-hidden`.

### 8.1 Pending destinations (25)

`/challenges`, `/challenges/owners`, `/challenges/general-managers`,
`/challenges#management-profit`, `/challenges#opening-operations`,
`/challenges#operations-people`, `/challenges#revenue-brand`,
`/challenges#digital-foundation`, `/services`,
`/services/management-operations`,
`/services/management-operations/management-improvement`,
`/services/management-operations/opening-operations`,
`/services/management-operations/operations-improvement`,
`/services/management-operations/people-recruitment`,
`/services/revenue-brand`, `/services/revenue-brand/acquisition-sales`,
`/services/revenue-brand/web-visual-production`,
`/services/revenue-brand/social-media-operations`,
`/services/dx-it-procurement`,
`/services/dx-it-procurement/system-delivery`,
`/services/dx-it-procurement/it-operations-maintenance`,
`/services/dx-it-procurement/amenity-procurement`, `/approach`, `/cases`,
`/about` (+ `#role`, `#stance`, `#company` fragments), `/contact`.

Only `/` resolves. Each pending destination renders the repository's designed
`src/app/not-found.tsx`, not a browser error.

## 9. Assets

| Asset                          | Source                                                                    | Status                                               |
| ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `public/brand/adelva-logo.png` | Pre-existing in this repository (2026-09-08, not introduced by this task) | Reused as a CSS `mask` so it inherits `currentColor` |
| Oswald, Inter Tight            | Already licensed and self-hosted                                          | Reused                                               |
| Japanese faces                 | System stack only                                                         | No file added, no licence created                    |

No new asset is introduced by this work.

## 10. Verification contract

| Gate                  | Command                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Format                | `pnpm format:check`                                                                                                                         |
| Lint                  | `pnpm lint`                                                                                                                                 |
| Types                 | `pnpm typecheck`                                                                                                                            |
| Unit                  | `pnpm test:unit`                                                                                                                            |
| Production build      | `pnpm build`                                                                                                                                |
| Browser (all specs)   | `pnpm test:e2e`                                                                                                                             |
| Accessibility         | `pnpm test:axe`                                                                                                                             |
| Release coverage      | `pnpm test:release-coverage`                                                                                                                |
| Route authority       | `pnpm fidelity:routes`                                                                                                                      |
| Implementation visual | `pnpm test:visual` — **expected to fail**; the home golden contains the replaced header and regenerating a baseline needs explicit approval |

Behaviour tests are updated, not removed: the modal contract keeps every
assertion it had, and the non-modal desktop contract gains assertions that are
correct for a disclosure (focus stays in the header, scroll dismisses, no bogus
lock) instead of asserting a modal invariant that does not apply.
