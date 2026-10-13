# Page brief — /services/dx-it-procurement (DX・IT・調達基盤, cliff "foundation")

Worktree `/home/kokoro/projects/clients/clonetest-e-dx-it-procurement`, branch
`polish/dx-it-procurement`, ports 4900–4909.
Code `src/components/dx-it-procurement/*`, spec `docs/specs/adelva-dx-it-procurement-spec.md`,
report `docs/reports/adelva-dx-it-procurement-2026-09-28/`, tests `tests/e2e/dx*.spec.ts`, scripts
`scripts/adelva/{measure-dx-it-procurement-contrast,verify-dx-it-procurement-runtime,prepare-dx-it-procurement-assets}.mjs`.

Known issues to fix and go beyond:
1. SVG `mask="url(#dxPower)"` and an `feGaussianBlur` soft mask on large areas, box-glow gradients,
   6 `mix-blend-mode` rules; scroll trackers with layout reads (`dx-it-procurement-motion.tsx`).
   Apply R1–R4 (pre-render glows/masks into images or cheap transforms).
2. Phone layout: whole screens of black rock texture with little content, the service list cards
   (サービスの違い) as an ivory panel over rock, the step list with orange conduit boxes — raise the
   craft and rhythm; the conduit/power-on motion must be continuous and reached by scrolling.
3. An image agent is re-rendering the cliff, rooms, conduit and dawn arch as a real architectural
   photograph (real granite, plausible building, the orange line as a physical LED strip). Drop-in
   masters (same names/sizes, incl. the registered "-off" layers) arrive in
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/dx-it-procurement/deliver/`;
   re-run the prepare script, re-check the power-off registration and contrast. Integrate when told.
