# Release coverage matrix

Status: execution checklist, not a test result. The source of truth is
[`scripts/fidelity/route-manifest.mjs`](../../../scripts/fidelity/route-manifest.mjs):
29 routes, 15 exact family values, and the named `desktop`, `tablet`, and
`mobile` viewports. The redirect family is an exact manifest value even though
it has no rendered page template.

## Viewports, state scope, and evidence rules

| Name      | CSS viewport | Required capture                                                     |
| --------- | -----------: | -------------------------------------------------------------------- |
| `desktop` |   `1440x900` | default and every applicable state                                   |
| `tablet`  |   `768x1024` | default and every applicable state; touch/press equivalent for hover |
| `mobile`  |    `390x844` | default and every applicable state; touch/press equivalent for hover |

State abbreviations used below:

- `D` — loaded default at `scrollY=0`, plus declared scroll landmarks and footer where the family is long-form.
- `M` — global menu open and closed; Escape closes it and focus returns to the invoking control.
- `H` — pointer hover on desktop and press/touch equivalent on tablet/mobile; every hover affordance has a keyboard-visible equivalent.
- `F` — keyboard traversal, visible focus, logical order, and no focus loss during transitions.
- `T` — tabs/filter states only when a target capture proves the control exists: selected/unselected, pointer, keyboard, and activation result.
- `E` — `/enquire` only: pristine, focused, filled, invalid, valid, and blocked local-only submit.
- `R` — `prefers-reduced-motion: reduce`: static final layout, native scroll, no motion-dependent content.
- `X` — `/antarctica` redirect response: status, `Location`, chain, final URL, and canonical behavior.

`D` is required for all 28 rendered routes at all three viewports. The 29th
manifest record, `/antarctica`, is covered by `X` at all three viewport
contexts; its final destination is covered by the rendered-route `D` row. For
the 28 rendered routes, `M/H/F/R` require a screenshot and interaction proof for one
representative per exact rendered family at all three viewports, plus a route
behavior assertion for every route; any route-specific control adds a capture
for that route. `T` is presence-verified per route/family and is never
invented. `E` is required at all three viewports. `X` is required for the
redirect request at all three named viewport contexts, even though the HTTP
response itself should not depend on viewport.

## 29 routes → 15 exact families and representatives

The `stem` is `routeSlug(path)` from the fidelity script. A default target
capture is `artifacts/reference/target/<stem>-<width>x<height>-top.png`; the
matching local capture is under `artifacts/reference/actual/`.

