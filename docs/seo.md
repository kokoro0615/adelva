# ADELVA search, sharing and AI-answer setup

Configured 2026-10-02 (user decisions in `docs/clone-workflow-ledger.md`).
Canonical origin: `https://www.adelva.jp` (apex and http answer 308 to it).

## Where things live

| Concern                                                                                                                                            | Source                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Site identity, company facts (from the /about profile and the National Tax Agency registry)                                                        | `src/content/site.ts`                                                               |
| Every public route: title, description, preview image, breadcrumb, schema type, `updated`, `indexable`                                             | `src/content/site-pages.ts`                                                         |
| Metadata and JSON-LD builders                                                                                                                      | `src/lib/seo.ts`, `src/components/json-ld.tsx`                                      |
| Root defaults (`lang="ja"`, `metadataBase`, title template `%s｜ADELVA`, robots with `max-image-preview:large`) and Organization + WebSite JSON-LD | `src/app/layout.tsx`                                                                |
| robots.txt (everything allowed; AI crawlers named), sitemap.xml, manifest, llms.txt                                                                | `src/app/robots.ts`, `sitemap.ts`, `manifest.ts`, `llms.txt/route.ts`               |
| Favicon and icons                                                                                                                                  | `src/app/{favicon.ico,icon.png,apple-icon.png}`, `public/icons/` ← `pnpm seo:icons` |
| Social previews (1200×630)                                                                                                                         | `public/og/*.jpg` ← `pnpm build && pnpm seo:og`                                     |
| Redirects                                                                                                                                          | `next.config.ts`                                                                    |
| IndexNow key and submitter                                                                                                                         | `public/8cd899035b8f54e6c01db9510bf49d64.txt`, `pnpm seo:indexnow`                  |
| Checks                                                                                                                                             | `tests/unit/seo.test.ts`, `tests/e2e/seo.spec.ts`                                   |

Each page file exports `metadata = pageMetadata(path)` and renders
`<JsonLd data={pageGraph(path)} />`. Structured data per page: WebPage (or
AboutPage / ContactPage / CollectionPage), BreadcrumbList where the page shows a
breadcrumb, and on the three domain pages a Service with an OfferCatalog of the
approved service names (20 in total).

## Adding or changing a page

1. Add or edit its entry in `site-pages.ts` (titles stay ≤ 40 characters with
   the suffix, descriptions 60–130; compose them from approved copy only).
2. Use `pageMetadata` and `pageGraph` in the page file.
3. Add the page to `scripts/seo/build-og-images.mjs`, build, run `pnpm seo:og`.
4. When a planned `/services/...` page ships, delete its temporary redirect in
   `next.config.ts`.
5. After deploying, run `pnpm seo:indexnow`.

When the final logo replaces `public/brand/adelva-logo.png`, run
`pnpm seo:icons`, then `pnpm build && pnpm seo:og`.

## Owner actions outside the repository

- Google Search Console: add a Domain property for `adelva.jp`, put the TXT
  record it shows in the お名前.com DNS, then submit
  `https://www.adelva.jp/sitemap.xml`. Use URL Inspection on `/` to request
  indexing. The "Generative AI" performance report shows AI Overview / AI Mode
  visibility.
- Bing Webmaster Tools: import the site from Search Console (or verify by DNS)
  and submit the same sitemap. Bing's index also feeds Copilot and other AI
  search products.
- No Google Business Profile (user decision: no MEO).

## Known gaps (not decided in this change)

- No privacy policy page, although /contact links `/privacy` and the form asks
  for consent to it.
- The contact form has no delivery destination in production
  (`CONTACT_WEBHOOK_URL`), so the page says it is not accepting submissions.
- No FAQ, case study or author/representative profile content yet; Google's AI
  features reward original, specific content more than any markup.
