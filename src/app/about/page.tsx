import type { Metadata } from "next";
import { HomeFooter } from "@/components/home/home-footer";
import { MorghtPage } from "@/components/morght/morght-page";

export const metadata: Metadata = {
  title: { absolute: "ADELVAについて — ADELVA" },
  description:
    "ADELVAは、ホテル・旅館の経営、現場運営、収益成長、ブランド、DX・ITを一つの改善計画につなぐ経営実装パートナーです。",
  robots: { index: false, follow: false },
};

export default function AboutPage() {
  return (
    <>
      <MorghtPage />
      <HomeFooter />
    </>
  );
}
