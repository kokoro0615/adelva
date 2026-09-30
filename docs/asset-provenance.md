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

| Asset ID          | Local path                                                                                                                              | Role                                                                          | Source                                                                                                                                                                                                                                                                                                                                                                                                       | Owner                            | Permission                                                                      | Format                                                                                                                        | Loading                                                                     | Alt intent                                 | Status        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ | ------------- |
| hero-antarctica   | `public/media/video/hero-antarctica.mp4`, `hero-antarctica-av1.mp4`, `hero-antarctica-portrait.mp4`, `hero-antarctica-portrait-av1.mp4` | Home hero background; portrait screens get the 9:16 edit via `<source media>` | v3 lab derivative of the `aman-nature-v2` edit (`_tools/video/output/aman-film-v3-lab/`): 9 of 10 shots are iStock clips 642460768, 1049349248, 181013019, 2172936892, 2242753603, 2147227302, 1783674476 and 926930096, taken from 768×432 preview files whose watermark was removed in `_tools/video`; shot 6 is Pexels 14094022. SeedVR2 7B super-resolution, temporal stabilisation and one final encode | Stock licensors (iStock, Pexels) | User states permission is held (2026-09-30); licence not independently verified | MP4, 32.00 s, 24 fps, no audio. H.264 High@4.1 CRF18: 1920×1080 and 1080×1920. AV1 Main 10-bit CRF28: 1920×1080 and 1080×1920 | `preload="metadata"`, autoplay/loop/muted/inline; AV1 first where decodable | Decorative; `aria-hidden`, poster fallback | User-directed |
| white-desert-film | `public/media/video/white-desert-film.mp4`                                                                                              | Watch Film modal and detail media                                             | Cloudflare Stream `87c22e0a…/downloads/default.mp4`                                                                                                                                                                                                                                                                                                                                                          | White Desert                     | Client authorization                                                            | MP4 H.264/AAC, 1920×1080, 420.93 s, 4.48 Mbps, 235.7 MB                                                                       | `preload="metadata"`; playback only on request                              | Labelled native video controls             | Approved      |

The long-form film is now present locally and is not deferred. Its 235.7 MB
payload is a recorded delivery risk: it is excluded from above-fold loading,
but must be replaced by an approved web-encoded derivative before a deployment
whose static-file or transfer budget cannot accommodate it. This risk does not
apply to the muted hero loop, whose four encodes are dedicated web files with
faststart and no audio track; each visitor downloads one of them.

`public/media/target/hero-poster.webp` is the 1920×1080 first decoded frame of
the current landscape H.264 `hero-antarctica` encode. It is a decorative loading
fallback with the same source, permission statement and user-directed production
approval as the video, and prevents an earlier poster from flashing before playback.

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

## ADELVA 経営・運営統括 plates — 2026-09-24

User adopted the A2 desktop/mobile mocks and authorized production of
`/services/management-operations`. Nineteen text-free photographic edits of the
adopted mocks were generated by Codex `gpt-6-astra` (reasoning `high`, built-in
`image_gen`) from prompts authored by Opus 5.5; each prompt was sent verbatim
(verified against the per-image records) and each original was copied
byte-for-byte (SHA-256 verified). Continuous subjects (desktop building, mobile
descent, mobile shaft dark/lit) were outpainted on overlap canvases and joined
with the mock folder's `tools/join.mjs`; no flat-band joins. Desktop L0/L1
registration measured (0,0) by gradient correlation; mobile ≤1px. No text,
numbers, UI, lines, dots or state is baked into any delivered image: every
string, line, bracket, dot, tick, check, landing line and state is HTML/CSS/SVG.
Fictional facility, no people; not evidence of a real client or property.
Originals, records, exact prompts, joined work files and manifest:
`assets/source/generated/adelva/management-operations-2026-09-24/`.
Delivered WebP (20 files, no upscale beyond the native generation size):
`public/media/adelva/management-operations/`, derived deterministically by
`scripts/adelva/prepare-management-operations-assets.mjs`. Decorative empty alt;
LCP plates preloaded per media; everything else lazy with reserved dimensions.

### Japanese font coverage extension — 2026-09-24

`adelva-noto-sans-jp.woff2` 589→631 cmap entries (249,636 bytes) and
`adelva-noto-serif-jp.woff2` 598→631 (343,988 bytes) for the new page corpus.
Same licensed full sources (google/fonts `ofl/notosansjp`, `ofl/notoserifjp`,
revisions 2.004 / 2.003, identical to the existing subsets), fontTools + Brotli;
all previous glyph outlines and advances verified unchanged (0 of 589 / 0 of 598
differ). Reproduce with `scripts/adelva/extend-management-operations-fonts.py`.

