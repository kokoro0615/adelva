# Safe research wrapper for design-extract

This repository pins the official [Manavarya09/design-extract](https://github.com/Manavarya09/design-extract) repository as the `tools/design-extract` git submodule and invokes it for research only through `scripts/extraction/run-design-extract.mjs`. The target site is restricted to `https://white-desert.com`, which is the approved scope for this task.

## Pin, license, and rights

- The submodule is pinned to commit [`f7c2bec6631bca0da6e8f1a0162d1917bbd46c0c`](https://github.com/Manavarya09/design-extract/commit/f7c2bec6631bca0da6e8f1a0162d1917bbd46c0c). The [`package.json`](https://raw.githubusercontent.com/Manavarya09/design-extract/f7c2bec6631bca0da6e8f1a0162d1917bbd46c0c/package.json) at that commit reports version `13.1.0`. The wrapper checks the SHA, package version, and dirty state of the submodule before every run.
- The upstream [`LICENSE`](https://github.com/Manavarya09/design-extract/blob/main/LICENSE) is MIT. If the submodule source or a substantial portion of it is redistributed, retain the MIT permission text and copyright notice (`Copyright (c) 2024 Manavarya Singh`). Keep the inherited notice with the redistribution.
- MIT is the license for the tool itself; it does not grant rights to extracted white-desert.com logos, images, fonts, copy, CSS, screenshots, or other target-derived assets. Keep extraction results for research, and obtain individual approval and rights clearance before moving values, copy, or assets into a production artifact.

## Version drift and installation

The `main` package version `13.1.0`, npm registry `latest` (currently `12.21.0`), and the GitHub tag/release listing (currently showing `v12.15.0` as the latest) do not match. Therefore, do not follow npm or tags; use the submodule gitlink and the SHA above as the update unit. Verify primary evidence in [upstream package.json](https://github.com/Manavarya09/design-extract/blob/main/package.json), [npm metadata](https://registry.npmjs.org/designlang), [tags](https://github.com/Manavarya09/design-extract/tags), and [releases](https://github.com/Manavarya09/design-extract/releases).

For the initial dependency installation (run inside the submodule):

```sh
cd tools/design-extract
npm ci --ignore-scripts
```

`--ignore-scripts` avoids the upstream postinstall step that automatically installs Chromium and OS dependencies. The wrapper fixes `--system-chrome`, so the runtime must provide a managed system Chrome. `npm ci` uses the submodule's `package-lock.json` and pinned commit; it does not change the root pnpm lockfile.

## Safe execution

```sh
# core: DOM/CSS and runtime motion. Output: .Codex/docs/research/design-extract/home-core/
node scripts/extraction/run-design-extract.mjs \
  https://white-desert.com/ \
  --slug home-core \
  --mode core

# responsive: adds responsive capture at multiple viewports.
node scripts/extraction/run-design-extract.mjs \
  https://white-desert.com/ \
  --slug home-responsive \
  --mode responsive
```

`--mode core` terminates the child process after 90 seconds; `--mode responsive` terminates it after 150 seconds. The only permitted target is the exact `https://white-desert.com` hostname (including paths and queries below it). HTTP, `file:`, localhost, private hosts, non-default ports, and URLs containing credentials are rejected. The slug is restricted to ASCII values that cannot escape the output directory.

The wrapper always passes `--system-chrome --ignore-widgets --no-history --motion-runtime` to the upstream CLI and adds `--responsive` only in responsive mode. It does not accept or forward `--full`, `--smart`, `--insecure`, `--cookie`, `--cookie-file`, `--header`, `--apply`, or `--clone`, and it never interpolates the target input into a shell command (Node's argument array is passed to `spawnSync`).

## Browser runtime and security

The upstream [crawler](https://github.com/Manavarya09/design-extract/blob/main/src/crawler.js) opens the target in headless system Chrome and uses in-page `evaluate` to read the DOM, computed styles, CSS, images, and `document.getAnimations()`. Additional CSS retrieval uses `fetch` in the page context, so treat this as browser processing that executes target JavaScript and retrieves external resources (fact from the upstream implementation). The wrapper starts a fresh Playwright context and passes no cookies, headers, authenticated profile, `--insecure`, or LLM smart provider.

This is not a trust boundary. Chrome and Node run with the OS permissions of the execution user, so use a dedicated user or isolated environment without secrets, a managed Chrome installation, and public targets for which permission has been granted (safe-operational inference). Do not crawl a target without its owner's permission, and review the output because it may retain URLs, external stylesheets, and target-derived assets.

## Extracted outputs and scope

Core output includes DOM elements and regions, component clusters, computed styles, CSS variables, media queries, keyframes, DTCG tokens for colors/typography/spacing and related values, CSS/Tailwind/TypeScript definitions, image and icon metadata, accessibility and CSS health, component-library detection, intent, visual DNA, brand voice, MCP JSON, and motion tokens/CSS/GSAP/WAAPI outputs. Runtime motion observes the page's `document.getAnimations()` while the page is running, providing clues about duration, easing, stagger, and scroll choreography that static CSS alone may not expose.

Responsive adds breakpoint capture and layout/token differences across viewports, providing initial evidence for `clonetest` comparisons at `1440x900`, `768x1024`, and `390x844`. However, this is heuristic observation across limited viewports and interactions; it cannot fully prove cross-origin stylesheets, delayed states, server-side conditions, or animations that did not fire. Do not import it directly into production UI; pass existing rights, copy, accessibility, and responsive-fidelity review first.

## Verified commands and known issue

The following are the evidence commands already run against this pinned submodule and target (589 tests passed; core `15.8s`; responsive `48.7s`). The `time` values are environment-dependent; on rerun, confirm that execution remains within the wrapper timeout.

```sh
(cd tools/design-extract && npm test) # 589 tests pass
time node scripts/extraction/run-design-extract.mjs https://white-desert.com/ --slug home-core --mode core # 15.8s
time node scripts/extraction/run-design-extract.mjs https://white-desert.com/ --slug home-responsive --mode responsive # 48.7s
```

Upstream `--full` enables deep interaction and additional captures, but an interaction hang is under investigation. The wrapper intentionally does not use `--full`; it provides only the bounded core/responsive observations with runtime motion.
