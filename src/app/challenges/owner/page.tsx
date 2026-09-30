import type { Metadata } from "next";
import { preload } from "react-dom";

import { OwnerPage } from "@/components/owner/owner-page";
import { meta } from "@/content/adelva-owner";

export const metadata: Metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  robots: { index: false, follow: false },
};

const dir = "/media/adelva/owner/";
const regimes = [
  ["d", 1536, 1024, "(min-width: 1024px)", "(min-width: 1920px) 1920px, 100vw"],
  ["m", 853, 600, "(max-width: 1023.98px)", "100vw"],
] as const;

export default function OwnerRoute() {
  // The first tile of the photograph is the LCP; the pre-dawn variant covers it
  // during the load sequence (never with reduced motion). Preload only the ones
  // the viewport will use.
  for (const [key, width, small, media, sizes] of regimes) {
    for (const [name, when] of [
      ["plate-0", media],
      ["dawn", `${media} and (prefers-reduced-motion: no-preference)`],
    ] as const) {
      preload(`${dir}${key}-${name}-${width}.avif`, {
        as: "image",
        type: "image/avif",
        media: when,
        imageSrcSet: `${dir}${key}-${name}-${small}.avif ${small}w, ${dir}${key}-${name}-${width}.avif ${width}w`,
        imageSizes: sizes,
        fetchPriority: "high",
      });
    }
  }
  return <OwnerPage />;
}
