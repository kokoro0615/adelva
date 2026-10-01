import type { Metadata } from "next";
import { preload } from "react-dom";

import { HomePage } from "@/components/home-a2/home-page";
import { JsonLd } from "@/components/json-ld";
import { getAsset } from "@/content/assets";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/");

/**
 * HOME renders the adopted A2r3「二つの視点 — 一本の線」composition
 * (`docs/specs/adelva-home-spec.md`). The previous composition is kept at the
 * git tag `backup/home-before-a2r3-2026-10-02`.
 */
export default function HomeRoute() {
  // the film's poster is the first paint and the largest one
  preload(getAsset("hero-poster").src, { as: "image", fetchPriority: "high" });
  return (
    <>
      <JsonLd data={pageGraph("/")} />
      <HomePage />
    </>
  );
}
