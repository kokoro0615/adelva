import type { Metadata } from "next";
import { preload } from "react-dom";

import { ManagementOperationsPage } from "@/components/management-operations/management-operations-page";
import { meta } from "@/content/adelva-management-operations";

export const metadata: Metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  robots: { index: false, follow: false },
};

const dir = "/media/adelva/management-operations/";

export default function ManagementOperationsRoute() {
  /* Both regimes paint the first plate tile and its pre-dawn variant first
     (desktop as <img> tiles, narrow viewports into a canvas); narrow viewports
     also need the sky above the plate for the hero. */
  preload(`${dir}base-0.webp`, { as: "image", fetchPriority: "high" });
  preload(`${dir}dim-0.webp`, { as: "image", fetchPriority: "high" });
  preload(`${dir}sky.webp`, {
    as: "image",
    media: "(max-width: 1023.98px)",
    fetchPriority: "high",
  });
  return <ManagementOperationsPage />;
}