### ADELVA revenue / brand growth — 2026-09-28

User-authorized A4 ONE RIVER implementation at `/services/revenue-brand`.
Fictional aerial plates, courtyard/back-of-house photos and fog were created with
built-in image_gen by Codex `gpt-6-astra` (reasoning high) as edits of the adopted
mock slices (text and UI removed) and two new fog sprites; every prompt, the
stitching and the line geometry are by Opus 5.5. Not evidence of any real
property, client or case. Originals and generation records remain in
`assets/source/generated/adelva/revenue-brand-2026-09-28/`.
No new image generation or reference raster is shipped by this implementation.
Delivery derivatives are deterministic sharp crops/encodes: 72 overlapping
background tiles (desktop 1536/1024, mobile 853/600; AVIF/WebP), 8 related-card
images (1200/800; AVIF/WebP), 4 fog images (1536/768 WebP), all with empty
alt because DOM carries the information. Tile 0 is media-preloaded, tile 1
eager, remaining tiles/cards/fog lazy. SHA-256, dimensions, bytes, source,
owner, intended role and loading are recorded per file in the source-folder
`manifest.json`; delivery directory is `public/media/adelva/revenue-brand/`.
Noto subsets were extended from the existing OFL full fonts in
`~/.cache/adelva-fonts/`, preserving every previous cmap entry: Sans 631→643,
Serif 631→649. Reproduce with `scripts/adelva/extend-revenue-brand-fonts.py`.
Implementation and verification evidence:
`docs/reports/adelva-revenue-brand-2026-09-28/README.md`.

## ADELVA 支援の進め方 plates — 2026-09-26

User adopted the A desktop mock (`A-full.png`) and its mobile translation
(`A-mobile/A-mobile-full-390.png`) and asked for `/approach` to be built from
them. Seventeen text-free photographic edits of the mocks' photograph regions
(desktop hero, stages 01–06, integrated support, ridge; mobile hero, stages
01–06, integrated support) were generated by Codex `gpt-6-astra` (reasoning
`medium`, built-in `image_gen` edit; six parallel workers, log headers and
session `turn_context` recorded) from prompts authored by Opus 5.5. Every
prompt was sent verbatim (`verbatim_verified: true` in each record) and each
original was copied byte-for-byte (SHA-256 verified); D-06 and M-04 were each
regenerated once for a composition change. Edit inputs were cut from the
mocks by `scripts/adelva/prepare-approach-edit-inputs.mjs` (desktop regions
upscaled with lanczos3 to 1536 px wide; mobile regions from the native
segments). No text, numbers, UI, finders, magnification lines, dots or state
is baked into any delivered image: all of it is HTML/CSS/SVG. Fictional
ryokan, no people; not evidence of a real client or property. Inputs, exact
prompts, worker briefs, records, originals and `delivered.json`:
`assets/source/generated/adelva/approach-page-2026-09-26/`. Delivered WebP (30
files, 4.4 MB, no upscale beyond the native generation size, 1280w/720w
renditions for 1× screens): `public/media/adelva/approach/`, derived
deterministically by `scripts/adelva/prepare-approach-assets.mjs`. Stage
photographs carry scale-describing alt text; hero and backgrounds are
decorative. LCP plates are preloaded per media; everything else is lazy with
reserved dimensions.

### Japanese font coverage extension — 2026-09-26

`adelva-noto-sans-jp.woff2` 631→702 cmap entries and
`adelva-noto-serif-jp.woff2` 631→687 for the `/approach` corpus. Same licensed
full sources (google/fonts `ofl/notosansjp` revision 2.004,
`ofl/notoserifjp` revision 2.003 — identical to the existing subsets),
fontTools + Brotli; every previous cmap entry is kept (asserted). Reproduce with
`scripts/adelva/extend-approach-fonts.py`.

## ADELVA DX・IT・調達基盤 — 2026-09-28 implementation

Existing plates were supplied and explicitly authorized for this page by the
user's IMPLEMENTATION-PROMPT.md §1. No image was generated, re-encoded, cropped,
resized or otherwise changed in this implementation. Source/owner: the supplied
ADELVA project assets in assets/source/generated/adelva/dx-it-procurement-2026-09-28;
usage authority: user-provided project-specific permission, no third-party target
website imagery. The photographs depict a fictional setting. Original generation
records remain with the source assets; no new generation/model claims are made.
All 23 delivered files below retain their original hashes. Every photograph is
decorative (empty alt, in an aria-hidden container); all copy, lines and state
are DOM/CSS/SVG. Width and height reserve the layout. Desktop/mobile media
selection prevents loading the other composition.

