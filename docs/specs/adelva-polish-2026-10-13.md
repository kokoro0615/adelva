# ADELVA site polish 2026-10-13 — shared contract for every agent

Owner: Opus 5.5 (orchestrator). Every page agent and image agent follows this file.
Integration branch: `polish/mobile-2026-10-13` (worktree `../clonetest-polish`, based on
production `origin/main` 3dc1f32). Production: https://www.adelva.jp (Vercel, deploys `main`).

## 1. The request (user, 2026-10-13)

> 全ページのモバイル版をモーション、ガクガク感が多々散見される。その他にUIUXアニメーション
> デザインレイアウトのブラッシュアップ、改善点が多々散見される。さらに背景画像がAI感が強い画像が
> 多々ある。全ページ徹底的に研究し原因追究し改善し本番反映お願いいたします。UIUXアニメーション
> デザインレイアウト、モーションが圧巻で受賞されるレベルを徹底してください。

User decisions (do not re-ask): backgrounds keep their composition and are re-rendered as real
photographs (Codex `gpt-6.1-sol` xhigh generates; Opus 5.5 xhigh writes every image prompt);
/challenges people photos become photos without faces; /challenges is rebuilt in the other pages'
design language (copy, links and order kept); /challenges/general-managers builds on the
uncommitted 10-01 "一筋の朝の光" revision; the work is split across sub-agents so quality never
drops from overload.

The user checks on an iPhone (Safari). Desktop-Chromium verification has missed every phone bug
so far (WebGL fp16 NaN, snap traps, header collisions). Treat the phone as the primary target.

## 2. What the research found (orchestrator, 390×844 touch drags + traces + code reading)

Measurement tools (run from your worktree root against your own `next start` server):

| Script | What it gives |
| --- | --- |
| `node scripts/adelva/polish/trace-scroll.mjs <base> <route> <outPrefix>` | Chrome trace during real touch drags at 390×844 DPR 2: style/layout/paint/commit totals, forced layouts with their JS call site, image decodes |
| `node scripts/adelva/polish/touch-scroll.mjs <base> <route> <out.json> [cpu=4]` | rAF frame pacing (p50/p90/p99, >50 ms frames), long animation frames with script attribution, CLS, backward scroll jumps, console errors |
| `node scripts/adelva/polish/sweep.mjs <base> <route> <outDir> [stepPx] [w] [h] [settleMs] [cols]` | screenshot after each touch drag + contact sheet (`<outDir>-sheet.jpg`) |
| `node scripts/adelva/polish/webkit-scroll.mjs <base> <route> <outDir>` | WebKit iPhone 13: rAF pacing while scrolling, console errors, screenshots (Safari engine) |

Headless Chromium here renders with SwiftShader (CPU); absolute frame times are not GPU numbers.
Compare before/after on the same machine state, back to back.

Causes found so far (code + traces). Each page agent must confirm, extend and fix these for its page:

- **Every page — header.** `site-header.tsx` reads `window.scrollY` inside its own rAF after other
  rAF writes (a forced layout on every scrolled frame, 1 of the top call sites on all pages). The
  smoked-glass header uses `backdrop-filter` (41 occurrences in its CSS) over moving photos, canvas
  and WebGL: iOS re-blurs it every frame. Every page also preloads the /about plate, the old hero
  poster and other pages' CSS (console: "preloaded but not used").
- **HOME (`home-a2/mobile.ts`).** Per-frame writes of `left/top/width/height` (expertise bands,
  labels, joins) and `height` + regenerated `mask-image` gradients on the spine; per-frame reads of
  `getBoundingClientRect` (purpose block, header brand word, rail track) and `offsetHeight` (cards,
  labels) after writes → layout every frame. The hero film ships 1080×1920 H.264 at 10 Mbps
  (40 MB) to phones with `preload="auto"`; its source is a 244×432 crop upscaled, so a phone encode
  ≤ 3 Mbps loses nothing visible. Pano + lake WebGL render every frame while visible.
- **/approach.** The dive pins the hero with ScrollTrigger `pin` (position:fixed swap) — on iOS the
  pin start/end jumps; the stage photographs and magnification lines are scrubbed transforms on
  in-flow content, so they lag the finger ("swim").
- **/services/revenue-brand.** An SVG `feTurbulence/feDisplacementMap` ripple applied as a CSS
  filter to HTML whose scale follows scroll velocity (Safari renders SVG filters on the CPU, every
  frame); nested SVG masks over the river redraw every frame; 301 forced layouts from one call site
  (`ea`) during a scroll.
- **/services/management-operations (`camera-motion.ts`).** One fixed full-screen 2D canvas redrawn
  every frame from up to ~20 large WebP layers with `imageSmoothingQuality = "high"` and offscreen
  `destination-in` composites; the page decodes ~188 MB of images on a phone (Safari evicts and
  re-decodes → spikes). Highest rAF cost per scrolled px of all pages (230 ms / 1000 px headless).
