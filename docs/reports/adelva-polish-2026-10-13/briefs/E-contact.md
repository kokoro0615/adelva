# Page brief — /contact and /contact/thanks (お問い合わせ, C2「朝霧」)

Worktree `/home/kokoro/projects/clients/clonetest-e-contact`, branch `polish/contact`, ports 4850–4859.
Code `src/components/contact/*` (contact-experience.tsx, contact-photo.tsx, stepping-stones.tsx,
contact-page.tsx, .module.css), `src/app/contact/*`, `src/lib/contact-delivery*`, spec
`docs/specs/adelva-contact-spec.md`, report `docs/reports/adelva-contact-2026-09-29/`, tests
`tests/e2e/contact*.spec.ts`, scripts `scripts/adelva/{measure-contact-contrast,exercise-contact,capture-contact,compare-contact,prepare-contact-assets}.mjs`.

Known issues to fix and go beyond:
1. 10 `backdrop-filter` and 10 `filter: blur` rules over the photo (fields, progress bar, panels) —
   on iOS these re-render under scrolling; replace with pre-composited fills/pools (R4) while
   keeping AA and the misty look.
2. Phone sweep: full screens of photo with nothing (the stream, the inn), "送信後の流れ" text over
   the busy stream, the progress header bar; the form must feel effortless and calm (keyboard on a
   phone: focused field never hidden, no jumps when the keyboard opens/closes, no scroll snap on
   touch — already fine-pointer-only, keep it).
3. Do NOT change submission behaviour or delivery env. Production shows 「現在フォームは準備中です」
   (no CONTACT_WEBHOOK_URL) and links a /privacy page that does not exist — report both as owner
   items; make the "準備中" state look intentional and honest.
4. An image agent is re-rendering the valley as a real photograph (soft translucent fog, natural
   cedars, real stream, a few warm windows) with registered fog-lifted variants. Drop-in masters
   arrive in `/home/kokoro/projects/clients/clonetest/references/adelva/mockups/polish-2026-10-13/contact/deliver/`;
   re-run the prepare script, re-check the clear-variant masks and contrast. Integrate when told.
