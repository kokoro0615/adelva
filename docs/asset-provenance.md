# Asset Provenance Manifest

Last updated: 2026-08-31 JST
Operating mode: **authorized client rebuild**

## Last Continent ornament — 2026-09-08

`last-continent-scribble`: inline SVG in
`src/components/home/home-document.tsx`, copied from the public
`https://white-desert.com/` `.home-intro_svg` path. Owner/licensor: White Desert;
permission: the client authorization of record below. Approved local production
asset; 191×62 viewBox, original path/stroke preserved, no external request,
decorative (`aria-hidden`), server-rendered with the label. No expiry or separate
attribution requirement was recorded in the authorization. No new raster media.

## Authorization of record

The user, acting as the authorized client representative, gave explicit written
authorization on 2026-08-31 covering all target identity, copy, images, video,
fonts, and other assets. Per `clone-website` Source-of-Truth Precedence this
supersedes the 2026-08-30 research-only posture. Every White Desert asset below
is therefore **approved for production** under that attestation.

Acquisition: public delivery URLs fetched read-only at a bounded rate. No access
control was bypassed, no credential used, no target state mutated. Originals are
staged in `assets/source/target/` (outside the bundle); only optimized
derivatives under `public/media/` are deployable. **No production hotlink** to
`white-desert.com`, `cdn.sanity.io`, or `cloudflarestream.com` exists.

## Navigation font correction — 2026-09-08

- Asset: `public/fonts/adelva-noto-sans-jp.woff2` (113,212 bytes).
- Family/role: Noto Sans JP variable, exposed as `ADELVA Navigation Sans` for
  Japanese and Latin navigation text; CSS requests weights 400–600. Existing
  Oswald branding and index numerals are preserved.
- Source: `clients/adelva/.Codex/assets/shared/fonts/source/NotoSansJP-wght.ttf`;
  source SHA-256 `c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f`.
  Upstream: `https://github.com/notofonts/noto-cjk`.
- Copyright: Adobe, 2014–2021, as supplied in the source license. SIL Open Font
  License 1.1 is distributed at `public/fonts/OFL-NotoSansJP.txt`.
- Derivation: fontTools 4.60.1, Brotli 1.1.0; subset the source with the complete
  current header/drawer text plus printable ASCII, retaining OpenType layout
  features and the source 100–900 weight axis. No new glyph design was authored.
- Delivery SHA-256: `dccaad6ca0fc131e1c1d51beee97e6dbae5b9a526a161cc33a19fe60771c1a0c`.
- Loading: same-origin WOFF2, one request when the shared header stylesheet is
  used, `font-display: swap`. Fonts have no image dimensions or alt text; labels
  remain selectable semantic text with their existing accessible names.
- Validation: the generated cmap covers every non-whitespace corpus character.
  The old HOME subset omitted menu characters and is not used for delivery.
  Future navigation-copy additions must recheck glyph coverage before release.

## ADELVA HOME logo — 2026-09-08

The user explicitly requested the image logo from `clients/adelva` for the HOME
masthead, correcting the initial text-wordmark interpretation. Source:
`clients/adelva/public/media/home/adelva-logo-provisional.png`; owner: ADELVA;
use authorized by the user for this rebrand. Delivery: `public/brand/adelva-logo.png`,
an unchanged 1024×1024 RGBA copy. A CSS alpha mask displays the supplied symbol
in white at approximately 29×44 CSS pixels, excluding transparent outer padding.
It loads locally when the HOME header renders. The image has the accessible name
`ADELVA`, naming the HOME link. No generated replacement or font asset is used.
The source filename's provisional designation is retained here for provenance.

## Video assets

| Asset ID          | Local path                                 | Role                              | Source                                              | Owner        | Permission           | Format                                                  | Loading                                          | Alt intent                                 | Status   |
| ----------------- | ------------------------------------------ | --------------------------------- | --------------------------------------------------- | ------------ | -------------------- | ------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------ | -------- |
| hero-antarctica   | `public/media/video/hero-antarctica.mp4`   | Home hero background              | Cloudflare Stream `6cbe45de…/downloads/default.mp4` | White Desert | Client authorization | MP4 H.264, 1920×1080, 17.52 s, 2.02 Mbps, 4.3 MB        | `preload="metadata"`, autoplay/loop/muted/inline | Decorative; `aria-hidden`, poster fallback | Approved |
| white-desert-film | `public/media/video/white-desert-film.mp4` | Watch Film modal and detail media | Cloudflare Stream `87c22e0a…/downloads/default.mp4` | White Desert | Client authorization | MP4 H.264/AAC, 1920×1080, 420.93 s, 4.48 Mbps, 235.7 MB | `preload="metadata"`; playback only on request   | Labelled native video controls             | Approved |