- **/services/dx-it-procurement.** SVG mask (`dxPower`) + `feGaussianBlur` soft mask on large
  areas, scroll trackers with layout reads.
- **/challenges/owner, /challenges/general-managers.** Scroll handlers that loop
  `getBoundingClientRect` over sections and set React state on scroll; moving `mix-blend-mode`
  layers; fixed right-edge index rails that overlap body text and the footer on phones.
- **/about.** WebGL "ink to life" front + scrubbed pins; vertical side index overlaps imagery.
- **/contact.** 10 `backdrop-filter` and 10 `filter: blur` rules over the photo; the form says
  「現在フォームは準備中です」 in production (no `CONTACT_WEBHOOK_URL`) and links a /privacy page
  that does not exist — report, do not change delivery.
- **/challenges.** The old nosigner-clone design (white sections, big English serif titles, AI
  people tiles, a green radial-glow void, a floating 相談する pill over content).
- **Images.** Almost every page's main plate reads as AI (glow, HDR, purple/teal grade, melted or
  impossible shapes: glowing river, twisted daisugi, purple terraces with a waterfall at every
  paddy, cliff building with lava-like conduit, god-ray farmhouse, mirror-wet lobby floors, the
  shared footer's sunset). HOME's plates (Alps lake, autumn massif) read as photographs and are
  kept.

## 3. Mobile motion contract (must hold on every page after your change)

R1 **Stages, not pins.** Scroll-linked visuals live inside a CSS `position: sticky` stage. Never
use ScrollTrigger `pin` (or JS fixed/unfixed swaps) on phones/tablets. Do not move in-flow content
with JS as a function of scroll position on coarse pointers; use (a) a sticky stage whose inner
layers move, (b) time-based reveals started by IntersectionObserver/ScrollTrigger callbacks and run
as CSS transitions/WAAPI on transform/opacity, or (c) CSS scroll-driven animations
(`animation-timeline: view()/scroll()`) behind `@supports`, with (b) as the fallback.

R2 **Per-frame budget.** In a frame loop write only `transform`, `opacity` (and filters on small
elements). Never animate `left/top/width/height/inset/margin`, `clip-path` or `mask-image` on large
layers, or custom properties that cascade into many nodes. No layout reads inside the loop: cache
geometry on resize/ResizeObserver/`document.fonts.ready`; if a read is unavoidable, do all reads
before any write in that frame. Write a value only when it changed.

R3 **Continuity.** Nothing may step: scroll-progress-driven stages follow a damped progress
(frame-rate independent exponential follow of the scroll target, settles in ~150–250 ms) so iOS's
irregular scroll sampling never shows as steps; state switches (on/off classes) cross-fade
(≥ 180 ms) instead of snapping; stop the loop when settled (idle main thread = 0).

R4 **No CPU rendering paths on phones.** No SVG/CSS filters (`feTurbulence`, `feDisplacementMap`,
`feGaussianBlur`, `filter: url(#…)`) on large or moving areas; no `backdrop-filter` over moving
content (use an opaque/semi-opaque fill); no animated SVG masks over large regions;
`mix-blend-mode` only on small static layers. Pre-render the look into images or WebGL instead.

R5 **Canvas/WebGL.** DPR cap 2 (1.5 for full-screen 2D canvas if needed); draw only when the state
changed; decode before first draw (`decode()`/`createImageBitmap`); a phone page keeps ≤ 64 MB of
decoded image data alive at once (w×h×4); ship phone-sized assets. Shaders: `highp` under
`GL_FRAGMENT_PRECISION_HIGH` (iOS mediump is fp16; large intermediates overflow to NaN = black).

R6 **Media.** Phones get their own encodes/sizes; a background video on a phone ≤ 3 Mbps H.264
High, `preload="metadata"` + poster, never the desktop file. Preload only the current page's LCP.

R7 **Viewport.** Stage sizes in `svh`/`lvh` (static); never re-measure or re-layout on iOS toolbar
height changes (ignore height-only resizes < 160 px); never reset GSAP globals on unmount.

R8 **Load.** No flash after hydration (reveals that start before hydration run in CSS under
`prefers-reduced-motion: no-preference`; never SSR-visible text that GSAP hides then shows); CLS 0.

R9 **Touch.** No scroll-snap on coarse pointers, no scroll hijacking, no non-passive touch/wheel
handlers. Every signature visual state is reached by scrolling (taps are optional extras).

R10 **Reduced motion.** `prefers-reduced-motion: reduce` gets a complete, still document.

## 4. Design quality bar ("圧巻で受賞されるレベル")

