# HOME mobile scroll repair — 2026-09-10

Scope: `/`, live ADELVA and White Desert HOME, motion and grid only. User
explicitly authorizes Git/Vercel production deployment and prohibits subagents.
Preserve approved Japanese copy, section order, images, links, navigation, film,
focus/scroll locks, responsive support/expertise/approach and reduced motion.
No new raster assets. Existing asset-provenance manifest remains authoritative.
Reference screenshots are research-only, not production assets.

## Evidence and specification before implementation

Live Chromium observations at 390×844 (touch), 768×1024, 1440×900, DPR 1,
2026-09-10. CSS coordinates and raster pixels map 1:1 (scaleX=scaleY=1).
Reference grid data: artifacts/home-scroll-2026-09-10/reference-grid.json.
Reference and before hero/lines PNGs in the same folder. This is a focused repair;
ADELVA copy, photography and section lengths are not White Desert pixel targets.

Reference fixed grid: white, 0.5px width, parent opacity 0.1, difference blending.
Mobile x: 12, 60, 195, 329.5, 377.5; tablet adds 135.5, 260, 507.5, 632
with center 384 and right inset anchors; desktop inner x 247.5, 484, 955.5,
1192 with center 720. Grid positions must differ by <0.6px; stroke width <0.1px;
parent opacity exact 0.1. Same fixed grid must cross white/photo boundaries.
Existing HOME has separate dark Purpose rules and 1px/16% white five interior
rules, unrelated x coordinates and no background blending. Replace HOME grid
with one decorative fixed layer; keep other routes' existing grid behavior.

Hero: preserve 200svh document space and measured layer trajectories. Replace
JS scroll-cancelling wrapper translateY with native sticky in a 300svh containing
plane so pin holds through 2svh of travel. A 100svh sticky viewport stays at y=0
(tolerance 1px) through forward/reverse touch scroll, including a busy main thread.
Cloud/heading/mist values retain direct reversible mapping, no smoothing queue.
Use stable element geometry, cache layout outside scroll updates, skip unchanged
and offscreen work; video pauses when the stage leaves the viewport. Reduced
motion retains readable static hero and no video autoplay or animation listeners.

Camps: retain approved scroll reserve, lead-in and final horizontal travel. Cache
root top, viewport height, pin distance and track width on layout/resize, not on
every scroll frame. Skip unchanged clamped progress outside the active interval.
Refresh caches on fonts, resize and observed element-size changes; remove all
listeners/observers on preference change and unmount. Do not shorten the story
or turn the three expertise panels into a different interaction.

Verification: target viewport capture of hero, mist/Purpose boundary, support,
expertise entry/mid/end/reverse, approach, footer; compare measured external grid
independently from authored regression snapshots. Test native touch, height-only
resize, reduced preference changes, no-JS, keyboard, menu lock, no overflow,
console errors and axe. Profile equivalent scroll under the same browser and
CPU conditions; report measured results without claiming real-device Safari FPS.
Run actual format, lint, typecheck, unit, e2e, axe, visual and production build.