|   # | Route                                      | Exact family            | Family representative                 | Stem                                       | Required state scope                                               |
| --: | ------------------------------------------ | ----------------------- | ------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
|   1 | `/`                                        | `home`                  | `/`                                   | `home`                                     | `D`; representative `M/H/F/T?/R`                                   |
|   2 | `/itineraries`                             | `itinerary-index`       | `/itineraries`                        | `itineraries`                              | `D`; representative `M/H/F/T?/R`                                   |
|   3 | `/camps`                                   | `camp-index`            | `/camps`                              | `camps`                                    | `D`; representative `M/H/F/T?/R`                                   |
|   4 | `/about/founders`                          | `about-story`           | `/about/founders`                     | `about--founders`                          | `D`; representative `M/H/F/T?/R`                                   |
|   5 | `/about/foundation`                        | `about-foundation`      | `/about/foundation`                   | `about--foundation`                        | `D`; representative `M/H/F/T?/R`                                   |
|   6 | `/about/sustainability`                    | `about-sustainability`  | `/about/sustainability`               | `about--sustainability`                    | `D`; representative `M/H/F/T?/R`                                   |
|   7 | `/antarctica/behind-the-scenes`            | `operations`            | `/antarctica/behind-the-scenes`       | `antarctica--behind-the-scenes`            | `D`; representative `M/H/F/T?/R`                                   |
|   8 | `/antarctica`                              | `region-index-redirect` | `/antarctica`                         | `antarctica`                               | `X` only; destination is `/antarctica/wolfs-fang-runway-mountains` |
|   9 | `/prices`                                  | `rates`                 | `/prices`                             | `prices`                                   | `D`; representative `M/H/F/T?/R`                                   |
|  10 | `/enquire`                                 | `enquiry-form`          | `/enquire`                            | `enquire`                                  | `D/M/H/F/T?/R` plus all `E` states                                 |
|  11 | `/legal/website-terms`                     | `legal`                 | `/legal/privacy-policy`               | `legal--website-terms`                     | `D`; representative `M/H/F/T?/R`; route-specific legal geometry    |
|  12 | `/legal/booking-terms`                     | `legal`                 | `/legal/privacy-policy`               | `legal--booking-terms`                     | `D`; representative `M/H/F/T?/R`; route-specific legal geometry    |
|  13 | `/legal/privacy-policy`                    | `legal`                 | `/legal/privacy-policy`               | `legal--privacy-policy`                    | `D/M/H/F/T?/R` representative                                      |
|  14 | `/legal/cookies`                           | `legal`                 | `/legal/privacy-policy`               | `legal--cookies`                           | `D`; representative `M/H/F/T?/R`; route-specific legal geometry    |
|  15 | `/legal/medical-disclaimer`                | `legal`                 | `/legal/privacy-policy`               | `legal--medical-disclaimer`                | `D`; representative `M/H/F/T?/R`; route-specific legal geometry    |
|  16 | `/camps/echo-base`                         | `camp-detail`           | `/camps/echo-base`                    | `camps--echo-base`                         | `D/M/H/F/T?/R` representative                                      |
|  17 | `/camps/explorer-camp`                     | `camp-detail`           | `/camps/echo-base`                    | `camps--explorer-camp`                     | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  18 | `/camps/whichaway-camp`                    | `camp-detail`           | `/camps/echo-base`                    | `camps--whichaway-camp`                    | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  19 | `/itineraries/discovery-week`              | `itinerary-detail`      | `/itineraries/south-pole-blue-rivers` | `itineraries--discovery-week`              | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  20 | `/itineraries/south-pole-emperor-penguins` | `itinerary-detail`      | `/itineraries/south-pole-blue-rivers` | `itineraries--south-pole-emperor-penguins` | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  21 | `/itineraries/south-pole-blue-rivers`      | `itinerary-detail`      | `/itineraries/south-pole-blue-rivers` | `itineraries--south-pole-blue-rivers`      | `D/M/H/F/T?/R` representative                                      |
|  22 | `/itineraries/antarctica-in-a-day`         | `itinerary-day`         | `/itineraries/antarctica-in-a-day`    | `itineraries--antarctica-in-a-day`         | `D/M/H/F/T?/R` explicit day variant                                |
|  23 | `/itineraries/early-emperor-penguins`      | `itinerary-detail`      | `/itineraries/south-pole-blue-rivers` | `itineraries--early-emperor-penguins`      | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  24 | `/itineraries/the-long-stay`               | `itinerary-detail`      | `/itineraries/south-pole-blue-rivers` | `itineraries--the-long-stay`               | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  25 | `/antarctica/wolfs-fang-runway-mountains`  | `region-detail`         | `/antarctica/polar-plateau`           | `antarctica--wolfs-fang-runway-mountains`  | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  26 | `/antarctica/schirmacher-oasis`            | `region-detail`         | `/antarctica/polar-plateau`           | `antarctica--schirmacher-oasis`            | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  27 | `/antarctica/polar-plateau`                | `region-detail`         | `/antarctica/polar-plateau`           | `antarctica--polar-plateau`                | `D/M/H/F/T?/R` representative                                      |
|  28 | `/antarctica/atka-penguin-colony`          | `region-detail`         | `/antarctica/polar-plateau`           | `antarctica--atka-penguin-colony`          | `D`; representative `M/H/F/T?/R`; route data/geometry              |
|  29 | `/antarctica/fuel-depot`                   | `region-detail`         | `/antarctica/polar-plateau`           | `antarctica--fuel-depot`                   | `D`; representative `M/H/F/T?/R`; route data/geometry              |

