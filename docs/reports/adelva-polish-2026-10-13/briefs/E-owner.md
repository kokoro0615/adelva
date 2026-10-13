# Page brief — /challenges/owner (オーナー・経営者の方へ, B2「囲炉裏」)

Worktree `/home/kokoro/projects/clients/clonetest-e-owner`, branch `polish/owner`, ports 4860–4869.
Code `src/components/owner/*` (owner-motion.ts, owner-experience.tsx, hearth-photo.tsx, owner-index.tsx,
owner-page.tsx, .module.css), spec `docs/specs/adelva-owner-spec.md`, report
`docs/reports/adelva-owner-2026-09-30/`, tests `tests/e2e/owner*.spec.ts`, scripts
`scripts/adelva/{measure-owner-contrast,capture-owner,compare-owner,prepare-owner-assets}.mjs`.

Known issues to fix and go beyond:
1. Phone sweep: long stretches of near-empty earthen floor (several screens with only a cushion or
   firewood and no content or moment) — give each screen purpose: shorten, or make the pause carry
   the light/ember moment; the fixed right-edge index (01–06) overlaps text on phones.
2. `owner-motion.ts` writes `style.height/top` of the scale trail per frame and reads rects of rows
   and rings on scroll; `owner-experience.tsx` loops `getBoundingClientRect` over sections on scroll
   and sets React state. Moving `mix-blend-mode` layers (3) and `filter: blur` (4) over the photo.
   Apply R1–R4; keep the CSS-only dawn wipe at load (no hydration flash).
3. The chosen-bay light and ember breath must be continuous (no steps) on iOS; signature states
   reachable by scrolling only.
4. An image agent is re-rendering the farmhouse as a real photograph (matte soot-dark wood, subtle
   window light through faint smoke, real embers). It delivers new masters (same names/sizes) into
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/owner/deliver/`;
   re-run the prepare script (ember layer is derived from hot pixels — check it), re-measure
   contrast and re-tune the CSS light/pools to the new photo. Integrate when told.
