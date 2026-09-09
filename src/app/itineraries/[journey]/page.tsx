import type { Metadata } from "next";

import { DetailDocument } from "@/components/detail-clone/detail-document";
import { detailPageForPath } from "@/content/detail-target";
import { childSegments } from "@/lib/routes";

interface RouteParams {
  readonly params: Promise<{ readonly journey: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return childSegments("/itineraries/").map((journey) => ({ journey }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { journey } = await params;
  const page = detailPageForPath(`/itineraries/${journey}`);
  return { title: page.title, description: page.description };
}

export default async function JourneyDetailRoute({ params }: RouteParams) {
  const { journey } = await params;
  return <DetailDocument page={detailPageForPath(`/itineraries/${journey}`)} />;
}
