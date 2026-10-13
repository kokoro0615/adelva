# Page brief — SHARED CHROME (header, footer, global CSS, scroll/route infrastructure)

Worktree `/home/kokoro/projects/clients/clonetest-e-shared`, branch `polish/shared`, ports 4810–4819.
You own: `src/components/site-header.*`, `src/components/home/home-footer.*` (+ footer-top-link),
`src/components/scroll-provider.tsx`, `src/components/route-transition.tsx`, `src/components/route-shell.tsx`,
`src/app/layout.tsx`, `src/app/globals.css`, `src/lib/*`, `next.config.ts` headers/caching if needed.
Every page renders your header and footer: verify on ALL routes (/, /challenges, /challenges/owner,
/challenges/general-managers, /services/management-operations, /services/revenue-brand,
/services/dx-it-procurement, /approach, /about, /contact) at 390 and 1440, header states included
(top, scrolled, glass/paper/film surfaces set by pages through `src/lib/header-state.ts`, menu open,
focus). Keep the header's public API (`setHeaderOverride`, surfaces, data attributes) stable — pages
depend on it.

Known problems to fix and go beyond:
1. Header scroll handling forces a layout every scrolled frame (reads `window.scrollY` in its own
   rAF after other rAF writes; one of the top forced-layout call sites on every page). Make the
   header's scroll state cheap (IntersectionObserver sentinel or passive scroll + cached state,
   writes only on change).
2. `backdrop-filter` glass over moving photos/canvas/WebGL on phones (iOS re-blurs each frame). On
   coarse pointers / small viewports replace it with a pre-composited smoked fill that keeps AA
   contrast for the logo, CTA and menu button over every page's imagery; keep desktop glass only
   where it is not over moving content, or measure that it is cheap.
3. Cross-page preloads: on every route the console says the /about plate
   (`/media/adelva/about-a2/m-plate-0-853.avif`), `/media/target/hero-poster.webp` and two CSS
   chunks were "preloaded but not used". Find the cause (likely link prefetch of routes whose
   pages call `preload()`, or prefetching in the header/menu) and stop phones downloading other
   pages' media. Do not break navigation speed on desktop.
4. Footer (`home-footer`): award-level polish of layout and motion on phones and desktop. Known
   issues: the "ADELVAについて" group repeats its own title as its only link; three ADELVA marks
   (header, big wordmark, small "ADELVA" in the bottom row); no legal/company line; the photo is a
   generic AI sunset that an image agent will re-render as a real photograph (drop-in replacement
   of `assets/source/generated/adelva/home-footer/{desktop.png 1435×1096, mobile.png 747×2105}` →
   `public/media/adelva/home-footer/*.webp`). Keep the approved copy (「Start with a conversation」,
   お問い合わせ, group labels). Structural fixes that remove duplication are fine; record them.
   Make the footer entrance feel like the page arriving somewhere (the site's one orange line,
   paper/ink palette) without gimmicks; check it after every page's own ending.
5. Route transitions (`route-transition.tsx`) and the menu: check opening/closing and page changes
   on a phone for jank, flashes, double scrolls, focus.
6. Global CSS: verify `scroll-behavior`, `scroll-padding-top`, `overscroll-behavior`, font
   loading (no FOIT/FOUT jumps), `text-wrap` rules; fix what harms phones.

Coordinate: page agents may write "Requests to shared" in their reports; the orchestrator will
forward them to you. Your changes must not require edits in page folders; if they do, list the
exact one-line changes needed per page in your report.
