import type { Metadata } from "next";
import { preload } from "react-dom";
import { AboutPage } from "@/components/about/about-page";
import { meta } from "@/content/adelva-about";

export const metadata: Metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  robots: { index: false, follow: false },
};

export default function AboutRoute() {
  // The first plate tile is the hero drawing: fetch it with the document.
  for (const [key, width, small, media] of [
    ["d", 1536, 1024, "(min-width: 1024px)"],
    ["m", 853, 600, "(max-width: 1023.98px)"],
  ] as const)
    preload(`/media/adelva/about-a2/${key}-plate-0-${width}.avif`, {
      as: "image",
      type: "image/avif",
      media,
      imageSrcSet: `/media/adelva/about-a2/${key}-plate-0-${small}.avif ${small}w, /media/adelva/about-a2/${key}-plate-0-${width}.avif ${width}w`,
      imageSizes: key === "d" ? "(min-width: 1920px) 1920px, 100vw" : "100vw",
      fetchPriority: "high",
    });
  return <AboutPage />;
}
