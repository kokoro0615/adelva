import type { Metadata } from "next";
import { preload } from "react-dom";

import { ApproachPage } from "@/components/approach/approach-page";
import { plates } from "@/content/adelva-approach-page";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/approach");

export default function ApproachRoute() {
  /* The LCP photograph differs by viewport (art direction), so each candidate
     is preloaded only for the media that paints it — the reason the installed
     Next 16 guide gives for not using `<Image preload>` with art direction. */
  const { desktop, mobile } = plates;
  preload(desktop.hero.src, {
    as: "image",
    media: "(min-width: 1024px)",
    imageSrcSet: `${desktop.hero.small!.src} ${desktop.hero.small!.width}w, ${desktop.hero.src} ${desktop.hero.width}w`,
    imageSizes: "(min-width: 1920px) 1920px, 100vw",
    fetchPriority: "high",
  });
  preload(mobile.hero.src, {
    as: "image",
    media: "(max-width: 1023.98px)",
    fetchPriority: "high",
  });
  return (
    <>
      <JsonLd data={pageGraph("/approach")} />
      <ApproachPage />
    </>
  );
}
