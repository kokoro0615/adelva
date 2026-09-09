# Repository Working Agreement

- Treat this directory as the independent project and Git root.
- Use `pnpm`; do not create another JavaScript lockfile.
- Follow `docs/clone-workflow-ledger.md` before changing production UI.
- Keep target screenshots and third-party assets research-only until rights are verified.
- Preserve the external-reference fidelity gate separately from implementation-authored visual regression.
- Required viewports are `1440x900`, `768x1024`, and `390x844`.
- Required release gates are format, lint, typecheck, unit, Playwright, axe, visual/reference fidelity, and production build.
- Use semantic HTML, WCAG 2.2 AA, keyboard-first interaction, and an authored `prefers-reduced-motion` fallback.
- Use CSS for ordinary state transitions. Use GSAP/ScrollTrigger only for measured scroll choreography, with `useGSAP`, scoped refs, and cleanup.
- Do not deploy, publish, submit target forms, or mutate production without explicit human approval.
- Before reporting completion, remove task-created intermediate, obsolete, and duplicate screenshots. Keep final deliverables, original references, reusable assets, and required regression goldens; do not delete unrelated files. Record necessary verification results without retaining unnecessary screenshot copies.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
