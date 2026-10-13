# Page brief — /services/revenue-brand (river "a light carried down the river")

Worktree `/home/kokoro/projects/clients/clonetest-e-revenue-brand`, branch `polish/revenue-brand`,
ports 4890–4899.
Code: `src/components/revenue-brand/*` (revenue-brand-motion.tsx, river-lines.tsx, chip-group.tsx,
revenue-brand-page.tsx, .module.css), geometry `src/content/*revenue-brand*`, spec
`docs/specs/adelva-revenue-brand-spec.md`, tests `tests/e2e/revenue-brand*.spec.ts`, assets via
`scripts/adelva/prepare-revenue-brand-assets.mjs` (masters in the main tree
`assets/source/generated/adelva/revenue-brand-2026-09-28/`).

Known causes (phones):
1. The reflected-title ripple: `feTurbulence` + `feDisplacementMap` applied as CSS
   `filter: url(#rb-ripple)` to HTML, its scale following scroll velocity — Safari renders it on
   the CPU every frame. Replace with a cheap, GPU-friendly equivalent (pre-rendered displacement
   frames, a small WebGL quad, or a transform-only shimmer) or drop it on coarse pointers.
2. The river lines: nested SVG masks (`text-mask`, `solid`, lake clip) with a per-frame comet head
   and tail; 301 forced layouts from one call site (`ea`) during one scroll. Pre-flatten paths
   (already partly done), cache lengths/positions, avoid mask repaints over large areas (draw the
   comet into a canvas/WebGL layer or animate stroke-dashoffset on unmasked paths), damped progress.
3. Viewfinder/chips/related cards: check every state for steps and overlaps on 320–430 px; the
   service list over the bright river must stay legible.
4. An image agent is re-rendering the plates as real photographs (the river stops glowing; natural
   forest and mist; the lake's glowing orb and mirror reflections become natural). Drop-in masters
   with the same names/sizes arrive in
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/revenue-brand/deliver/`;
   your river-line geometry stays valid. Keep colour logic independent of exact pixel values;
   integrate when told (re-run the contrast script then).