There are 14 rendered-family representatives (all exact families except
`region-index-redirect`). The `itinerary-day` value remains distinct; it must
not be silently folded into `itinerary-detail` in route data or evidence names.

## State capture and comparison evidence

Use the same Chromium version, DPR 1, light color scheme, locale/timezone,
network policy, readiness wait, and route/state/scroll position for target and
local. Every state runner must emit a JSON record containing route, exact
family, state, viewport, requested URL, response status, redirect chain,
`Location`, final URL, canonical (where applicable), `scrollY`, `scrollHeight`,
font/image readiness, browser metadata, reduced-motion preference, landmark
geometry/names, and a screenshot hash. A screenshot by itself is not proof.

| State              | Target evidence                                                                                                                                                      | Local evidence                                                                                   | Comparison/proof path                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D` default        | Existing top references for all 29 routes × 3 viewports are under `artifacts/reference/target/`; rerun after target conditions change. Add landmark/scroll captures. | Capture all 29 × 3 against the production build at `http://127.0.0.1:4173`.                      | `artifacts/reference/{target,actual}/capture-manifest.json`; PNGs named `<stem>-<width>x<height>-top.png`; discrepancy records under `artifacts/fidelity/`.         |
| `M` menu           | Capture open/closed and Escape/return-focus for one representative per rendered family × 3; behavior-check all 28 rendered routes.                                   | Same matrix and all-route behavior checks.                                                       | `artifacts/reference/{target,actual}-states/<stem>/menu-{open,closed}-<viewport>.png` plus `state-manifest.json`.                                                   |
| `H` hover/touch    | Capture each observed interactive control class on representatives × 3; target hover must have a touch/keyboard equivalent.                                          | Same states; prove no layout shift and an equivalent non-hover action.                           | `artifacts/reference/{target,actual}-states/<stem>/hover-<control>-<viewport>.png` and interaction JSON.                                                            |
| `F` focus          | Keyboard focus sequence for all interactive routes; representative screenshots at each family × 3.                                                                   | Same sequence, including menu interruption and focus restoration.                                | `artifacts/reference/{target,actual}-states/<stem>/focus-{header,primary-control,footer}-<viewport>.png` and focus-order JSON.                                      |
| `T` tabs           | Presence-check every route/family; if present, capture selected/unselected and keyboard/pointer activation.                                                          | Match every observed target tab/filter state; record `not-present` rather than inventing one.    | `artifacts/reference/{target,actual}-states/<stem>/tabs-{unselected,selected}-<viewport>.png` or `state-manifest.json` absence record.                              |
| `E` form           | `/enquire` only, all three viewports; never submit target data.                                                                                                      | `/enquire` pristine/focused/filled/invalid/valid/blocked local-only submit, all three viewports. | `artifacts/reference/{target,actual}-states/enquire/form-{pristine,focused,filled,invalid,valid,blocked-submit}-<viewport>.png`; values must not leave the browser. |
| `R` reduced motion | Representatives × 3 plus all-route behavior check; compare static final state to no-preference without hiding content.                                               | Same, with native scroll and no transform/loop dependency.                                       | `artifacts/reference/{target,actual}-states/<stem>/reduced-motion-<viewport>.png` and motion metrics/JSON.                                                          |
| `X` redirect       | `/antarctica` at each viewport context; record initial status/headers, chain, final URL, and canonical.                                                              | Same local proof; expected destination `/antarctica/wolfs-fang-runway-mountains`.                | `artifacts/release/redirect/{target,actual}.json` and raw headers; no page screenshot is required for an HTTP redirect.                                             |

For state captures not supported by the current top-capture script, add a
reviewed Playwright harness before release and run:

```sh
pnpm exec playwright test tests/e2e/release-coverage.spec.ts --project=chromium
```

The harness should write the paths above; `tests/e2e/release-coverage.spec.ts`
does not exist in the current checkout, so this command is a required future
gate, not a reported result.

