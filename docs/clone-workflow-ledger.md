# White Desert Clone Workflow Ledger

Last updated: 2026-08-30 JST

## Execution brief

| Field | Decision |
| --- | --- |
| Target | `https://white-desert.com/` (`white-desert.com`) |
| Repository root | `/home/kokoro/projects/clients/clonetest` |
| Deployment intent | Git-backed Vercel deployment; no deployment or production mutation is authorized yet |
| Approver | User in the active Codex thread |
| Operating mode | Visual adaptation until ownership or redistribution permission for the target identity and assets is confirmed |
| Public scope | All discoverable, public, same-origin pages linked by the target's navigation or sitemap; no authenticated, transactional, admin, or adjacent-domain content |
| Locale/theme/state | Public default locale and theme; default plus essential menu, hover, focus, carousel, accordion, form-validation, loading, and reduced-motion states where present |
| Required viewports | `1440x900`, `768x1024`, `390x844` |
| Extraction budget | Two retries per failed route/state observation; bounded same-origin discovery; no access-control bypass |
| Asset budget | Only assets required by approved template families; target assets remain research-only until rights are verified |
| Generation budget | No image generation before direction approval; at most two fresh retries per approved replacement-asset direction |
| Stop conditions | Access-control bypass, unclear protected-identity use, unresolved asset rights, contradictory observations, missing deterministic external-reference comparison, material accessibility/security/performance conflict, or missing mandatory release gate |

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

| Gate | Evidence required | Status |
| --- | --- | --- |
| 0 — Scope and rights | Execution brief, operating mode, approver, bounded crawl and asset rules | Pass with visual-adaptation restriction |
| 1 — Repository truth | Independent Git baseline, detected stack/scripts/routes/tests, invariant ledger, baseline checks | In progress |
| 2 — Reconnaissance | Route inventory, topology, deterministic screenshots, state and motion observations | Pending |
| 3 — Specification | Measured implementation specs with raster mapping, geometry, states, motion, a11y, performance, tolerances | Pending |
| 4 — Asset provenance | Owner/license/status/loading/alt intent for every production asset | Pending |
| 5 — Implementation | Semantic responsive code preserving all approved invariants | Pending |
| 6 — Fidelity | Target-vs-local artifacts and discrepancy ledger at every template/state/viewport | Pending |
| 7 — Release | Mandatory technical gates and final `sol/xhigh` live-browser review | Pending |

## Functional invariants

The source repository is initially empty. Target-derived invariants are pending reconnaissance. At minimum the implementation must preserve:

- every approved public route and internal navigation destination;
- global navigation, menu, footer, anchor, and back/forward behavior;
- keyboard access, focus order, visible focus, Escape/return-focus behavior, and accessible names;
- semantic heading and landmark order, metadata, canonicals, and crawlable links;
- meaningful hover/touch alternatives and `prefers-reduced-motion` behavior;
- validation and error behavior for any recreated non-submitting demonstration form;
- stable media dimensions, responsive crops, and no critical content dependent on motion or hover.

## Active specification

- Design Read: pending live reconnaissance. No aesthetic invention will override measured target evidence.
- Named direction: target-faithful refined expedition editorial, subject to confirmation from target captures.
- Signature element: pending motion study; only one dominant signature move per template will be retained.
- Stack: pending repository scaffold decision after route and behavior audit.
- Production copy/identity: provisional and blocked from final approval until approved by the user.

## Asset provenance summary

| Class | Production status | Rule |
| --- | --- | --- |
| Target screenshots | Research-only | External fidelity references; never shipped as page content |
| Target logos, photos, video, fonts, icons, copy | Research-only | Require owner/license evidence before production use |
| Code-native layout and motion | Allowed | Original implementation informed by measured observations |
| Generated replacement media | Pending approval | Must be original, inspected, and recorded in a separate manifest |
| Repository-authored screenshots | Test artifacts only | Regression evidence, never external-reference proof |

## State and viewport matrix

| Template/state | 1440x900 | 768x1024 | 390x844 | Motion pass | Reduced-motion pass |
| --- | --- | --- | --- | --- | --- |
| Route inventory pending | Pending | Pending | Pending | Pending | Pending |

## Unresolved differences and blockers

- The target route inventory, copy ownership, brand identity, and asset rights are not yet verified.
- The project has no application scaffold or quality-gate scripts yet.
- The external-reference capture and comparator are not yet configured.
- Final Vercel deployment remains out of scope until the user authorizes the consequential external action.

## Evidence log

| Date | Evidence | Result |
| --- | --- | --- |
| 2026-08-30 | `git rev-parse --show-toplevel` before initialization | Resolved to `/home/kokoro/projects`; project was not independent |
| 2026-08-30 | `git init -b main` in the project root | Independent local repository created; baseline commit pending |
| 2026-08-30 | Loaded `context-loader`, `clone-website`, `image-to-code`, fidelity loop, `ui-ux-pro-max`, and `design-tracker` | Mandatory workflow contracts reviewed before product work |
