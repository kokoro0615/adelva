# Project Design Decisions

## Overview

Build a Git-backed, Vercel-ready visual adaptation of the public White Desert site with measurable multi-route fidelity, original/approved production identity and assets, semantic Next.js code, WCAG 2.2 AA, and deterministic motion/fidelity verification.

## Architecture

- Next.js `16.3.3` App Router with React `19.2.8` and strict TypeScript.
- Server Components own static route shells and content; client components are limited to navigation, media controls, carousels, form state, and measured motion.
- CSS owns ordinary hover/focus/open transitions. GSAP + ScrollTrigger owns only measured pin/scrub/horizontal choreography; Lenis is desktop enhancement and never replaces native scroll semantics.
- Playwright captures target and implementation under identical named viewports. Reference fidelity and local visual regression remain separate gates.

## Key Decisions

| Date       | Decision                                                                                                                                                      | Rationale                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Initialize `/home/kokoro/projects/clients/clonetest` as an independent Git repository with the workflow ledger as the recoverable baseline.                   | The parent catalog repository does not track active client payloads and project rules block implementation without an independent baseline.                                     |
| 2026-08-30 | Operate as a visual adaptation until identity, copy, font, and media rights are documented.                                                                   | Public visibility is not redistribution permission; target assets remain research-only.                                                                                         |
| 2026-08-30 | Reconstruct 29 sitemap routes through reusable template families and route data rather than 29 unrelated page implementations.                                | Browser evidence shows shared home, index, about, operation, rates, enquiry, legal, camp-detail, itinerary-detail, and region-detail systems.                                   |
| 2026-08-30 | Use Next.js/React/pnpm and Vercel-compatible static/server rendering.                                                                                         | The target is Next.js on Vercel, the requested deployment is Vercel, and the empty repository provides no conflicting stack invariant.                                          |
| 2026-08-30 | Use GSAP/ScrollTrigger + Lenis only for long measured scroll choreography; keep UI state motion in CSS.                                                       | This matches the target's Lenis/scroll-driven behavior while minimizing bundle cost and preserving accessible native interaction.                                               |
| 2026-08-30 | Treat `ui-ux-pro-max` recommendations as advisory below measured target evidence and repository accessibility rules.                                          | Its parallax-storytelling match is useful, but its pink accent and Inter recommendation conflict with target measurements and the project typography rule.                      |
| 2026-08-30 | Pin design-extract as a research-only Git submodule and accept only human-reviewed measurements.                                                              | The extractor improves token, layout, responsive, and motion reconnaissance, but its heuristic output and extracted assets are not authoritative or licensed production inputs. |
| 2026-08-30 | Use nine original generated Antarctic photographs as the production media world, with source PNGs outside `public/` and inspected WebP derivatives inside it. | This preserves the target's photographic scale and cold editorial atmosphere without redistributing or hotlinking target media; provenance and prompts remain reviewable.       |
| 2026-08-30 | Require a final `gpt-5.6-sol` / `xhigh` live-browser audit.                                                                                                   | This is an explicit acceptance requirement from the user.                                                                                                                       |

## Open Questions

- Has the user obtained redistribution permission for White Desert identity, copy, photography, video, logos, and fonts?
- What original or client-owned brand identity and approved copy should replace protected target content if permission is unavailable?
- Which Git remote will provide off-machine recovery and Vercel integration?

## Changelog

| Date       | Change                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Recorded the clone operating mode, independent baseline, route-template strategy, Next.js/GSAP/Lenis stack, design-extract boundary, source-of-truth precedence, and final audit requirement. |
