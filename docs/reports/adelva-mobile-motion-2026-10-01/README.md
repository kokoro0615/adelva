# ADELVA mobile scroll and motion review — 2026-10-01

Scope: `/approach`, `/services/management-operations`, `/services/revenue-brand`,
`/services/dx-it-procurement`, `/about`, `/contact` at phone width. Request: the
mobile scroll feel and motion "do not work / are not spectacular" in many places;
find the causes, fix them, release.

## Method

Production build (`next start`), motion enabled (`reducedMotion: no-preference`).

- Chromium, 390×844, DPR 2, `isMobile` + `hasTouch`. Scrolling by real touch
  drags (`Input.dispatchTouchEvent`; `synthesizeScrollGesture` does not scroll in
  headless Chromium). Per page: a flipbook every 135–150 px of drag (captured
  after the scrub settles), frame intervals, long tasks, CLS, attribute
  mutations per element (which layers animate where) and content still hidden
  after a full pass.
- WebKit (the Safari engine), Playwright `iPhone 13` (390×664, DPR 3), the same
  pages at 330 px steps, plus isolated WebGL experiments.
- A baseline build of `058a72b` on a second port to prove each regression test
  fails before and passes after.

## Findings and fixes

| #   | Page                            | Finding (measured)                                                                                                                                                                                                                                                                         | Cause                                                                                                                                                                                                                                                     | Fix                                                                                                                                                                                                                                         |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | /about                          | In WebKit the "ink to life" front (the page's signature section, y≈1980–3960 at 390) rendered **black** with a white smear. Isolated: the exact shader with `mediump` returns `0,0,0` for every pixel in WebKit, `highp` returns the same colours as Chromium (`36,29,0 / 201,188,173 …`). | Phone GPUs run `mediump` as fp16 (max 65504). The noise hashes lattice points up to ~2000 × 456 → Inf/NaN → black. Desktop GPUs silently use fp32, so it never showed on desktop. A non-preserved buffer drawn on demand also composited black in WebKit. | `highp` when `GL_FRAGMENT_PRECISION_HIGH`, lattice wrapped at 256 otherwise; `preserveDrawingBuffer: true`. Evidence: `about-front-webkit.jpg`.                                                                                             |
| 2   | /contact                        | A 150 px touch drag near question 02 returned to the same offset every time (y 886 → 911 → 911); a programmatic scroll to 1320 landed on 990 in WebKit. The form could not be read past 02 by slow scrolling.                                                                              | `scroll-snap-type: y proximity` on the document with `scroll-snap-align: center` on 02/03, whose cards are almost a screen tall on phones.                                                                                                                | Snapping only for `(hover: hover) and (pointer: fine)`. Touch now advances 135 px per drag through the whole page.                                                                                                                          |
| 3   | all but /about                  | While scrolling, headings, cards and the orange CTA slid visibly under the transparent header's logo and menu button (every flipbook frame after the hero).                                                                                                                                | The phone bar had only the feathered brightness veil; only /about (paper) and /contact (glass) gave the compact bar a surface.                                                                                                                            | `/approach` and `/services/*` use the approved `/contact` glass: compact phone bar = smoked glass (62%, blur 14px) with a hairline; the veil fades out so filters never nest.                                                               |
| 4   | every page after /approach      | Leaving /approach by client navigation set `ScrollTrigger.config({ ignoreMobileResize: false })` for the rest of the session, so every iOS toolbar collapse/expand re-measured all pins and scrubs on the next page.                                                                       | Cleanup reset a global to `false` although GSAP's touch default is `true`.                                                                                                                                                                                | The reset is removed.                                                                                                                                                                                                                       |
| 5   | /services/management-operations | The first ~900 px of the phone page (the building descent) had no motion at all: all six floors lit in ~1.1 s on load, while four of them were still below the fold. The process cabin jumped 300 ms per landing only after a landing passed the centre — it read as a static diagram.     | Desktop choreography reduced to load-time and step-wise versions on phones.                                                                                                                                                                               | Floors light as the reader reaches each (veil lift + warm glow that settles); the cabin rides the reading line continuously with a 0.5 s physical lag and the lit shaft grows behind it; chapter photos settle from 1.14 inside their wipe. |

Checked and working on phones (no change): the /approach dive and focus windows,
the revenue-brand light running down the river with ignitions, the DX conduit
ride and dawn, the /about rings, scale bar and title block, the /contact fog
clearing and stepping stones. No page had console errors or layout shift (CLS 0)
during a full touch pass; the only 404 on every page is the missing favicon.

## Regression tests (fail on `058a72b`, pass now)

- `approach.spec.ts` › phone header › turns to smoked glass once the page scrolls under it
- `contact.spec.ts` › touch screens scroll freely; only a fine pointer gets question snapping
- `management-operations.spec.ts` › mobile motion › floors light as the reader descends and the cabin rides the reading line

`about.spec.ts` › "holds the domains…" took 36.2 s (1440) and 27.9 s (390) on the
baseline build as well, over the 30 s default; it now has a 90 s budget.

## Not verifiable here

Real-device frame rate and iOS toolbar behaviour: headless Chromium rasterises
with SwiftShader (the /about front costs 50–80 ms per frame there, which is not
representative of a phone GPU) and Playwright WebKit on Linux is not iOS Safari.
The WebGL fix follows the documented fp16 behaviour of Apple GPUs and was
confirmed in WebKit; confirm once on an iPhone after release.
