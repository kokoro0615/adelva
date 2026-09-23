import type { Metadata } from "next";
import { preload } from "react-dom";

import { ManagementOperationsPage } from "@/components/management-operations/management-operations-page";
import { buildingPlate, meta } from "@/content/adelva-management-operations";

export const metadata: Metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  robots: { index: false, follow: false },
};

export default function ManagementOperationsRoute() {
  /* The LCP photograph differs by viewport (art direction), so each candidate
     is preloaded only for the media that paints it — the reason the installed
     Next 16 guide gives for not using `<Image preload>` with art direction. */
  preload(buildingPlate.src, {
    as: "image",
    media: "(min-width: 600px)",
    imageSrcSet: `${buildingPlate.srcSmall} 1024w, ${buildingPlate.src} 1536w`,
    imageSizes: "(min-width: 1920px) 1920px, 100vw",
    fetchPriority: "high",
  });
  preload("/media/adelva/management-operations/m-hero.webp", {
    as: "image",
    media: "(max-width: 599.98px)",
    fetchPriority: "high",
  });
  return <ManagementOperationsPage />;
}
