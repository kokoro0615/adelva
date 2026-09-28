# revenue-brand implementation — progress (2026-09-28)

User decisions: mock copy adopted = approved (status `adopted-mock-2026-09-28`); after all gates pass → commit + push + Vercel production. Implementation → Codex `gpt-6-astra` reasoning high (Opus writes the brief); image generation → Codex high, prompts by Opus; Opus reviews and fixes.

## Done

- Clean-plate edit inputs: `inputs/D00–D10` (desktop 1536×1024 tiles = A4-full rows 0–5804 ×1.5, stride 768, overlap 256), `M1–M8` (mobile bands 853×1844, stitch like `A4-mobile/tools/stitch-mobile.mjs`: overlap 256, blendStart 64, blend 128), `C1/C2` (card photos ×2).
- Prompts (Opus): `prompts/*.txt` via `tools/write-prompts.mjs`. Worker briefs `briefs/IW1–IW5.md`. First attempts D00/D06/M1/M5/C1 reviewed by Opus: clean, correct scene.
- Workers IW1–IW5 relaunched detached (setsid) at 19:33; outputs → `raw/`, records → `records/IW*.json`, logs → `logs/`.
- Mock line traces: `records/trace-desktop-mock.json` (1024 raster), `records/trace-mobile-mock-2x.json` (780 @2x). Tools: `tools/trace-rows.mjs`, `tools/orange-runs.mjs`, `tools/ink-bbox.mjs`, `tools/measure-drift.mjs`.

## Desktop measurements (raster y → CSS = ×1.40625)

- Margins ≈ 60 CSS left/right. Ink/end colour ≈ rgb(10,17,24). Photo fades to ink by raster ≈5800 (CSS ≈8160).
- Hero: crumb y 257 (≈15px); "02" orange 36px serif x 59; 支援領域 19px; H1 y 330–398, x 44–616 (≈96px Mincho, width 804 CSS); EN y 412 (15px, tracking ≈0.55em, width 415); lead 2 lines Mincho ≈27px / 41px lh, y 444; CTA x 62–325 y 720–780 CSS; SCROLL centre 720 CSS, y 752; index band nodes y 858 CSS at x 276/720/1162, nums 24px orange, labels 15px, ↓ ≈939.
- Stream nodes (raster): Web 250,103 · OTA 412,148 · 営業 583,180 · 写真 745,214 · SNS 900,223.
- Ch1: "12・16" 28px y 721; title 56–60px y 751–788 centred; confluence node 512,1090 (宿泊収益 chip right of it); 12 block left x 42 (num 48px y1101, h3 40px y1146, sub 19px y1190); 16 block right-aligned to x 981.
- Ch2: "13・14" 34px y1689; title ≈82px y1733–1790 (width 987 CSS) + mirrored reflection; 13 centre x 326 / 14 centre x 707 (num 40px y1893, h3 36px y1928); chips y 1986–2007 (13: x131–503, 14: x582–851); note centre y 2045 (15px). Viewfinder on ryokan ≈ x475–605, y2145–2240.
- Ch3: loop nodes ブランド方針 435,2800 · 企画 533,2924 · 投稿 511,3050 (current) · 分析 158,3054 · 改善 185,2850 · Web・予約導線 468,3175; text x 686: 15 (y2779), SNS運用支援 60px (y2828), 15, SNS運用代行 34px (y2943), p 19–20px lh 38 (y2992).
- Differences: title 56px y3309 centred; left col x 108, right x 658, centre divider 512; row1 num y3378 h3 38px y3414 sub 18px y3453; row2 +139 raster; arrows line from heading end to 640 at heading mid; note box x241–785 y3640–3678 (r≈8).
- Process: title 60–64px y4112; lead Mincho ≈28px y4175 centred; body 20px lh37 y4221 centred; counter "04 / 06" x48 y4188; nodes 01 546,4332 · 02 465,4428 · 03 571,4566 · 04 449,4692 (current) · 05 599,4843 · 06 466,5038 · end square 504,5360; labels: 01 num x612 name x660 (30px) chip y4342; 02 num x277 name x332 chips x238–428 y4453; 03 num x640 name x692 chips x641–883 y4591; 04 num x251 name x307 chips x251–412 y4710; 05 x656/707 chips y4870; 06 x539/593 chips y5070; link x798–973 y5248, orange underline y5272.
- Related: bar x48–50 y5876–5905, label x70 y5881 (≈26–28px); cards y5934–6372, card1 x48–500, card2 x520–940 (implement equal widths); card num y6215, h3 y6259, p 2 lines y6308/6331, arrow right x≈449–472.
- Audience band: ice rgb(238,236,232) y 6530–6655, links y6578–6600 (x99 / x594), centre divider x511.

