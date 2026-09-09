import type { Metadata } from "next";

import { IndexDocument } from "@/components/index-clone/index-document";
import { indexPages } from "@/content/index-target";

export const metadata: Metadata = {
  title: indexPages.itineraries.title,
  description: indexPages.itineraries.description,
};

export default function ItineraryIndexRoute() {
  return <IndexDocument route="itineraries" />;
}
