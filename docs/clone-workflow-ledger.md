# White Desert Clone Workflow Ledger

Last updated: 2026-08-30 JST

## Execution brief

| Field              | Decision                                                                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target             | `https://white-desert.com/` (`white-desert.com`)                                                                                                                                                                                                         |
| Repository root    | `/home/kokoro/projects/clients/clonetest`                                                                                                                                                                                                                |
| Deployment intent  | Git-backed Vercel deployment; no deployment or production mutation is authorized yet                                                                                                                                                                     |
| Approver           | User in the active Codex thread                                                                                                                                                                                                                          |
| Operating mode     | Visual adaptation until ownership or redistribution permission for the target identity and assets is confirmed                                                                                                                                           |
| Public scope       | All discoverable, public, same-origin pages linked by the target's navigation or sitemap; no authenticated, transactional, admin, or adjacent-domain content                                                                                             |
| Locale/theme/state | Public default locale and theme; default plus essential menu, hover, focus, carousel, accordion, form-validation, loading, and reduced-motion states where present                                                                                       |
| Required viewports | `1440x900`, `768x1024`, `390x844`                                                                                                                                                                                                                        |
| Extraction budget  | Two retries per failed route/state observation; bounded same-origin discovery; no access-control bypass                                                                                                                                                  |
| Asset budget       | Only assets required by approved template families; target assets remain research-only until rights are verified                                                                                                                                         |
| Generation budget  | No image generation before direction approval; at most two fresh retries per approved replacement-asset direction                                                                                                                                        |
| Stop conditions    | Access-control bypass, unclear protected-identity use, unresolved asset rights, contradictory observations, missing deterministic external-reference comparison, material accessibility/security/performance conflict, or missing mandatory release gate |

## Authorization and rights posture

- The user explicitly requested a full-site clone and stated an intent to deploy through Git and Vercel.
- Ownership or redistribution permission for White Desert's identity, copy, photographs, video, logos, and fonts has not been supplied.
- Until permission is documented, protected target content is research-only. Production must use an original identity, approved copy, and owned/licensed/generated replacement media while preserving only the measured structure, interaction model, responsive behavior, and motion language.
- No forms will be submitted, no purchases or bookings will be initiated, and no target data will be uploaded or mutated during reconnaissance.

## Workflow review

The loaded `clone-website` and `image-to-code` contracts are suitable as the production workflow, with the following project-specific hardening:

1. Establish an independent Git repository and recoverable baseline before product implementation.
2. Maintain this ledger before any product edits.
3. Discover and group all public routes into reusable template families before implementation.
4. Capture external target references at the three required viewports under deterministic conditions.
5. Record motion as trigger, initial/final state, duration, easing, interruption, focus impact, mobile alternative, and reduced-motion fallback.
6. Configure an external-reference fidelity command before production UI edits; implementation-authored screenshots remain regression-only.
7. Keep a production asset provenance manifest and exclude unverified target assets from the deployable bundle.
8. Require fresh lint, typecheck, unit, Playwright, axe, external-reference visual, motion, and production-build evidence.
9. Reserve the final interactive browser audit for a `gpt-5.6-sol` agent with `xhigh` reasoning, as explicitly requested.

## Workflow gates

| Gate                 | Evidence required                                                                                          | Status                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 0 — Scope and rights | Execution brief, operating mode, approver, bounded crawl and asset rules                                   | Pass with visual-adaptation restriction     |
| 1 — Repository truth | Independent Git baseline, detected stack/scripts/routes/tests, invariant ledger, baseline checks           | Pass for pre-implementation tooling         |
| 2 — Reconnaissance   | Route inventory, topology, deterministic screenshots, state and motion observations                        | Pass for 29 default-route states            |
| 3 — Specification    | Measured implementation specs with raster mapping, geometry, states, motion, a11y, performance, tolerances | Pass for implementation; final diff pending |
| 4 — Asset provenance | Owner/license/status/loading/alt intent for every production asset                                         | Pass for nine original replacements         |
| 5 — Implementation   | Semantic responsive code preserving all approved invariants                                                | In progress; Opus session interrupted       |
| 6 — Fidelity         | Target-vs-local artifacts and discrepancy ledger at every template/state/viewport                          | Pending                                     |
| 7 — Release          | Mandatory technical gates and final `sol/xhigh` live-browser review                                        | Pending                                     |

