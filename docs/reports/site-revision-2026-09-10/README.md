# ADELVA revision — 2026-09-10

## Implemented

- Shared header: larger ADELVA mark and wordmark (desktop 44px / 30px,
  mobile 32px / 21px), adjusted spacing and bar height. Removed cases navigation
  and About disclosure; About links directly to `/about` on desktop and mobile.
- HOME: removed the English hero standfirst. Preserved Japanese copy verbatim;
  purpose is two visual lines at desktop, readable flowing text on smaller screens.
  Founder statement uses four sentence paragraphs with balanced line wrapping.
- Challenges: removed news and original NOSIGNER footer. Reuses `HomeFooter`,
  including working top link. Fixed conflicting floating contact control at footer.
- Contact: reconstructed the specified MORGHT contact geometry at all three
  viewports with ADELVA header/footer, local fonts, accessible native form controls,
  validation and error focus. UI only: no endpoint, no transmission, no invented
  privacy URL. Values remain local; JavaScript-disabled interaction cannot submit.
- Approach: live inspection showed the existing path animation worked, but heading
  and summary had no reveal and the 50% base path obscured progress. Added scoped
  scroll reveals, clearer base/progress contrast and stage text transitions.
  Preserved forward/reverse progress and authored reduced-motion fallback.
- Deployment: pnpm install/build overrides in `vercel.json`; explicit resolver
  build policy fixes first-install failure. Preserved the complete 420.928-second
  film in a 53,139,369-byte web rendition (1280×720 H.264/AAC). Original 235 MB
  master remains local and excluded from Git; no duration/content truncation.

## Files and authority

Main implementation: `src/components/site-header.{tsx,module.css}`,
`src/content/adelva-navigation.ts`, `src/components/home/`,
`src/app/globals.css`, `src/components/nosigner/`, `src/app/contact/page.tsx`,
`src/components/contact/`, `src/components/route-shell.tsx`.
Durable IA update: `docs/specs/adelva-navigation-spec.md`. Current task contract:
[implementation-spec.md](implementation-spec.md),
`docs/clone-workflow-ledger.md`. Asset sources, owners, rights and loading intent
are recorded in `docs/asset-provenance.md`; no target assets were newly copied
into production. Contact reference images are research-only. Adjacent ADELVA
reuse and Git/Vercel publication were explicitly authorized by the user.
No subagents were used. The adjacent dirty worktree was not changed.

## Verification

- Formatting: PASS, `format.log`.
- Lint and typecheck: PASS, including a clean staged checkout, `staged-checks.log`.
- Unit: 100/100 PASS in the working tree and clean staged checkout.
- Production build: PASS from clean staged checkout, `build.log`.
- Existing Chromium e2e: 251/251 PASS, `e2e.log`; includes axe, video/dialog,
  navigation, remaining legacy routes, motion preferences and three HOME goldens.
- HOME focused interactions: 7/7 PASS, `home-refresh.log`.
- Current revision: 10/10 PASS, `revision-tests.log`; requested routes, form,
  motion/reverse/reduced-motion and JavaScript-disabled behavior.
- Accessibility: zero axe WCAG 2.2 AA-tagged violations on `/`, `/challenges`,
  `/about`, `/contact`, at 1440×900, 768×1024 and 390×844. Keyboard menu opening,
  Escape/focus restoration, error focus, shared footer and overflow checked.
- Contact external-reference gate: all measured heading/form/select/textarea
  landmarks within declared tolerances at all three sizes. Maximum coordinate
  deviation is below 0.3px. `contact-fidelity.json` contains numeric results;
  `contact-{width}.png`, overlays and diffs were visually reviewed against original
  `references/morght/contact/reference-{width}.png` captures at equal scale.
  Pixel MAE is diagnostic (about 0.20/0.20/0.25), not a claimed literal pixel match:
  ADELVA identity/footer, categories, UI-only notice, accessible borders and 16px
  inputs, and CSS ambience are declared adaptations.

Final screenshot evidence covers all requested routes/sizes: HOME regression
images in `tests/e2e/visual.spec.ts-snapshots/`; purpose, statement, approach,
challenges, about, common footer and invalid contact images in this directory;
full contact pages and reference comparisons here. Obsolete and duplicate task
screenshots were removed. Historical source references and regression goldens
were retained.

## Test migration and limits

Six old White Desert HOME suites asserted superseded globe/CPT–WFR layouts and
retired navigation. They were preserved intact in `tests/historical/`, not counted
as passing. Active replacements exercise the current ADELVA contracts; unchanged
legacy route tests remain active. External reference fidelity is kept separate
from implementation-authored HOME regression images.

Contact delivery and a published privacy policy intentionally remain unconnected
under the user's UI-only instruction. Mobile purpose text wraps beyond two lines
so it remains readable. Unrelated pre-existing local changes/research files are
preserved. This is the initially empty GitHub repository's first application push,
so the commit includes the existing production application needed for deployment.
