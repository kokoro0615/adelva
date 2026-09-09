import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPageDocument } from "@/content/pages";
import type { PageDocument } from "@/content/types";
import { toRenderedRoutePath } from "@/lib/routes";

/**
 * Resolve an App Router segment to its typed page document. Anything outside
 * the manifest is a 404 rather than a silently rendered stub.
 */
export function documentForPath(path: string): PageDocument {
  const routePath = toRenderedRoutePath(path);
  if (!routePath) {
    notFound();
  }

  return getPageDocument(routePath);
}

export function metadataFor(page: PageDocument): Metadata {
  return { title: page.title, description: page.description };
}
