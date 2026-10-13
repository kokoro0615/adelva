# Page brief — /challenges/general-managers (総支配人・現場責任者の方へ, 棚田「一筋の朝の光」)

Worktree `/home/kokoro/projects/clients/clonetest-e-general-managers`, branch
`polish/general-managers`, ports 4870–4879.
Base: the 2026-10-01 revision is already committed on your branch (commit 8aee993; report
`docs/reports/adelva-general-managers-2026-10-01/README.md` — read its §4 perf table and §5 open
points). Code `src/components/general-managers/*`, spec `docs/specs/adelva-general-managers-spec.md`
(§13 is the revision), tests `tests/e2e/general-managers.spec.ts`, scripts
`scripts/adelva/{measure-general-managers-contrast,capture-general-managers-keyframes,compare-general-managers,prepare-general-managers-assets}.mjs`.
The user's 10-01 feedback (binding): "タップしないと色が変わらない等、わざわざタップしないと思います" —
every payoff must come from reading/scrolling; this revision did that; now make it flawless on phones.

Known issues to fix and go beyond:
1. Phone sweep of the old prod build: the fixed right-edge vertical rail (01 現場課題 … 07 お問い合わせ)
   overlaps body text and runs over the footer; text sits over busy reflections; the page is one
   long photo with text everywhere — find rhythm (calm areas, breathing room, one focal point).
2. The revision's own perf notes: p95 frame time up vs prod at 390 (33→50 ms) and 4 long tasks;
   finish the job (R1–R4): no per-frame layout reads, no large moving blend layers, damped progress,
   the light drop crossing levees must be continuous on iOS (no steps).
3. Scroll handlers in `gm-experience.tsx` loop `getBoundingClientRect` over sections on scroll and
   set React state — move to IntersectionObserver / cached offsets.
4. 1024–1279 px had special handling (full-width grade, collapsed index) — keep it working.
5. An image agent is re-rendering the terraces as a real photograph (grass levees, modest outlets
   kept as a real irrigation channel for the 05 light, natural dawn reflections). It delivers new
   masters (same names/sizes) into
   `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/general-managers/deliver/`;
   you then re-run the prepare script (lit overlays are derived from water masks with a colour
   threshold — make sure they still work), re-measure contrast, and re-tune scrims/pools if the
   new photo is calmer or brighter. Integrate when the orchestrator tells you they are ready.
