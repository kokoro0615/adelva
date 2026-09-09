import type { Metadata } from "next";

import { DetailDocument } from "@/components/detail-clone/detail-document";
import { detailPageForPath } from "@/content/detail-target";
import { childSegments } from "@/lib/routes";

interface RouteParams {
  readonly params: Promise<{ readonly region: string }>;
}

/**
 * Covers both `region-detail` and the `operations` route that shares the
 * `/antarctica/` prefix. `/antarctica` itself never reaches this segment: it
 * is answered by the HTTP redirect configured in `next.config.ts`.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return childSegments("/antarctica/").map((region) => ({ region }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { region } = await params;
  const page = detailPageForPath(`/antarctica/${region}`);
  return { title: page.title, description: page.description };
}

export default async function RegionRoute({ params }: RouteParams) {
  const { region } = await params;
  return <DetailDocument page={detailPageForPath(`/antarctica/${region}`)} />;
}
