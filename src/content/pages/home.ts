import type { PageDocument } from "@/content/types";

/**
 * HOME route identity and metadata only.
 *
 * The rendered HOME composition lives in `src/content/home-target.ts` and
 * `src/components/home/`, because `home-target-v1` is a bespoke topology —
 * seven direct `page-content` children, one of which nests a pinned horizontal
 * camps flow — that the generic `Section` union deliberately does not model.
 *
 * This record still exists so `/` keeps a single source of route identity,
 * canonical path, family and metadata alongside the other 27 routes.
 */
export const homePage: PageDocument = {
  path: "/",
  family: "home",
  title: "Luxury Adventures in Antarctica",
  description:
    "Fly from Cape Town to the Antarctic interior for a small-group stay in the most remote place on Earth.",
  hero: {
    title: "Antarctica",
    titleStyle: "condensed",
    align: "anchor",
    assetId: "hero-poster",
  },
  sections: [],
  cta: null,
};