The long-form film is now present locally and is not deferred. Its 235.7 MB
payload is a recorded delivery risk: it is excluded from above-fold loading,
but must be replaced by an approved web-encoded derivative before a deployment
whose static-file or transfer budget cannot accommodate it. This risk does not
apply to the 4.3 MB muted hero loop.

## Identity and global-shell imagery

| Class         | Local paths                                                 | Source / owner                       | Production role                      | Loading | Alt intent                                   | Status   |
| ------------- | ----------------------------------------------------------- | ------------------------------------ | ------------------------------------ | ------- | -------------------------------------------- | -------- |
| Brand marks   | `public/brand/white-desert-{header,footer}.svg`             | White Desert authorized identity     | Header, menu, and footer masks       | eager   | Link names supply the text equivalent        | Approved |
| Footer poster | `public/media/target/footer/watch-film.jpg`                 | Authorized White Desert target media | Watch Film footer control            | lazy    | Decorative inside a labelled control         | Approved |
| Footer badges | `public/media/target/footer/1-iaato.png` … `6-20-years.png` | Authorized target partner marks      | Six footer accreditation/award marks | lazy    | Each linked image uses its organization name | Approved |

## Cloud / mist layer plates

| Asset ID        | Local path                                 | Role                       | Source                                        | Source dims  | Output         | Loading | Alt intent | Status   |
| --------------- | ------------------------------------------ | -------------------------- | --------------------------------------------- | ------------ | -------------- | ------- | ---------- | -------- |
| cloud-gradient  | `public/media/target/cloud-gradient.webp`  | Mist transition plate      | `white-desert.com/images/cloud-gradient.png`  | 1440×900 PNG | 1440 w, 114 KB | lazy    | Decorative | Approved |
| cloud-1-cropped | `public/media/target/cloud-1-cropped.webp` | Clouds overlay, near layer | `white-desert.com/images/cloud-1-cropped.png` | 1440×550 PNG | 1440 w, 98 KB  | lazy    | Decorative | Approved |
| cloud-2-full    | `public/media/target/cloud-2-full.webp`    | Clouds overlay, far layer  | `white-desert.com/images/cloud-2-full.png`    | 1440×900 PNG | 1440 w, 173 KB | lazy    | Decorative | Approved |

## Home section imagery

All sourced from the client's Sanity production dataset
(`cdn.sanity.io/images/kq9qn5zn/production/…`), owner White Desert, permission
by client authorization, converted to WebP q82 at ≤2000 px width.

