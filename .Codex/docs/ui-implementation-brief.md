# Opus UI implementation brief

You are the single production owner for the application UI in this repository.
Work directly in `/home/kokoro/projects/clients/clonetest` and implement the
measured visual adaptation now. You are not alone in the repository: preserve
the existing foundation commit and do not revert or reformat unrelated research,
tooling, provenance, generated source assets, or docs.

## Read before editing

Read these files completely, then inspect the relevant source and tests:

1. `AGENTS.md`
2. `docs/clone-workflow-ledger.md`
3. `docs/specs/clone-implementation-spec.md`
4. `.Codex/docs/research/white-desert-route-inventory.md`
5. `scripts/fidelity/route-manifest.mjs`
6. `design-system/white-desert-visual-adaptation/MASTER.md`
7. `docs/asset-provenance.md`
8. `docs/generated-asset-prompts.md`
9. `.Codex/docs/research/design-extract/home-responsive/white-desert-home-responsive-design-language.md`
10. `.Codex/docs/research/design-extract/home-responsive/white-desert-home-responsive-design-tokens.json`
11. `.Codex/docs/research/design-extract/home-responsive/white-desert-home-responsive-motion-tokens.json`
12. Existing `tests/`, configuration, and `package.json`

Use the measured specification and target captures as the authority when they
conflict with heuristic design-extract output. Target captures are research-only
and live under `artifacts/reference/target/`; inspect representative originals
for each template family at 1440x900, 768x1024, and 390x844. Do not copy or
embed pixels, text, logos, fonts, video, or remote assets from the target.

## Scope and ownership

Own application UI files under `src/**` and the application-focused test edits
needed under `tests/**`. You may make narrow application-related adjustments to
configuration only if necessary. Do not edit the pinned `tools/design-extract`
submodule, raw extraction research, source PNGs, provenance, workflow ledger,
fidelity scripts, or generated prompts. Do not commit or deploy.

Implement every route in `route-manifest.mjs`, including the observed
`/antarctica` redirect to `/antarctica/wolfs-fang-runway-mountains`. Prefer a
small set of shared, data-driven template families over route duplication.
Ensure every non-redirect route renders a real, distinct page state, not a stub.

## Rights-safe content and assets

- This is a visual adaptation because target brand/copy/media rights are not
  confirmed. Use an unmistakably original neutral identity: `ANTARCTIC FIELD
NOTES`, paired with an original CSS/SVG-free typographic/mountain mark.
- Use only the nine production WebP assets already listed in
  `docs/asset-provenance.md` and stored in `public/media/`. Never use target
  images, target video, hotlinks, third-party logos, or remote fonts.
- Write compact original editorial copy about landscape, field operations, and
  responsible observation. Do not invent testimonials, awards, customer names,
  prices, trip availability, dates, response-time promises, scientific claims,
  environmental claims, or legal terms.
- On rates and legal pages, preserve the measured layout with clearly labeled
  owner-supplied-content placeholders rather than fake commercial/legal facts.
- The enquiry form is a local UI demonstration only. It must not submit data to
  a server. Provide a clear explanatory note and an accessible local-only state.

## Required visual behavior

- Reproduce the measured composition: subtle full-height 12-column grid,
  near-full-viewport photographic heroes, translucent rectangular navigation,
  centered monumental serif/italic/condensed editorial headings, dark navy and
  ice-white sections, an orange action accent, edge-to-edge imagery, and bottom
  hero tabs where the template requires them.
- Match all three breakpoint states, especially the three-part 390px header,
  legible mobile title scaling, intentional image crops, safe horizontal tab
  scrolling, and no accidental body overflow.
- Make the page depth and section rhythm credible for every family: hero,
  editorial statement, alternating image/text stories, facts or itinerary
  sequence where appropriate, related-card rail, restrained CTA, and footer.
- Use semantic landmarks and add stable `data-fidelity-landmark` attributes to
  the primary hero, first major content section, CTA, and footer.
- Use local/system font stacks only. A high-contrast editorial serif, a narrow
  display stack, and a clean sans stack should approximate the measured roles.
- Use `next/image` for production WebP media with accurate `sizes`, priority only
  on the hero/LCP asset, and lazy loading below the fold.

## Interaction, motion, and accessibility

- Match the newly measured menu geometry in
  `.Codex/docs/research/white-desert-interaction-state-audit.md`: at 1440px the
  active top tab opens a 464px-wide white drawer over a 15px-blurred backdrop;
  at 768px the same top bar opens a full-viewport white accordion menu; at
  390px the header is the three-part Menu/identity/Enquire composition and the
  full-screen panel places Close/Home/three accordion rows above full-width
  Dates & Prices and orange Enquire actions.
- Preserve the target's roughly 300ms tab feedback and 400ms backdrop fade,
  including the orange active/hover state, without copying the target's
  accessibility defects.
- Build an accessible desktop/mobile menu with visible focus, escape-to-close,
  restored focus, correct `aria-expanded`, scroll locking, and keyboard order.
- Unlike the audited target, contain focus while the modal menu is open, do not
  allow background controls into the tab order, and return focus to the opener
  after every close path.
- Tabs/filters must work with pointer and keyboard and retain visible selected
  state. Links must go to existing routes.
- Use CSS transitions for small UI states. Use GSAP through `@gsap/react` only
  for meaningful reveal/parallax sequences, scoped with cleanup. Use Lenis only
  on capable desktop motion preferences if it materially improves the measured
  experience; native scroll must remain complete without JavaScript.
- Match the measured timing family: roughly 300–450ms state transitions,
  1000–1400ms hero/reveal motion, and restrained 2000ms ambient accents.
- Under `prefers-reduced-motion: reduce`, disable smooth scrolling, parallax,
  transform travel, autoplay-like ambient motion, and long transitions.
- This reduced-motion behavior is an intentional improvement: the target audit
  proves its Lenis, GSAP transforms, and 1.4-second reveal remain active under
  `reduce`; do not reproduce that defect.
- Target WCAG 2.2 AA: skip link, semantic headings, descriptive image alt intent,
  44px mobile targets, focus visibility, contrast, zoom/reflow, no information
  encoded by color alone, and accessible local form status.

## Tests and verification

Add focused Vitest coverage for route/template data and any pure behavior that
merits it. Adjust Playwright tests to validate the real UI without weakening the
existing intent. Run, fix, and report fresh results for:

1. `pnpm format`
2. `pnpm format:check`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test:unit`
6. `pnpm build`

If time permits, also run the Playwright smoke and axe suites. Do not update
reference captures and do not hide failures by weakening tests. Finish with a
concise summary of changed files, implemented routes/templates, commands, and
remaining issues.
