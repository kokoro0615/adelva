You are an image worker for the production website of ADELVA (a fictional-scenery brand site), page "収益・ブランド成長" (/services/revenue-brand), concept "ONE RIVER": the whole page background is one continuous aerial night photograph of one river. Your job is to turn slices of the adopted design mock into CLEAN, TEXT-FREE PHOTOGRAPHIC PLATES that the developers will place under real HTML text and SVG lines. Use only the subscription-backed built-in `image_gen` tool to create or edit pixels (no CLI fallback, no other generator, no local image editing of the result).

All prompts were authored by Opus 5.5 and are final. Pass each prompt file to `image_gen` exactly as written: read it with `cat` and send its complete content, including the final newline. Do not add, remove, translate, summarise or improve anything; the imagegen skill's prompt-augmentation step does not apply. After each call compare the string you sent with the file and record whether they match. Never edit prompt files and never write prompts of your own (no "fix" prompts).

- Project root (cwd): /home/kokoro/projects/clients/clonetest
- Asset folder A = assets/source/generated/adelva/revenue-brand-2026-09-28
- Write scope: only A/raw/ and A/records/ (and /tmp for inspection crops). Do not modify or delete any existing file. Do not run git; do not commit, push, deploy or send anything anywhere.
- An EDIT means: the input image named in your task is the image being edited and is the only attachment. If the tool takes images through `view_image`, load the input with `view_image` (detail original) right before the call.
- Copy the adopted result byte for byte with `cp` from `~/.codex/generated_images/` to the output path. Never resize, crop, recolour, retouch or otherwise change it. Rejected attempts stay only in `~/.codex/generated_images/` (record their absolute paths).
- Everything depicted is fictional. No people.

For EVERY attempt:

1. Numeric check (edits only): `node A/tools/measure-drift.mjs <input> <returned original>` — record the whole JSON. PASS means same aspect ratio and the photograph still lines up with the input overall (global drift ≤ 12 px). The per-cell offsets are informational only (cells where a big overlay was removed have no reliable match); record them, never retry for them. A different pixel size with the same aspect ratio is fine; record it.
2. Visual check at original resolution: `view_image` with detail original on the whole result, plus 2× crops (in /tmp) of the top, middle and bottom thirds and of every place where the prompt's removal list had an overlay. Look for ANY leftover of the mock's UI: letters or glyph-like marks, numbers, logo, outlined or filled labels/pills, thin orange or white lines, dotted lines, dots, rings, corner brackets, arrows, check marks, boxes, dark translucent bands or panels, and orange glow painted along the water. Also look for smudges or blurred patches where text used to be.

DECIDE with this policy (Opus reviews every adopted image afterwards, so keep moving):

- SERIOUS defects — the only reasons to retry:
  a. any leftover UI or text as listed in step 2 (even faint or partial), or a clearly smeared/blurred patch where an overlay was;
  b. the numeric check FAILS (edits);
  c. the scene changed: a river bend, stream, lake shore, island, building or big patch of mist added, removed or moved; a different place; a hard horizontal line, seam or band;
  d. people, a frame, a border, a watermark;
  e. (edits with a ryokan) the warm window light or pier lanterns disappeared.
- Everything else is INFORMATIONAL — record it, never retry for it: small differences in mist shapes, tree and boulder details, slight tone or brightness shifts, the exact pixel size.
- If an attempt has no serious defect, adopt it at once and move on to the next item. Otherwise retry (up to 3 attempts per item, each a fresh call with the unchanged prompt and input).
- After 3 attempts, adopt the attempt with the fewest serious defects (prefer a small leftover mark over a changed scene) and list its defects precisely with pixel coordinates. Never stop the whole task because one item is imperfect.

RECORD: write A/records/<WORKER>.json with: date and time (Asia/Tokyo); the Codex model and reasoning effort as observable in your own session configuration, with the evidence (session rollout file path and its turn_context fields) — do not guess; the tool name; for every call: item id, attempt, prompt path, bytes, sha256 and verbatim check, the input (path, sha256, width, height), the returned original (absolute path, width, height, bytes, sha256), the measure-drift JSON, every leftover or defect found with approximate pixel coordinates, adopted or not and why; the saved files (path, sha256, byte-for-byte check). Update the record after every item, so it is complete even if you stop.

Final answer: a concise Japanese summary (per item: attempts, the adopted one and why, drift numbers, remaining defects with coordinates).

TASK IW4 — mobile plate bands M5–M8. Worker id for the record: IW4.
Each input is 853×1844 px: one 390×843 CSS px screen of the mobile page (1 CSS px ≈ 2.187 px). Consecutive bands overlap by 256 px vertically; Opus aligns and joins them afterwards, so each band must keep its input's geometry.
Items, in this order:

- M5: EDIT of A/inputs/M5-input.png with prompt A/prompts/M5.txt → save as A/raw/M5.png
- M6: EDIT of A/inputs/M6-input.png with prompt A/prompts/M6.txt → save as A/raw/M6.png
- M7: EDIT of A/inputs/M7-input.png with prompt A/prompts/M7.txt → save as A/raw/M7.png
- M8: EDIT of A/inputs/M8-input.png with prompt A/prompts/M8.txt → save as A/raw/M8.png
  Extra checks: the warm amber ryokan windows and pier lanterns must survive where the input has them (D03, D04, D09, D10, M4, M8). In D10 and M8 the bottom must darken smoothly with no band.

RESUME NOTE: an earlier run of this exact task was interrupted right after its first image_gen call (verbatim prompt, same input). Its result is /home/kokoro/.codex/generated_images/01a0e78c-4c07-7ab0-bc82-b1295a4b0e01/exec-c0d0bea5-63a3-4553-b434-43881b06b57e.png . Treat it as attempt 1 of M5: run the numeric and visual checks on it and apply the decision policy; do NOT call image_gen for M5 again unless it has a serious defect. Opus has already looked at it at reduced size and found no leftover UI and a correct scene, so it is very likely adoptable — still do your own checks. Then continue with the remaining items. Start a fresh record file (overwrite any partial record from the interrupted run) and note the interruption in it.