| Asset ID                         | Local path (`public/media/target/`)     | Role                          | Source dims | Output KB | Loading | Alt intent                        | Status   |
| -------------------------------- | --------------------------------------- | ----------------------------- | ----------- | --------: | ------- | --------------------------------- | -------- |
| textIntroImage                   | `textIntroImage.webp`                   | Season intro, desktop         | 3000×2014   |        82 | lazy    | Meaningful — season landscape     | Approved |
| textIntroImageMobi               | `textIntroImageMobi.webp`               | Season intro, mobile art dir. | 3000×2014   |        82 | lazy    | Meaningful — season landscape     | Approved |
| trip-early-emperor-penguins      | `trip-early-emperor-penguins.webp`      | Our Trips card 1              | 2000×1333   |        64 | lazy    | Decorative; card heading names it | Approved |
| trip-south-pole-emperor-penguins | `trip-south-pole-emperor-penguins.webp` | Our Trips card 2              | 1143×1920   |       209 | lazy    | Decorative; card heading names it | Approved |
| trip-south-pole-blue-rivers      | `trip-south-pole-blue-rivers.webp`      | Our Trips card 3              | 2668×2000   |       340 | lazy    | Decorative; card heading names it | Approved |
| trip-the-long-stay               | `trip-the-long-stay.webp`               | Our Trips card 4              | 2100×1399   |       324 | lazy    | Decorative; card heading names it | Approved |
| trip-antarctica-in-a-day         | `trip-antarctica-in-a-day.webp`         | Our Trips card 5              | 2100×1400   |       200 | lazy    | Decorative; card heading names it | Approved |
| trip-discovery-week              | `trip-discovery-week.webp`              | Our Trips card 6              | 2000×1333   |        52 | lazy    | Decorative; card heading names it | Approved |
| camp-whichaway                   | `camp-whichaway.webp`                   | Our Camps card 1              | 2000×1250   |       150 | lazy    | Decorative; card heading names it | Approved |
| camp-echo                        | `camp-echo.webp`                        | Our Camps card 2              | 2535×1584   |        30 | lazy    | Decorative; card heading names it | Approved |
| camp-explorer                    | `camp-explorer.webp`                    | Our Camps card 3              | 2000×1333   |       106 | lazy    | Decorative; card heading names it | Approved |
| camps-gallery-1                  | `camps-gallery-1.webp`                  | Camps gallery                 | 2000×1250   |       151 | lazy    | Decorative                        | Approved |
| camps-gallery-2                  | `camps-gallery-2.webp`                  | Camps gallery                 | 2000×1333   |       738 | lazy    | Decorative                        | Approved |
| camps-gallery-3                  | `camps-gallery-3.webp`                  | Camps gallery                 | 2000×1250   |       150 | lazy    | Decorative                        | Approved |
| camps-quote-mark                 | `camps-quote-mark.webp`                 | Pull-quote mark               | 447×223     |         9 | lazy    | Decorative                        | Approved |
| routeWidgetWatchFilmImage        | `routeWidgetWatchFilmImage.webp`        | Watch Film poster             | 1500×1000   |        72 | lazy    | Decorative; control is labelled   | Approved |
| flight-path_large                | `flight-path_large.webp`                | Route widget flight path      | 2880×3442   |        69 | lazy    | Decorative; stats are text        | Approved |
| outroBannerMedia                 | `outroBannerMedia.webp`                 | Planning CTA banner           | 2000×1333   |       231 | lazy    | Decorative; CTA heading adjacent  | Approved |

## Atka Bay sticky split imagery

The dedicated image below is the authorized source for the
`.sticky-split_slider` section on `/antarctica/atka-penguin-colony`. The
original is retained outside the deployable bundle; the local derivative keeps
the source dimensions and was encoded with Sharp WebP quality 82.

| Asset ID                              | Original source path                                                    | Production derivative path                                              | Source URL                                                                                                | Source SHA-256                                                     | Dimensions / bytes                                    | Owner / permission                  | Role                                         | Loading | Alt intent                                                                 | Status   |
| ------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------- | -------------------------------------------- | ------- | -------------------------------------------------------------------------- | -------- |
| antarctica-atka-penguin-colony-sticky | `assets/source/target/detail/antarctica-atka-penguin-colony-sticky.jpg` | `public/media/target/detail/antarctica-atka-penguin-colony-sticky.webp` | `https://cdn.sanity.io/images/kq9qn5zn/production/d56f3126a44f5929d3212a1af45ca49125914891-1200x1500.jpg` | `2102bcf0f2c3398e1b65ee0d04edb8d55603f969493d9bdffc9306d3477f11ba` | JPEG 1200×1500, 242,757 B → WebP 1200×1500, 179,680 B | White Desert / client authorization | Atka Bay region sticky split editorial image | lazy    | Meaningful — aerial view of emperor penguins gathered on Antarctic sea ice | Approved |

## Retained non-production assets

| Class                           | Path                          | Status                                                  |
| ------------------------------- | ----------------------------- | ------------------------------------------------------- |
| Prior generated replacements    | `assets/source/generated/`    | Retained for audit; superseded as production media      |
| Target reference captures       | `artifacts/reference/target/` | External fidelity evidence; never loaded by production  |
| Repository-authored screenshots | `tests/e2e/*-snapshots/`      | Regression goldens only; never external-reference proof |

## Typography

The measured target faces are Cardinal Classic Long (display serif) and
Inter Tight / Oswald (body and condensed). Client authorization covers font use;
the authorized local WOFF2 binaries are stored in `public/fonts/`: Inter Tight
normal/italic variable faces, Oswald variable, Cardinal Classic Mid
regular/italic/medium/medium-italic, and Cardinal Classic Long semibold/bold
normal/italic. The legal template retains equivalent scoped copies under
`public/media/target/legal/`. They are same-origin, use `font-display: swap`,
and no runtime request is made to a foundry or the target site.

## Index, detail, and legal route media

