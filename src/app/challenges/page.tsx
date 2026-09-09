import type { Metadata } from "next";
import { NosignerHome } from "@/components/nosigner/home";
import { SiteHeader } from "@/components/site-header";
import "./nosigner.css";

export const metadata: Metadata = {
  title: { absolute: "課題から探す — ADELVA" },
  description:
    "ADELVAは、ホテル・旅館の経営、現場運営、収益成長、ブランド、DX・ITを一つの改善計画につなぐ経営実装パートナーです。",
  robots: { index: false, follow: false },
};

export default function ChallengesPage() {
  return (
    <>
      <SiteHeader />
      <NosignerHome />
    </>
  );
}
