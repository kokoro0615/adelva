import type { Metadata } from "next";

import { DetailDocument } from "@/components/detail-clone/detail-document";
import { detailPageForPath } from "@/content/detail-target";
import { childSegments } from "@/lib/routes";

interface RouteParams {
  readonly params: Promise<{ readonly camp: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return childSegments("/camps/").map((camp) => ({ camp }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { camp } = await params;
  const page = detailPageForPath(`/camps/${camp}`);
  return { title: page.title, description: page.description };
}

export default async function CampDetailRoute({ params }: RouteParams) {
  const { camp } = await params;
  return <DetailDocument page={detailPageForPath(`/camps/${camp}`)} />;
}
