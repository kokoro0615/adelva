import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/content/site";
import { indexablePages } from "@/content/site-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: page.updated,
  }));
}
