import type { Metadata } from "next";
import { preload } from "react-dom";
import { RevenueBrandPage } from "@/components/revenue-brand/revenue-brand-page";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("/services/revenue-brand");
export default function RevenueBrandRoute() {
  for (const [key, width, small, media] of [
    ["d", 1536, 1024, "(min-width: 1024px)"],
    ["m", 853, 600, "(max-width: 1023.98px)"],
  ] as const)
    preload(`/media/adelva/revenue-brand/${key}-plate-0-${width}.avif`, {
      as: "image",
      type: "image/avif",
      media,
      imageSrcSet: `/media/adelva/revenue-brand/${key}-plate-0-${small}.avif ${small}w, /media/adelva/revenue-brand/${key}-plate-0-${width}.avif ${width}w`,
      imageSizes: "(min-width: 1920px) 1920px, 100vw",
      fetchPriority: "high",
    });
  return (
    <>
      <JsonLd data={pageGraph("/services/revenue-brand")} />
      <RevenueBrandPage />
    </>
  );
}
