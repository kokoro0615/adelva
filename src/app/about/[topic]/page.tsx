import type { Metadata } from "next";

import { DetailDocument } from "@/components/detail-clone/detail-document";
import { detailPageForPath } from "@/content/detail-target";
import { childSegments } from "@/lib/routes";

interface RouteParams {
  readonly params: Promise<{ readonly topic: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return childSegments("/about/").map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { topic } = await params;
  const page = detailPageForPath(`/about/${topic}`);
  return { title: page.title, description: page.description };
}

export default async function AboutRoute({ params }: RouteParams) {
  const { topic } = await params;
  return <DetailDocument page={detailPageForPath(`/about/${topic}`)} />;
}