| Asset family  | Local production paths                                      | Source / owner / permission                      | Processing and use                                                                                                                                                                                                                                                                                 | Status   |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Index routes  | `public/media/target/index/*.webp`                          | Authorized White Desert Sanity production images | Eight local WebP derivatives; route hero/CTA images eager where first-visible, cards lazy; source URLs and dimensions are recorded in `.Codex/docs/research/index-clone-implementation.md`                                                                                                         | Approved |
| Detail routes | `public/media/target/detail/*.webp`                         | Authorized White Desert Sanity production images | 102 numbered route-keyed local WebP derivatives plus the dedicated Atka sticky split derivative; first hero eager, galleries/editorial media lazy; filename-to-route convention and roles are recorded in `.Codex/docs/research/detail-clone-implementation.md` and `src/content/detail-target.ts` | Approved |
| Legal routes  | `public/media/target/legal/WhiteDesertAntarcticaPeaks.webp` | Authorized White Desert target image             | Shared fixed legal banner with local dimensions reserved                                                                                                                                                                                                                                           | Approved |

All production records resolve to same-origin paths. Target reference
screenshots remain evidence-only and are never rendered as page content.

## HOME role correction — 2026-09-08

No new production assets were acquired. The existing client-authorized local
assets retain their source/owner/license records above. HOME now assigns
`camps-gallery-1.webp` (2000×1250, mountain) to the introductory mountain plane,
`camps-gallery-2.webp` (2000×1333, overhead ice) to the intermediate fixed plane,
and `camps-gallery-3.webp` (2000×1250, crevasse) to the final plane and bridge.
Legacy registry IDs remain stable; `homeTarget.ourCamps` owns the corrected role
mapping. All three are decorative (`alt=""`), lazy-loaded, with viewport-height
aware source sizing for portrait cover crops. The same sizing correction applies
to the existing planning background and portrait camp cards. Research screenshots
under `artifacts/home-lower-2026-09-08` are excluded from production.

## Original founder signature — 2026-09-08

- Source: `src/components/home/founder-signature.tsx`, original SVG path lettering
  authored in this workspace for the user's requested `kokoro nakagawa` name.
- Owner/use: project-authored deliverable for the client; no external font, traced
  signature, stock asset or third-party license dependency.
- Role/dimensions: decorative handwritten attribution, 656.82 × 120.12 viewBox;
  retains the existing responsive inline SVG layout.
- Loading: inline with server-rendered markup, no asset request.
- Alternative text: `aria-hidden`; adjacent figcaption contains the real name.

## ADELVA Who We Support landscape — 2026-09-09

- Registry ID: `adelva-support-landscape`.
- Role: decorative full-bleed background for HOME's Who We Support section.
- Source: built-in subscription `image_gen` text-removal edit of the user-approved
  `references/adelva/mockups/who-we-support-2026-09-09/who-we-support-desktop.png`.
  Exact prompt: that directory's `background-prompt.txt`.
- Original returned file: `/home/kokoro/.codex/generated_images/01a084a6-3e7c-7fc1-bd0f-6c8e5407c3a1/exec-b20535da-058d-4bd6-8be9-02fa7ee9da63.png`.
- Retained source: `assets/source/generated/adelva/who-we-support-landscape.png`,
  RGB PNG, 1448×1086px, no alpha. No unsupported model/quality metadata is claimed.
- Production derivative: `public/media/adelva/who-we-support-landscape.webp`,
  1448×1086px, 213,906 bytes; Sharp WebP quality 88, effort 6.
- Ownership/use basis: generated project deliverable; user explicitly approved
  this mock and requested its implementation in this session. The Aman thumbnail
  was an atmosphere reference for the original mock, never a production asset.
  This generated landscape is not documentary evidence of a client or location.
- Loading: same-origin Next Image, lazy, positioned fill container. Responsive
  sizing `(max-aspect-ratio: 4/3) 160vh, 100vw` preserves detail in tall cover crops.
- Alternative text: empty, inside `aria-hidden` decorative background; all titles,
  body copy and audience links are independent semantic HTML.
- Existing font assets are reused: Oswald and `ADELVA Navigation Sans` (the local
  `adelva-noto-sans-jp.woff2` already recorded for the ADELVA navigation).

### Japanese font coverage extension — 2026-09-09

`public/fonts/adelva-noto-sans-jp.woff2` now contains 304 codepoints (127,612
bytes), preserving all 271 earlier codepoints and adding 33 from the approved
HOME/navigation content. Source, license, family and variable weight axis remain
as recorded above. Generated with fontTools 4.60.1 and Brotli 1.1.0. This fixes
system fallback in Who We Support's new introduction; no new font face is added.
Reproduction and before/after browser inventories are retained in
`artifacts/adelva-who-we-support/extend-font.py` and `fonts-{before,after}.json`.