- One clear focal point per screen on a phone. No dead stretch (≥ 0.6 screen of photo with no
  content and no motion payoff); if a pause is deliberate, it must carry a visible moment.
- Text never sits on busy texture. Legibility comes from composition (calm areas, the photo's own
  shadow) and soft local shading — never dark blobs or flat black panels. WCAG 2.2 AA measured per
  rendered line (the page's `measure-*-contrast.mjs`).
- Fixed UI (rails, indices, progress) never overlaps body text, controls or the footer on any
  width from 320 to 1440; on phones collapse it to a compact progress cue or hide it.
- Motion explains hierarchy, continuity or feedback; consistent easing from `src/lib/motion.ts`
  (`EASE_REVEAL`, `EASE_STATE`, `EASE_WIPE`); durations 0.3–1.2 s; nothing gimmicky (no sparkles,
  stars, generic fade-up on every block). Prefer one continuous idea per page over many effects.
- Typography: existing fonts and their palt/feature rules; Japanese line breaks never orphan one
  or two characters on 320–430 px; numerals and labels align to a grid.
- Touch targets ≥ 44 px, visible focus, keyboard order matches reading order.
- Keep approved copy, routes, navigation labels (`src/content/adelva-navigation.ts`), CTAs, form
  behaviour, metadata (`pageMetadata`/`pageGraph`, `src/content/site-pages.ts`) and analytics. Do
  not invent claims, numbers, testimonials or new copy; if a layout needs a word changed, write
  the request into your report instead.

## 5. Verification each page agent must deliver

Run on your own production build (`next build` then `next start -p <your port>`; confirm the
served HTML references your `.next/BUILD_ID`):

1. Before/after: `trace-scroll` + `touch-scroll` (cpu 4) at 390×844 and `sweep` sheets at
   390×844, 768×1024 and 1440×900; `webkit-scroll` (iPhone 13). Show numbers and sheets.
2. Phone motion review by eye: record frames of every signature moment (sweep with small steps
   around it) and check for steps, jumps, flashes, overlap.
3. Gates: `pnpm exec prettier --check` and `pnpm exec eslint --max-warnings=0` on changed files,
   `pnpm exec tsc --noEmit`, `pnpm exec vitest run`, the page's Playwright spec(s) with
   `--project=chromium --workers=1`, axe at 1440/768/390, the page's contrast script.
   The default Playwright config runs with reduced motion: add/keep a motion-enabled full-page
   scroll console check.
4. Evidence in `docs/reports/adelva-polish-2026-10-13/<page>/README.md` (Japanese): causes found,
   what changed, before/after numbers, gates with commands and results, open items. Never call an
   unrun check passed.

## 6. Coordination

- Each page agent works only in its own worktree/branch (assigned in its brief) and its own port
  range; never touch the shared main tree `../clonetest` source, other agents' worktrees, `main`,
  or production. Commit on your branch (end messages with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`); never push or deploy — the
  orchestrator integrates and releases.
- Shared components (`site-header.*`, `home/home-footer.*`, `scroll-provider.tsx`,
  `route-transition.tsx`, `src/app/globals.css`, `src/lib/*`) belong to the shared agent. If your
  page needs a change there, write it under "Requests to shared" in your report and work around it
  locally only if it is page-scoped.
- New images: page agents do not generate images. Image agents deliver drop-in replacements
  (same file names and pixel sizes as the masters/assets they replace) into
  `references/adelva/mockups/polish-2026-10-13/<page>/deliver/` in the main tree; the page agent
  integrates them and re-runs contrast checks.
- Resource etiquette (shared 24-core / 39 GB machine with other sessions): Playwright
  `--workers=1`, one Chromium at a time, stop your servers when done, never `pkill -f` a pattern
  that appears in your own command line (use the `[n]ext` bracket trick).

## 7. Known traps (from earlier ADELVA builds)

- `next build` with `CLONETEST_DIST_DIR` rewrites `next-env.d.ts` and tsconfig includes — restore.
- A port that looks free can be answered by another sandbox's server: check the BUILD_ID.
- Production Lenis (desktop only) eases programmatic scrollTo; captures must wait for scrollY.
- `.root img {display:block}` style resets beat module classes — use `:where()`.
- A CSS-module `@media` block placed before a base rule loses to it.
- Custom properties defined on a stage are undefined for fixed UI outside it.
- `gsap.matchMedia` with a conditions object never runs when no condition matches — add an
  always-true condition.
- `color-mix()` computes to `color(srgb …)`; contrast scripts must normalise it.
- WebP alpha drops colour under alpha 0 (encode with exact alpha or give back layers their own
  opaque texture).
- Headless WebKit cannot play H.264 (poster fallback); headless Chromium never fires
  `requestVideoFrameCallback` for paused video.
