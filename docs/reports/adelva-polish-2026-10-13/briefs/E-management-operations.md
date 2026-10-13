# Page brief — /services/management-operations (B 台杉 "descending morning")

Worktree `/home/kokoro/projects/clients/clonetest-e-management-operations`, branch
`polish/management-operations`, ports 4880–4889.
Code: `src/components/management-operations/*` (camera-motion.ts = < 1024 px canvas camera,
desktop-motion.ts, management-operations-page.tsx, .module.css), geometry
`src/content/adelva-management-operations-geometry.ts`, spec
`docs/specs/adelva-management-operations-spec.md`, tests `tests/e2e/management-operations*.spec.ts`.
Assets `public/media/adelva/management-operations/*` were copied from the B-hq prototype build
(`references/adelva/mockups/management-operations-B-hq-2026-10-01/build/assets`).

Known causes (phones):
1. A fixed full-screen 2D canvas is redrawn every frame from many large WebP layers (base ×5,
   dim, blur, lit, grove2x ×2, lit2x ×2, sky, warm-*) with `imageSmoothingQuality = "high"` and
   offscreen `destination-in` composites; ~188 MB of decoded images on a phone. Highest rAF cost
   per scrolled px of the site. Redesign the renderer for phones: e.g. WebGL with textures uploaded
   once and the layer mix/masks in a shader, phone-sized textures (≤ 64 MB decoded alive at once,
   load/unload by camera window), draw only on change, damped camera (R3). Keep the exact camera
   path and the light states (dawn, rack focus, light band, warm knuckles, young tree).
2. Body text over busy bark (サービスの違い list over the twisted trunk on phones) — legibility by
   composition (camera framing that puts calm fog behind text) plus soft local shading, AA measured.
3. Fork/boundaries pin and steps: check for jumps (R1/R3) and dead stretches (long photo-only
   screens of straight trunks).
4. An image agent is re-rendering the plate family as a real photograph (the twisted, melted
   base becomes a real daisugi stock; no rim glow). It will deliver drop-in files with the same
   names and pixel sizes into
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/management-operations/deliver/`.
   Make your renderer independent of exact pixel colours (thresholds) so the new plates drop in;
   integrate them when the orchestrator tells you they are ready (re-check contrast then).