The current target top set is evidence only: `capture.mjs` always creates a
context with `reducedMotion: "reduce"`, captures only `scrollY=0`, and records
neither the full redirect chain nor canonical, scroll height, readiness flags,
landmark geometry, or screenshot hashes. Run a separate `no-preference`
capture for normal default/motion evidence. The existing target manifest has
87 PNG records and a `capture-manifest.json`; `/antarctica` currently records a
`200` response with the destination as `finalUrl`, which does not prove an
HTTP-level redirect.

## Exact capture and fidelity commands

Run the local server from a separate shell after `pnpm build`:

```sh
pnpm start --port 4173
```

Then run the existing default/top capture commands:

```sh
pnpm capture:reference
LOCAL_BASE_URL=http://127.0.0.1:4173 pnpm capture:actual
```

The scripts write target files to
`artifacts/reference/target/` and local files to
`artifacts/reference/actual/`. A focused rerun is exact and useful for one
route/viewport, for example:

```sh
pnpm capture:reference -- --route=/camps/echo-base --viewport=desktop
LOCAL_BASE_URL=http://127.0.0.1:4173 pnpm capture:actual -- --route=/camps/echo-base --viewport=desktop
```

Compare every matching target/local pair (87 default pairs, then each state
pair) with the existing diagnostic comparator. Example:

```sh
pnpm fidelity:reference -- \
  --reference=artifacts/reference/target/home-1440x900-top.png \
  --actual=artifacts/reference/actual/home-1440x900-top.png \
  --label=home--default--desktop \
  --out=artifacts/fidelity
```

This creates `artifacts/fidelity/home--default--desktop-{overlay,difference,
side-by-side,metrics}.{png,json}`. Repeat with each route stem and viewport;
the comparator's global pixel metrics are diagnostic only. Acceptance comes
from a predeclared discrepancy ledger containing expected value, observed
value, tolerance, artifact path, and disposition. Do not replace missing
local captures with target images.

Redirect proof must be collected independently of the current screenshot
manifest. The preferred release harness writes JSON; raw HTTP evidence can be
retained as:

```sh
mkdir -p artifacts/release/redirect
curl -sS -D artifacts/release/redirect/target-initial.headers -o /dev/null https://white-desert.com/antarctica
curl -sS -L -D artifacts/release/redirect/target-chain.headers -o /dev/null -w '%{http_code}\t%{url_effective}\n' https://white-desert.com/antarctica
curl -sS -D artifacts/release/redirect/actual-initial.headers -o /dev/null http://127.0.0.1:4173/antarctica
```

## Release gates and proof artifacts

Use `set -o pipefail` when teeing logs so a failing command remains failing.
The current `pnpm verify` chain omits axe, visual/reference fidelity, motion,
and performance, so it is only a convenience check and cannot be the release
proof by itself.

