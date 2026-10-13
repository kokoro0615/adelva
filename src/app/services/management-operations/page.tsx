import type { Metadata } from "next";
import { preload } from "react-dom";

import { ManagementOperationsPage } from "@/components/management-operations/management-operations-page";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/services/management-operations");

const dir = "/media/adelva/management-operations/";

export default function ManagementOperationsRoute() {
  /* Desktop paints the first plate tile and its pre-dawn variant first (as
     <img> tiles). Narrow viewports draw the photograph from small tiles that
     the camera fetches itself (WebGL, see camera-gl.ts): nothing to preload. */
  preload(`${dir}base-0.webp`, {
    as: "image",
    media: "(min-width: 1024px)",
    fetchPriority: "high",
  });
  preload(`${dir}dim-0.webp`, {
    as: "image",
    media: "(min-width: 1024px)",
    fetchPriority: "high",
  });
  return (
    <>
      <JsonLd data={pageGraph("/services/management-operations")} />
      <ManagementOperationsPage />
    </>
  );
}
