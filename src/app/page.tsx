import type { Metadata } from "next";

import { HomeDocument } from "@/components/home/home-document";
import { documentForPath, metadataFor } from "@/lib/page-loader";

const page = documentForPath("/");

export const metadata: Metadata = metadataFor(page);

/**
 * HOME renders its own `home-target-v1` composition rather than the generic
 * `RouteDocument`, which serves the other 27 manifest routes.
 */
export default function HomeRoute() {
  return <HomeDocument />;
}
