# Page brief — HOME `/` (A2r3 "two viewpoints, one line")

Worktree `/home/kokoro/projects/clients/clonetest-e-home`, branch `polish/home`, ports 4820–4829.
Code: `src/components/home-a2/*` (engine.ts, mobile.ts, desktop.ts, shared.ts, gl.ts,
home-page.tsx, home.module.css), `src/content/adelva-home*.ts`, tests `tests/e2e/home*.spec.ts`.
Background: `docs/specs/` HOME spec + memory notes in the report folders of 2026-10-02.
HOME was rebuilt on 2026-10-02 from the user-adopted A2r3 prototype; keep its concept, plates and
choreography. Its photographs read as real and are NOT re-rendered.

Known causes (phones) — fix and keep going:
1. `mobile.ts` writes `left/top/width/height` every frame for the expertise bands, labels and joins
   and reads `offsetHeight`/`getBoundingClientRect` in the same frame (labels, cards `[data-more]`,
   purpose block, header brand word, challenges rail track). Move to transforms (translate/scale on
   pre-sized layers, clip via inner transforms) with geometry cached on resize/fonts.
2. The spine: `height` + a regenerated `mask-image` gradient string per frame. Use a fixed-size
   element with scaleY/translate and pre-built gap masks (or two segments) instead.
3. Pano and lake WebGL draw every frame while visible even when nothing changes; draw only on
   state change (scroll progress, damped values, the clock only where something visibly moves).
4. The hero film: phones get `/media/video/hero-antarctica-portrait.mp4` = 1080×1920 H.264 at
   10 Mbps (40 MB) with `preload="auto"`. The real source is a ~244×432 crop, upscaled. Make a
   phone encode (H.264 High, ≤ 3 Mbps, e.g. 720×1280 or 810×1440, keyframes every 2 s, faststart)
   from `/home/kokoro/projects/_tools/video/output/aman-film-v3-lab/renders/final/portrait-h264-l41.mp4`
   (review the exact file you ship by eye on frames; read `docs/asset-provenance.md` and keep it
   current), `preload="metadata"` with the poster, start playing only when visible; desktop keeps
   its file. Watch the encode for banding in skies/mist.
5. Damped progress (R3): iOS delivers scroll irregularly; scenes must not step.
6. Dead stretches on the phone: several screens are almost empty paper (the purpose text alone;
   a blank fog/paper screen before the founder letter; the "支援の進め方" intro). Tighten scroll
   lengths and timings so every screen carries a moment, without changing the order or copy.
7. Check the header (brand fly-in from the giant ADELVA word, surfaces) for flashes on load and
   the film's pause control (44 px, visible focus).
Run the existing HOME e2e and its contrast/fidelity checks (see scripts/adelva/verify-home-contrast.mjs).