## Functional invariants

The source repository began empty. The 29-route manifest and measured specification now define the bounded target-derived invariants. At minimum the implementation must preserve:

- every approved public route and internal navigation destination;
- global navigation, menu, footer, anchor, and back/forward behavior;
- keyboard access, focus order, visible focus, Escape/return-focus behavior, and accessible names;
- semantic heading and landmark order, metadata, canonicals, and crawlable links;
- meaningful hover/touch alternatives and `prefers-reduced-motion` behavior;
- validation and error behavior for any recreated non-submitting demonstration form;
- stable media dimensions, responsive crops, and no critical content dependent on motion or hover.

## Active specification

- Design Read: cinematic expedition editorial with oversized condensed display type, serif narrative accents, restrained utilitarian controls, cool photographic fields, and long-form spatial storytelling. Measured target evidence overrides generated recommendations.
- Named direction: target-faithful visual adaptation using original or explicitly approved production identity, copy, fonts, and media.
- Signature element: one measured scroll-led spatial sequence per long-form template; routine feedback remains restrained CSS motion.
- Stack: Next.js 16.3.3, React 19.2.8, strict TypeScript, pnpm 11.22.0, Playwright, axe, Vitest, GSAP/ScrollTrigger, and optional desktop Lenis enhancement.
- Production copy/identity: provisional and blocked from final approval until approved by the user.
- Supplemental extraction: design-extract 13.1.0 is pinned at Git SHA `f7c2bec6631bca0da6e8f1a0162d1917bbd46c0c` and is research-only. Its measurements require browser/screenshot corroboration and are never auto-applied.

## Asset provenance summary

| Class                                           | Production status     | Rule                                                                                                    |
| ----------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| Target screenshots                              | Research-only         | External fidelity references; never shipped as page content                                             |
| Target logos, photos, video, fonts, icons, copy | Research-only         | Require owner/license evidence before production use                                                    |
| Code-native layout and motion                   | Allowed               | Original implementation informed by measured observations                                               |
| Generated replacement media                     | Recorded replacements | Nine original assets are inspected and documented; final art direction remains subject to user approval |
| Repository-authored screenshots                 | Test artifacts only   | Regression evidence, never external-reference proof                                                     |

## State and viewport matrix

| Template/state               | 1440x900 | 768x1024 | 390x844  | Motion pass | Reduced-motion pass |
| ---------------------------- | -------- | -------- | -------- | ----------- | ------------------- |
| `home` target/default/top    | Captured | Captured | Captured | Measured    | Pending             |
| Remaining 14 exact families  | Captured | Captured | Captured | Pending     | Pending             |
| Menu/hover/focus/form states | Pending  | Pending  | Pending  | Pending     | Pending             |

## Unresolved differences and blockers

- Copy ownership, brand identity, font licensing, and target media rights are not verified; production content remains blocked or replacement-only.
- The 29-route inventory and all default top-of-page viewport references are verified. Menu, hover, focus, form, reduced-motion, and deeper per-route comparison states remain incomplete.
- Application work is partial: typed route/content foundations, responsive CSS, and the `/antarctica` HTTP redirect exist, but App Router entry points, shared renderers, non-itinerary content families, and interactions remain incomplete. The first Opus implementation session ended at its subscription session limit and is resumable from the documented continuation brief.
- design-extract core and responsive runs succeeded; `--full` interaction capture exceeded the bounded smoke duration and is isolated for debugging. Its heuristic accessibility score is not release evidence.
- The target interaction audit proves material accessibility defects (Escape/focus containment/restoration and reduced-motion behavior). These are intentional non-fidelity boundaries: production must preserve the visual state while meeting the stricter specification.
- The default fidelity batch gate is correctly blocked until all 87 local captures exist; no target-only or missing-local comparison can be reported as passed.
- The independent repository still has no remote, so off-machine recovery and Git-to-Vercel integration remain unresolved.
- Final Vercel deployment remains out of scope until the user authorizes the consequential external action.

