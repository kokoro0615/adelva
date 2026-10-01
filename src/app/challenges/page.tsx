import type { Metadata } from "next";
import { NosignerHome } from "@/components/nosigner/home";
import { SiteHeader } from "@/components/site-header";
import "./nosigner.css";
import { JsonLd } from "@/components/json-ld";
import { pageGraph, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/challenges");

export default function ChallengesPage() {
  return (
    <>
      <JsonLd data={pageGraph("/challenges")} />
      <SiteHeader />
      <NosignerHome />
    </>
  );
}
