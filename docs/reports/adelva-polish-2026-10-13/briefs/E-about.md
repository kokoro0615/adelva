# Page brief — /about (ADELVAについて, A2「INK TO LIFE」)

Worktree `/home/kokoro/projects/clients/clonetest-e-about`, branch `polish/about`, ports 4840–4849.
Code `src/components/about/*` (about-motion.tsx, front-renderer.ts = WebGL ink→photo front,
marks.ts, about-page.tsx, .module.css), spec `docs/specs/adelva-about-a2-spec.md`, tests
`tests/e2e/about*.spec.ts`, scripts `scripts/adelva/{measure-about-contrast,prepare-about-assets}.mjs`.

Known issues to fix and go beyond:
1. Phone sweep: the vertical side index (役割/支援領域/支援スタンス/会社概要) is squeezed against the
   right edge and overlaps imagery; orange rings over images; the photo cards; the company table;
   make every screen intentional and the ink→life moment the clear hero.
2. Motion: scrubbed pin segment (`[data-pin]`, scrub 0.8, `ScrollTrigger.refresh` calls), zone
   trigger with per-scroll rect reads, leader measurement — apply R1–R3. WebGL front: highp under
   GL_FRAGMENT_PRECISION_HIGH (an iOS fp16 NaN bug was fixed here on 10-01 — keep it), draw only on
   change, DPR cap. The paper grain background is an SVG feTurbulence data-URI (static, fine if not
   animated — verify).
3. An image agent is re-rendering the ink drawing (real hand-made sumi-e on washi) and the photo
   (authentic garden photograph), registered to each other. Drop-in masters arrive in
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/about/deliver/`;
   re-run the prepare script, check registration of the ink→photo transition, re-measure contrast.
   Integrate when told.
