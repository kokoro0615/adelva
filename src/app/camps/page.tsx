import type { Metadata } from "next";

import { IndexDocument } from "@/components/index-clone/index-document";
import { indexPages } from "@/content/index-target";

export const metadata: Metadata = {
  title: indexPages.camps.title,
  description: indexPages.camps.description,
};

export default function CampIndexRoute() {
  return <IndexDocument route="camps" />;
}