## Status 22:15 JST

- Images: all 23 adopted on first attempt (records/IW1–IW5.json); Opus reviewed every one (no leftover UI).
- Plates stitched: plates/desktop-plate.png 1536×8704, plates/mobile-plate.png 853×12960 (records/stitch-*.json). Seams checked.
- Geometry: plates/geometry-desktop.json / geometry-mobile.json / geometry-cards.json (tools/build-geometry.mjs, verified overlay with tools/render-geometry.mjs). Mobile main runs the loop counter-clockwise; `cycle` = clockwise ring for the particle.
- Source fonts cached: ~/.cache/adelva-fonts/ (revisions match current subsets).
- Spec written: docs/specs/adelva-revenue-brand-spec.md. Brief: references/adelva/mockups/revenue-brand-A4-2026-09-26/IMPLEMENTATION-PROMPT.md.
- Codex implementation worker launched 22:14 (session 01a0e828-d73c-7700-a492-0faff9c2d218), log logs/IMPL.log. git status snapshot before: logs/git-status-before-impl.txt.

## Left to do

1. Wait for Codex; review UI/UX/motion/layout (Opus), fix.
2. Gates, commit only this task's files/hunks (preserve /approach uncommitted work), push, Vercel prod, verify prod.

## 22:20 JST — moved implementation to a worktree

- Another Claude session (pid 98225, started 21:49) runs a Codex worker implementing /services/dx-it-procurement in the MAIN tree (build dir, Playwright port 4173, font subsets and shared files would collide).
- My first IMPL worker (session 01a0e828…) was stopped before writing anything (logs/IMPL.log).
- Worktree: /home/kokoro/projects/clients/clonetest-rb, branch feat/revenue-brand from HEAD 504e173; node_modules symlinked; inputs copied. Worker session 01a0e82c-441d-7352-87b5-70493abf3f14, log clonetest-rb/assets/source/generated/adelva/revenue-brand-2026-09-28/logs/IMPL-worktree.log. Ports 4391/4392.
- Integration later: port new files + add-only hunks into the main tree (or commit on the branch and merge), re-run the font extension on top of the main tree's fonts (approach + dx glyphs), then gates.

## 2026-09-29 — implementation reviewed and fixed by Opus

- Codex (session 01a0e82c…, resumed once after it stopped to ask about reading deps via the node_modules symlink) implemented the page in the worktree; report: docs/reports/adelva-revenue-brand-2026-09-28/README.md.
- Opus review fixes: reverted Codex's SiteHeader/next.config changes; soft glyph halos instead of blob scrims (+ soft pools for small orange numbers ≤1023); desktop main line starts at the confluence; confluence/loop/process/end markers restyled to A4; lake dots; chip sizes measured at 4×; rail label hover/focus only; card line breaks; mobile 06 lifted above the end marker. Gates re-run: lint, tsc, unit 112, Playwright 38, landmarks 24/24 within ±8, contrast 222/222.
- Integration: commit on feat/revenue-brand (HEAD 504e173 + this page only), then bring into main without touching the other sessions' uncommitted approach/dx work.
