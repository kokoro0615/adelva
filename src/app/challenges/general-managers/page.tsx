import type { Metadata } from "next";
import { AudiencePage } from "@/components/audience/audience-page";

export const metadata: Metadata = {
  title: { absolute: "総支配人・現場責任者の方へ — ADELVA" },
  description:
    "現場の課題を、続けられる改善へ。現場運営・人材・販売・ITを、一つの改善計画につなぎます。",
  robots: { index: false, follow: false },
};

export default function GeneralManagersPage() {
  return <AudiencePage audience="general-managers" />;
}
