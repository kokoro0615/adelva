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
