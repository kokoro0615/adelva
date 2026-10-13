# Page brief — /approach (支援の進め方: the dive through six finder windows)

Worktree `/home/kokoro/projects/clients/clonetest-e-approach`, branch `polish/approach`, ports 4830–4839.
Code: `src/components/approach/*` (approach-motion.tsx, approach-page.tsx, .module.css), content
`src/content/adelva-approach-page.ts`, spec `docs/specs/adelva-approach-spec.md`, tests
`tests/e2e/approach*.spec.ts`, assets via `scripts/adelva/prepare-approach-assets.mjs` (masters in
`assets/source/generated/adelva/approach-page-2026-09-26/` in the main tree).

Known causes (phones):
1. The dive pins the hero with ScrollTrigger `pin` (fixed swap) → jumps at pin start/end on iOS.
   Rebuild the dive as a sticky stage (R1) with damped progress (R3), same choreography: finder
   corners, zoom into the finder, stage 01 opening out of it.
2. Stage photographs and magnification lines are scrubbed transforms on in-flow content → they lag
   and swim under the finger. Make each stage's "focus" open inside a sticky frame or as a
   time-based reveal triggered at the reading line, keeping the magnification lines locked to the
   finder corners with no lag.
3. Phone layout: large dark gaps (a whole screen of near-black between stages), the descent rail on
   the right edge competing with content, the role bars section (外部関係者 etc.) and the checks
   section — raise the craft: rhythm, alignment, typographic finish, one focal point per screen.
4. Image agent: the zoom chain (river aerial → ryokan → entrance → lobby → reception → hanging
   scroll, hero cloud forest, integrated, ridge) is being re-rendered as real photographs with the
   same compositions (no mirror-wet floors, no glowing lanterns, natural colour). Drop-in masters
   (same names/sizes) arrive in
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/approach/deliver/`;
   integrate when told and re-run `scripts/adelva/measure-approach-contrast.mjs`.