| Delivery file      | Dimensions | Bytes  | Role / loading                                                             |
| ------------------ | ---------- | ------ | -------------------------------------------------------------------------- |
| d-map.webp         | 1536×2304  | 425552 | Desktop hero/map; eager + media preload                                    |
| d-map-1024.webp    | 1024×1536  | 241772 | Desktop hero/map; eager + media preload                                    |
| d-map-off.webp     | 756×1960   | 109078 | Initial desktop off layer; href only during normal-motion desktop playback |
| d-diff.webp        | 768×1152   | 158854 | Comparison photograph; lazy                                                |
| d-process.webp     | 1536×1664  | 337450 | Desktop process/off window; lazy                                           |
| d-process-off.webp | 340×1330   | 43558  | Desktop process/off window; lazy                                           |
| card-01.webp       | 960×960    | 135264 | Related photograph; lazy with native srcSet dimensions                     |
| card-01-560.webp   | 560×560    | 57422  | Related photograph; lazy with native srcSet dimensions                     |
| card-02.webp       | 960×960    | 122336 | Related photograph; lazy with native srcSet dimensions                     |
| card-02-560.webp   | 560×560    | 54500  | Related photograph; lazy with native srcSet dimensions                     |
| m-body-0.webp      | 780×1375   | 66568  | Mobile hero; eager + media preload                                         |
| m-body-1.webp      | 780×1375   | 99470  | Continuous mobile photograph; lazy                                         |
| m-body-2.webp      | 780×1375   | 87304  | Continuous mobile photograph; lazy                                         |
| m-body-3.webp      | 780×1375   | 87106  | Continuous mobile photograph; lazy                                         |
| m-body-4.webp      | 780×1375   | 83088  | Continuous mobile photograph; lazy                                         |
| m-body-5.webp      | 780×1375   | 117616 | Continuous mobile photograph; lazy                                         |
| m-body-6.webp      | 780×1375   | 106240 | Continuous mobile photograph; lazy                                         |
| m-body-7.webp      | 780×1375   | 107770 | Continuous mobile photograph; lazy                                         |
| m-core-off-0.webp  | 220×1926   | 38154  | Mobile off window; lazy                                                    |
| m-core-off-1.webp  | 220×1926   | 32298  | Mobile off window; lazy                                                    |
| m-core-off-2.webp  | 220×1926   | 25494  | Mobile off window; lazy                                                    |
| m-core-off-3.webp  | 220×1926   | 32938  | Mobile off window; lazy                                                    |
| m-core-off-4.webp  | 220×1926   | 40750  | Mobile off window; lazy                                                    |

Manifest: public/media/adelva/dx-it-procurement/manifest.json. Exact geometry:
source plates.json. Provenance/immutability evidence and final captures:
docs/reports/adelva-dx-it-procurement-2026-09-28/.

### Japanese font coverage extension

Same local, licensed Noto sources (Sans JP 2.004 / Serif JP 2.003; Google Fonts
SIL OFL, existing project license files). The subsets extend the working-tree
coverage without removing existing cmap entries: Sans 702→712 (+10), Serif
687→695 (+8). Reproduction: scripts/adelva/extend-dx-it-procurement-fonts.py;
measured added characters and zero lost entries: the report's fonts.json.

## 2026-09-29 /contact C2「朝霧」

Source: the user-selected C2 mock set, `references/adelva/mockups/contact-r2-2026-09-29/C2/`
(clean plates and fog-lifted variants generated with built-in `image_gen` by Codex
`gpt-6-astra` workers from Opus-written prompts; fictional valley and inn, no real
property, person or client). No new generation for production: the derivatives are
deterministic re-encodes by `scripts/adelva/prepare-contact-assets.mjs`, which bakes
the mock's multiply tone (rgb 58 72 96, alpha stops in the script) into the plates.
All images are decorative (`alt=""`, inside `aria-hidden` layers).

| Files (public/media/adelva/contact/)    | Source                               | Role / loading                                                  |
| --------------------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| d-plate-{0..7}-{1536,1024}.{avif,webp}  | C2/plates/plate.png 1536×6144        | Desktop photograph, 768+4 rows each; tile 0 media preload, lazy |
| m-plate-{0..9}-{853,600}.{avif,webp}    | C2/mobile/plate.png 853×12960        | Mobile photograph, 1296+4 rows each; tile 0 media preload, lazy |
| d-clear-{0,1,4}-{1536,1024}.{avif,webp} | C2/raw/V-clear-T00/T01/T04.png       | Fog-lifted variants; mounted after the first interaction        |
| m-clear-{1,2,4,5}-{853,600}.{avif,webp} | C2/mobile/variants/V-B1/B2/B4/B5.png | Fog-lifted variants; mounted after the first interaction        |