## NOSIGNER HOME reproduction — 2026-09-09

The user explicitly confirmed permission (「許可取得済です」) for the requested
NOSIGNER HOME reproduction on the local `/challenges` route. This is the use basis
for the site's copy, project imagery, logo and display font; no public deployment
or additional target page was authorized.

- Image-level owning registry: `references/nosigner/asset-manifest.json`. It records
  735 original WebP files, including source responsive variants of 183 unique
  HOME images, source URL, owner, permission, role, dimensions, bytes, loading and
  alternative-text intent. These are unmodified source assets, served locally
  under `public/media/nosigner/`; no production image hotlinks.
- Vector registry: `references/nosigner/vector-manifest.json`. The permitted logo
  and seven navigation/social icons are SVG paths from the HOME markup, rendered
  as same-origin CSS masks. Accessible names are independent HTML.
- Font registry: `references/nosigner/font-manifest.json`. NOSIGNER Bold is the
  permitted display font; Zen Kaku Gothic New 700 is a Google Fonts subset under
  SIL OFL. Both are locally served with `font-display: swap`.
- Raster screenshots, target HTML/CSS/JS and capture JSON under
  `references/nosigner/` are research and verification evidence only. None is
  imported or executed by the production application. Ambient rendering is
  project-authored Canvas2D, with a documented fidelity limitation.

## ADELVA challenges HERO — 2026-09-09

Five original generated fictional hospitality landscapes replace every source
HERO slide on `/challenges`. User selected Aman-like monumental nature; the
referenced video and website are research-only and contribute no production
pixels. Generated through built-in subscription `image_gen`, with per-call
pixel model/quality metadata unexposed. Project-use rights follow the generation
service terms; no exclusive copyright or real client-property claim is made.

Exact prompts, source paths, dimensions (1672×941), optimized WebP files, byte
sizes, owner/use and descriptive-alt/loading intent are in
`assets/source/generated/adelva/challenges-2026-09-09/manifest.json`.

## Challenges procedural ambient field — 2026-09-09

No new production images, fonts, video or third-party runtime package. The local
WebGL field in `src/components/nosigner/ambient-renderer.ts` implements measured
noise, palette, aspect and scroll parameters; it does not load target scripts.
Observation origin: authorized https://nosigner.com/ja/ under the NOSIGNER
permission already recorded in the workflow ledger. Research-only source/canvas
captures remain in `references/nosigner/ambient-2026-09-09/`, outside public assets.
The canvas fills its CSS viewport, is decorative (`aria-hidden`), initializes on
client mount, caps refresh at 30fps and stops for pause/reduced motion/hidden tabs.

## Challenges typography correction — 2026-09-09

- Asset: `public/fonts/adelva-challenges-noto-sans-jp.woff2` (235,932 bytes).
- Source: existing full `NotoSansJP-wght.ttf` in the owning ADELVA project's
  `.Codex/assets/shared/fonts/source/`, Noto Sans JP project / Google Fonts.
- License: SIL Open Font License 1.1; existing license copy
  `public/fonts/OFL-NotoSansJP.txt`. Local subset, not sourced from NOSIGNER.
- Role: Japanese and Latin HTML typography on `/challenges`; variable100–900.
  Same-origin WOFF2, CSS font-display:swap, no new remote runtime requests.
  Font has no raster dimensions or alt text. No new photographs or logos shipped.
- Corpus: page component, navigation content, NOSIGNER legacy news data and ASCII.
  Browser CDP audit covers all8 band titles/descriptions and both statements;
  no system fallback glyphs at1440/768/390. Existing shared navigation font
  remains its own asset. Font regeneration takes the full source path explicitly.

### Superseding HOME font unification

The later user instruction replaces the dedicated challenges face with the actual
HOME font roles. `public/fonts/adelva-noto-sans-jp.woff2` is extended by the union
of its old cmap and the challenges corpus; all previous characters are retained.
The temporary `adelva-challenges-noto-sans-jp.woff2` is removed, and is not a final
production asset. English display/brand/utility text reuses existing authorized
Cardinal Classic Long / Oswald / Inter Tight binaries documented above.
Reproduce the Noto extension with `scripts/adelva/subset-challenges-font.py` and
the licensed full TTF as its sole argument, using fontTools + brotli. No changes
to HOME/header font weights, sizes, layout, font declarations or glyph outlines.

