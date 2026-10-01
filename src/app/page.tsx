import type { Metadata } from "next";

import { HomeDocument } from "@/components/home/home-document";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/");

export default function HomeRoute() {
  return (
    <>
      <JsonLd data={pageGraph("/")} />
      <HomeDocument />
    </>
  );
}
