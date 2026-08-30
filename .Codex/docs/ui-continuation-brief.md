# Opus UI continuation brief

Resume the interrupted UI implementation in
`/home/kokoro/projects/clients/clonetest`. The previous Opus session stopped
only because the Claude subscription session limit was reached. Do not restart
or discard the current uncommitted `src/**` work.

First read `.Codex/docs/ui-implementation-brief.md` again and inspect all current
`src/**` files. Preserve the typed content and CSS that are already useful, but
correct anything that conflicts with the measured implementation spec.

## Verified interruption state

- Foundation recovery baseline: Git commit `2e5e9a5`.
- Fidelity/tooling checkpoint: Git commit `cf0483d`.
- `pnpm typecheck` passes on the partial files.
- Current files include global CSS, route/assets/types/shared content, the home
  document, and itinerary documents.
- The application is not connected: `src/app/layout.tsx`, route pages, shared
  components, and client interaction components are missing.
- Only home and itinerary-family content is substantially defined. Camps,
  About, Operations, Rates, Enquire, Legal, and Region content remain.
- `/antarctica` now has a tested Next configuration redirect to
  `/antarctica/wolfs-fang-runway-mountains`; preserve it rather than adding a
  duplicate client redirect.
- No application unit tests exist yet. Ensure Vitest does not collect tests in
  the `tools/design-extract` submodule.

## Continuation order

1. Build the App Router entry points and the smallest shared renderer/component
   set so the current home and itinerary documents render.
2. Add the missing content families and map every non-redirect manifest route.
3. Preserve and verify the existing `/antarctica` HTTP redirect; do not add a
   client-side duplicate.
4. Connect the accessible menu, tabs, local-only enquiry form, `next/image`,
   `data-fidelity-landmark` hooks, reduced-motion behavior, and scoped GSAP
   enhancements.
5. Reconcile the CSS with the measured 12-column grid and the three viewport
   captures without copying target assets or copy.
6. Add focused application tests and exclude the submodule from Vitest
   discovery.
7. Run and fix format, lint, typecheck, unit tests, build, Playwright smoke, and
   axe. Do not commit, deploy, update references, or weaken tests.

Return a concise changed-file and verification summary when complete.

Before implementing menu/motion details, read the newer
`.Codex/docs/research/white-desert-interaction-state-audit.md` and
`.Codex/docs/research/release-coverage-matrix.md`. The target-state audit adds
desktop-drawer, tablet-fullscreen, and mobile-fullscreen menu measurements and
proves target Escape/focus/reduced-motion defects that production must improve.