Manifest with hashes and byte sizes: assets/source/generated/adelva/contact-2026-09-29/manifest.json.
Font coverage: `scripts/adelva/extend-contact-fonts.py` extended the working-tree
subsets from the same licensed Noto sources without removing entries (Sans 721→744,
Serif 708→733). Evidence: docs/reports/adelva-contact-2026-09-29/.

## 2026-09-30 /challenges/general-managers A2「棚田」

Source: the user-adopted A2 and A2-mobile mocks,
`references/adelva/mockups/general-managers-2026-09-29/A2/` and `A2-mobile/`
(text-free plates and "before selection" variants generated with built-in
`image_gen` by Codex `gpt-6-astra` workers from Opus-written prompts; fictional
terraces and inn, no real property, person or client). No new generation for
production. `scripts/adelva/prepare-general-managers-assets.mjs` makes every
derivative deterministically:

- the delivered plate is the adopted plate with the water of its two lit terraces
  swapped for the unlit variant (masks from a seeded flood fill on B − G > 18);
- 品質・システム定着 lit overlays are the adopted plate's own lit water;
- 人材・生産性・販売 lit overlays carry the low-frequency light field and sky streaks of
  a lit terrace onto each terrace's own reflections (image processing, no model).

All images are decorative (`alt=""`, inside `aria-hidden` layers).

| Files (public/media/adelva/general-managers/)                         | Source                                         | Role / loading                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| d-plate-{0..7}-{1536,1024}.{avif,webp}                                | A2/plates/plate.png 1536×8064 + A2/raw/V-unlit | Desktop photograph, 1008+4 rows each; tile 0 media preload, 0–1 eager |
| m-plate-{0..7}-{853,600}.{avif,webp}                                  | A2-mobile/plates/plate.png 853×16136 + unlit   | Mobile photograph, 2017+4 rows each; same loading                     |
| {d,m}-lit-{quality,people,productivity,sales,system}.{avif,webp} RGBA | as above; three by light-field transfer        | Lit terraces revealed by a CSS mask when an issue is checked; lazy    |

Manifest with source hashes, crops, byte sizes and hashes:
`assets/source/generated/adelva/general-managers-2026-09-30/manifest.json`.
Font coverage: `scripts/adelva/extend-general-managers-fonts.py` extended the
working-tree subsets from the same licensed Noto sources without removing entries
(Sans 766→779: ひ員始択昧曖示討起過際／：; Serif unchanged at 757).

## 2026-09-30 /challenges/owner B2「囲炉裏」

Source: the user-adopted B2 and B2-mobile mocks,
`references/adelva/mockups/owner-2026-09-29/B2/` and `B2-mobile/` (text-free
plates and pre-dawn `V-dawn` variants generated with built-in `image_gen` by Codex
`gpt-6-astra` workers from Opus-written prompts; a fictional old inn, no real
property, person or client). No new generation for production.
`scripts/adelva/prepare-owner-assets.mjs` makes every derivative deterministically:
the plates are tiled and re-encoded, the pre-dawn variants re-encoded, and the
ember "breath" layer is the plate's own charcoal bed with only its hot pixels
(saturated orange-red) kept, brightened and feathered into an RGBA overlay
(image processing, no model). The light shaft, pools, steam and hearth diagram are
CSS/SVG. All images are decorative (`alt=""`, inside an `aria-hidden` layer).

| Files (public/media/adelva/owner/)         | Source                                                                       | Role / loading                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| d-plate-{0..9}-{1536,1024}.{avif,webp}     | B2/plates/plate.png 1536×10950                                               | Desktop photograph, 1095+4 rows each; tile 0 media preload, 0–1 eager                    |
| m-plate-{0..8}-{853,600}.{avif,webp}       | B2-mobile/plates/plate.png 853×17724                                         | Mobile photograph, 1969+4 rows each; same loading                                        |
| {d,m}-dawn-{1536/853,1024/600}.{avif,webp} | B2/raw/V-dawn.png 1536×1024, B2-mobile/bands/V-dawn.png 853×1844             | Load sequence only (media preload with no-preference; never painted with reduced motion) |
| {d,m}-ember.{avif,webp} RGBA               | the plates' charcoal bed (page boxes 440,5280–1000,5680 / 176,4350–390,4650) | Ember breath, `screen`, lazy; painted only while motion runs                             |

Manifest with source hashes, crops, byte sizes and hashes:
`assets/source/generated/adelva/owner-2026-09-30/manifest.json`. Font coverage:
`scripts/adelva/extend-owner-fonts.py` extended the working-tree subsets from the
same licensed Noto sources without removing entries (Sans 779→785: 不区局炉独裏;
Serif 757→759: 炉裏). The previous owner page's photographs
(`public/media/adelva/audience-v4/`) were removed with that page.
