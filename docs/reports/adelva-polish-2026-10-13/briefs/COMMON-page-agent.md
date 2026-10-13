# Common brief for every page agent (ADELVA site polish 2026-10-13)

You are one of several Opus 5.5 page agents. The orchestrator (also Opus 5.5) split the work so
each page gets full attention; you own ONE page (or the shared chrome) end to end and must bring
it to award level on phones first, without regressing desktop.

Read first, in this order:
1. `/home/kokoro/projects/clients/clonetest-polish/docs/specs/adelva-polish-2026-10-13.md` — the
   shared contract (findings, mobile motion rules R1–R10, design bar, verification, coordination,
   traps). It is binding.
2. Your page brief (the file that pointed you here).
3. Your page's existing spec in `docs/specs/` and its latest report in `docs/reports/` (if any),
   and the code. Understand why the page is built the way it is before changing it: the motion
   ideas were approved by the user; your job is to make them feel flawless and to raise the craft,
   not to replace the concept.

Working rules:
- Work only in your worktree (given in your page brief) on its branch. Run every command from that
  worktree root. Use only your port range. Production-like checks run on `next build` +
  `next start` (`node node_modules/next/dist/bin/next start -p <port> -H 127.0.0.1`), and you
  confirm the served HTML contains your `.next/BUILD_ID`.
- Untracked masters (generated plates, mock folders) live in the shared main tree
  `/home/kokoro/projects/clients/clonetest/` under `assets/source/generated/adelva/…` and
  `references/adelva/mockups/…`. If a prepare script needs them, symlink exactly the folders you
  need into your worktree (do not commit the symlinks) or pass absolute paths; never edit or delete
  files in the main tree.
- A production baseline server of the unmodified site runs at `http://127.0.0.1:4791` (prod code
  3dc1f32; note its /challenges/general-managers is the older prod version). Use it for "before"
  numbers; measure "after" on your own build, back to back.
- Think like the best interaction designer and front-end engineer on an Awwwards/FWA jury:
  continuity, restraint, rhythm, legibility, physicality of motion, typographic finish. Every
  screen of the phone page must be intentional. Check every state you touch at 320, 390, 430,
  768, 1024, 1280 and 1440 px.
- Approved copy, navigation labels, routes, CTAs and metadata stay. No invented content.
- Do not generate images. If your page needs a different photograph (not a re-render), write the
  request with the reason in your report.
- Commit in small logical commits on your branch with clear messages ending in
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push, never deploy, never touch
  `main`.
- Keep the machine healthy: `--workers=1` for Playwright, one browser at a time, stop your servers
  at the end, no `pkill -f` with a pattern that appears in your own command line.
- You run without a human in the loop: do not stop to ask. Make the best decision, record it in
  your report under "Decisions", and continue. Stop early only for something that would need the
  user (copy changes, new content, legal/rights questions) — record it and finish everything else.

Deliverable: commits on your branch + `docs/reports/adelva-polish-2026-10-13/<page>/README.md`
(Japanese) with: 原因（測定と根拠）, 変更点, before/after の数値, スクリーンショット/シート
(paths), ゲート（コマンドと結果）, 決定事項, 共有部分への依頼, 残課題. Your final message to the
orchestrator: a concise English summary — what changed, evidence, gate results, open items, and
the commit list.