### Opening business statement glyph extension — 2026-09-09

`public/fonts/adelva-noto-sans-jp.woff2` now contains589 cmap entries
(239,136 bytes), preserving all584 prior entries and adding5 required by the
source-derived business statement. Same licensed full source, existing subset
script, loading strategy and role as the HOME font unification above.

## ADELVA About carousel — 2026-09-09

16 original fictional landscape/hotel photographs generated for this project
with the built-in subscription imagegen tool, replacing every carousel photo
and removing the old decorative overlays. No Aman photograph, logo or architecture
was supplied as an image input. Aman is aesthetic research only; the generated
places are not evidence of clients or operated hotels. Project-requested generated
assets; no third-party source license. Exact prompts, returned paths, measured
dimensions and intended roles: `references/adelva/about-refresh-2026-09-09/generation.json`.
Originals: `assets/source/generated/adelva/about-carousel/{1..16}.png`, each
1536×1024. Delivery: `public/media/adelva/about-carousel/{1..16}.webp` plus
768px variants, quality-87 WebP encoding without upscaling. Empty alt, decorative
band hidden from AT, eager/async to support moving offscreen frames; responsive
sizes limit decode/transfer. Image 4 is also the lazy decorative Company info
portrait crop (65% horizontal focal point). HOME footer and circle reuse their
existing documented assets, with no new ownership claim.

## ADELVA HOME imagery — 2026-09-10

Eleven independent original fictional hospitality photographs generated through
subscription-backed built-in image_gen at the user's explicit request. Aman and
The Spirit of Aman inform visual direction only; no external photographs or logos
are distributed. Not evidence of real ADELVA properties, staff or clients.
Owner/use: ADELVA project. Generated assets, no third-party photo license claimed.
Each source, exact prompt, selected derivative, observed 1536×1024 dimensions,
byte size and review are in
`assets/source/generated/adelva/home-2026-09-10/manifest.json`.
All use empty decorative alt, centered cover crops, lazy next/image delivery and
WebP quality 86 derivatives. Pixel model/quality metadata is not exposed.

## ADELVA support journey / A1 — 2026-09-10

User-approved A1 granite-and-forest garden. Two built-in image_gen photographic
assets made from the approved generated mock, with all typography/route overlays
removed. Mobile is independently composed, not a crop. Fictional concept landscape,
not an ADELVA property, client or case-study claim. Project-authorized generation;
no third-party photo license or unexposed model metadata claimed.
Exact prompts and provenance: `assets/source/generated/adelva/approach-2026-09-10/manifest.json`.
Original desktop1086×1448 and mobile724×2172 PNGs remain there. Production WebP92
(single encode, no upscale): `public/media/adelva/approach-2026-09-10/`, desktop632174
bytes, mobile655974bytes. Native picture selects at600px, lazy/async, reserved natural
aspect ratio; decorative empty alt because support meaning is supplied by HTML
heading, ordered list and source-approved copy. Existing licensed fonts are reused.

## 2026-09-10 contact / shared identity revision

No new raster generation or third-party acquisition. Contact reuses the locally
approved `public/media/morght/TTCommonsProMedium.woff2` and Zen Kaku Gothic New
WOFF2 subsets registered in `references/morght/asset-manifest.json`. MORGHT font
permission is recorded in the 2026-09-09 ledger; Zen Kaku is OFL. Fonts swap on
load, use semantic Japanese/Latin text and have no alt-text role. The contact
background is authored CSS, no target screenshot or texture is shipped.

Header reuses user-authorized `public/brand/adelva-logo.png` with its recorded
optical mask, enlarged proportionally; decorative mark/word text are hidden from
assistive tech under the home link's ADELVA name. HOME/challenges/contact use the
same existing generated footer WebP plates: source, dimensions and generation
record unchanged; art-directed picture, lazy decoding, empty decorative alt.

For Git delivery, the 235,675,214-byte legacy film exceeds GitHub's single-file
limit. Original retained locally; `public/media/video/white-desert-film-web.mp4`
is a derived H.264/AAC 1280×720 rendition, full 420.928-second duration, ffmpeg
libx264 fast CRF27/maxrate1400k, AAC96k, faststart. It retains the authorization
of the original film and native labeled playback controls. Metadata/preload only,
no automatic modal download. The original is excluded from Git, not deleted.
