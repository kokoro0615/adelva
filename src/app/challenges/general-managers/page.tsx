import type { Metadata } from "next";
import { preload } from "react-dom";

import { GeneralManagersPage } from "@/components/general-managers/general-managers-page";
import { meta } from "@/content/adelva-general-managers";

export const metadata: Metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  robots: { index: false, follow: false },
};

export default function GeneralManagersRoute() {
  // The first tile of the photograph is the LCP; preload only the one the
  // viewport will use.
  for (const [key, width, small, media, sizes] of [
    ["d", 1536, 1024, "(min-width: 1024px)", "(min-width: 1920px) 1920px, 100vw"],
    ["m", 853, 600, "(max-width: 1023.98px)", "100vw"],
  ] as const)
    preload(`/media/adelva/general-managers/${key}-plate-0-${width}.avif`, {
      as: "image",
      type: "image/avif",
      media,
      imageSrcSet: `/media/adelva/general-managers/${key}-plate-0-${small}.avif ${small}w, /media/adelva/general-managers/${key}-plate-0-${width}.avif ${width}w`,
      imageSizes: sizes,
      fetchPriority: "high",
    });
  return <GeneralManagersPage />;
}