| Gate                  | Exact command                                                                                                                                | Required proof/artifact                                                                                         | Current coverage gap                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format                | `pnpm format:check`                                                                                                                          | `artifacts/release/format.log`                                                                                  | No current release run is asserted here; format the new document only during this task.                                                                                 |
| Lint                  | `pnpm lint`                                                                                                                                  | `artifacts/release/lint.log`                                                                                    | Must rerun after application changes; no result is claimed.                                                                                                             |
| Typecheck             | `pnpm typecheck`                                                                                                                             | `artifacts/release/typecheck.log`                                                                               | Must rerun after application changes; no result is claimed.                                                                                                             |
| Unit                  | `pnpm test:unit`                                                                                                                             | `artifacts/release/unit.log`, Vitest report/output                                                              | Current unit spec checks only application/fidelity manifest equality and redirect data; it does not render all routes or states.                                        |
| Smoke                 | `pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium`                                                                       | `artifacts/release/smoke.log`, `playwright-report/`, `test-results/`                                            | Current smoke tests cover only `/` landmark/navigation and the home skip link.                                                                                          |
| Axe                   | `pnpm test:axe`                                                                                                                              | `artifacts/release/axe.log`, `playwright-report/`, `test-results/`                                              | Current axe list is 8 routes, default state only, one Chromium project, and the config forces reduced motion. It does not cover all 29 routes, states, or viewports.    |
| Visual regression     | `pnpm test:visual`                                                                                                                           | `artifacts/release/visual.log`, `tests/e2e/visual.spec.ts-snapshots/`, `test-results/`                          | Current visual spec covers only home at the three viewports; it is implementation-authored regression, not target fidelity.                                             |
| Target/local fidelity | `pnpm capture:reference`; `LOCAL_BASE_URL=http://127.0.0.1:4173 pnpm capture:actual`; repeat `pnpm fidelity:reference -- ...` for every pair | `artifacts/reference/target/`, `artifacts/reference/actual/`, `artifacts/fidelity/`, discrepancy ledger JSON/MD | Target top PNGs exist, but local/state/fidelity outputs are absent in the current tree; the current comparator is pairwise diagnostic and has no acceptance thresholds. |
| Motion/reduced motion | `pnpm exec playwright test tests/e2e/release-coverage.spec.ts --project=chromium` with both `no-preference` and `reduce` contexts            | State manifests, reduced-motion screenshots, motion metrics under `artifacts/reference/{target,actual}-states/` | No motion/state spec exists; current Playwright config sets `reducedMotion: "reduce"`, so it cannot prove normal motion.                                                |
| Performance           | `pnpm exec playwright test tests/e2e/performance.spec.ts --project=chromium` (required new harness)                                          | `artifacts/release/performance/metrics.json`, `artifacts/release/performance.log`, trace files                  | No performance script/spec exists. Gate is blocked until LCP, INP, CLS, JS/CSS/media transfer, and long-task measurements are implemented.                              |
| Production build      | `pnpm build`                                                                                                                                 | `artifacts/release/build.log`, `.next/` output, route manifest from build                                       | Ledger records an earlier partial build exposing only `/404`; current application changes require a fresh build result.                                                 |

Performance acceptance uses the provisional specification caps until explicitly
revised: LCP `≤2.5s`, INP `≤200ms`, CLS `≤0.1`, initial route JS `≤200KB` gzip,
critical CSS `≤50KB` gzip, above-fold media `≤1MB` compressed per viewport, and
no post-ready long task over `200ms`. Measure representative menu,
carousel/accordion (if present), and form interactions as well as route load.

## Current test and evidence gaps (observed, not pass/fail claims)

- `tests/unit/route-manifest.test.ts` verifies manifest alignment and the
  redirect data array only; it does not prove Next's HTTP redirect, page
  rendering, metadata, content, or interaction behavior.
- `tests/e2e/smoke.spec.ts` exercises only `/`; it has no 29-route navigation,
  menu, hover/touch, focus restoration, tabs, form, reduced-motion, or redirect
  assertions.
- `tests/e2e/accessibility.spec.ts` runs axe on eight hand-picked routes only
  (`/`, `/itineraries`, one camp detail, one itinerary detail, one region
  detail, `/prices`, `/enquire`, and one legal page), in default loaded state.
  It does not cover the other 21 routes, all three viewports, or interactive
  states.
- `tests/e2e/visual.spec.ts` captures only home at the three viewports. The
  current checkout has no `tests/e2e/visual.spec.ts-snapshots/` directory, so
  no baseline result is assumed.
- The Playwright config has one Chromium project and globally requests
  `reducedMotion: "reduce"`; no no-preference motion proof, mobile device
  context, state harness, performance harness, or redirect-chain harness is
  present.
- `artifacts/reference/target/` contains 87 existing target top PNGs and a
  manifest, but `artifacts/reference/actual/`, target/local state evidence,
  and `artifacts/fidelity/` have no current release output. Existing target
  files remain research-only and are not local regression proof.
- `package.json` has no performance command, and `pnpm verify` does not invoke
  axe, visual, reference fidelity, motion, or performance gates. No command in
  this document should be reported as passed until it is run against the
  completed application and its log/artifact is inspected.
