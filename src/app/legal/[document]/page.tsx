import type { Metadata } from "next";

import { LegalClone } from "@/components/legal-clone/legal-clone";
import { legalTargetForSlug } from "@/content/legal-target";
import { childSegments } from "@/lib/routes";

interface RouteParams {
  readonly params: Promise<{ readonly document: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return childSegments("/legal/").map((document) => ({ document }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { document } = await params;
  const target = legalTargetForSlug(document);
  return {
    title: { absolute: target.title },
    description: target.description,
    alternates: { canonical: `/legal/${target.slug}` },
  };
}

export default async function LegalRoute({ params }: RouteParams) {
  const { document } = await params;
  return <LegalClone document={legalTargetForSlug(document)} />;
}
