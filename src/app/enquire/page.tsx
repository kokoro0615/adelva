import type { Metadata } from "next";

import { DetailDocument } from "@/components/detail-clone/detail-document";
import { detailPageForPath } from "@/content/detail-target";

const page = detailPageForPath("/enquire");

export const metadata: Metadata = { title: page.title, description: page.description };

export default function EnquiryRoute() {
  return <DetailDocument page={page} />;
}
