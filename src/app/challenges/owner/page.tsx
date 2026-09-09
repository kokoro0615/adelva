import type { Metadata } from "next";
import { AudiencePage } from "@/components/audience/audience-page";

export const metadata: Metadata = {
  title: { absolute: "オーナー・経営者の方へ — ADELVA" },
  description:
    "ホテル・旅館の経営と現場を、一つの改善計画につなぐ。経営判断を、実行可能な改善計画へ。",
  robots: { index: false, follow: false },
};

export default function OwnerPage() {
  return <AudiencePage audience="owner" />;
}