## Evidence log

| Date       | Evidence                                                                                                        | Result                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | `git rev-parse --show-toplevel` before initialization                                                           | Resolved to `/home/kokoro/projects`; project was not independent                                                                |
| 2026-08-30 | `git init -b main` in the project root                                                                          | Independent local repository created; baseline commit pending                                                                   |
| 2026-08-30 | Loaded `context-loader`, `clone-website`, `image-to-code`, fidelity loop, `ui-ux-pro-max`, and `design-tracker` | Mandatory workflow contracts reviewed before product work                                                                       |
| 2026-08-30 | Baseline commit `7a8f939`                                                                                       | Ledger-only independent recovery point created                                                                                  |
| 2026-08-30 | Real-browser sitemap/navigation audit                                                                           | 29 public same-origin routes and 15 exact manifest families recorded                                                            |
| 2026-08-30 | Playwright target capture for `/`                                                                               | Exact 1440x900, 768x1024, and 390x844 PNG references captured at DPR 1                                                          |
| 2026-08-30 | Full Playwright target route capture                                                                            | 87 default/top references: 29 routes × 3 named viewports; manifest scale 1×1                                                    |
| 2026-08-30 | Strict image-to-code preflight audit                                                                            | 20 pass, 0 warn, 0 block                                                                                                        |
| 2026-08-30 | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`                                                              | Passed after pinning ESLint 9.39.5 and TypeScript 6.0.3 to peer-compatible versions                                             |
| 2026-08-30 | design-extract SHA `f7c2bec…`: `npm ci --ignore-scripts`, `npm test`                                            | 0 vulnerabilities; 589 tests passed                                                                                             |
| 2026-08-30 | design-extract core/runtime-motion and responsive smoke captures                                                | Completed in 15.8 s and 48.7 s; outputs saved under `.Codex/docs/research/design-extract/`                                      |
| 2026-08-30 | Foundation checkpoint `2e5e9a5`                                                                                 | Measured specs, 87 references, pinned extractor, original asset set, and quality tooling recorded                               |
| 2026-08-30 | First Opus implementation session                                                                               | Added typed route/assets/content foundations and responsive CSS; stopped at external session limit before App Router connection |
| 2026-08-30 | Partial-state `pnpm lint`, `pnpm typecheck`, and `pnpm build`                                                   | Lint/typecheck passed; build compiled but exposed only `/404`, proving application routing is incomplete                        |
| 2026-08-30 | Target interaction audit                                                                                        | 19 state captures cover desktop/tablet menus, mobile menu/focus, empty enquiry, and reduced/no-preference motion; no submission |
| 2026-08-30 | Route/config manifest tests                                                                                     | 29 paths/families, 28 rendered routes, and the implemented `/antarctica` redirect remain aligned                                |
| 2026-08-30 | Filtered target capture CLI smoke                                                                               | One 390x844 DPR-1 PNG plus a motion/filter-aware manifest were written without overwriting the 87-reference set                 |
| 2026-08-30 | `pnpm fidelity:reference`                                                                                       | Batch CLI preflights 87 pairs and stops with a concise missing-actual report; synthetic tests prove four artifacts per pair     |
| 2026-08-30 | `pnpm extract:design -- --help`                                                                                 | Package-command separator handling fixed; safe wrapper help exits successfully without extraction                               |
| 2026-08-30 | Partial-state unit suite                                                                                        | 4 Vitest files, 22 tests passed; typecheck and lint passed after CLI boundary fixes                                             |
