import type { Metadata } from "next";
import { preload } from "react-dom";
import { DxItProcurementPage } from "@/components/dx-it-procurement/dx-it-procurement-page";
import { media } from "@/content/adelva-dx-it-procurement";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/services/dx-it-procurement");
export default function DxItProcurementRoute() {
  for (const family of ["sans", "serif"]) {
    preload(`/fonts/adelva-noto-${family}-jp.woff2`, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }
  preload("/fonts/Oswald-VariableFont_wght.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  preload(`${media}d-map.webp`, {
    as: "image",
    media: "(min-width: 1024px)",
    imageSrcSet: `${media}d-map-1024.webp 1024w, ${media}d-map.webp 1536w`,
    imageSizes: "(min-width: 1920px) 1920px, 100vw",
    fetchPriority: "high",
  });
  preload(`${media}m-body-0.webp`, {
    as: "image",
    media: "(max-width: 1023.98px)",
    fetchPriority: "high",
  });
  return (
    <>
      <JsonLd data={pageGraph("/services/dx-it-procurement")} />
      <DxItProcurementPage />
    </>
  );
}
