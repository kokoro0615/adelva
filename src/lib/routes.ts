import { pageDocumentRegistry, type RenderedRoutePath } from "@/content/pages";

/**
 * Route helpers for the App Router segments.
 *
 * Every lookup goes through the typed page registry, which is itself asserted
 * against `scripts/fidelity/route-manifest.mjs` in `tests/unit`. No template
 * may infer a route from a pathname substring or keep a second route list.
 */
const renderedPaths: readonly string[] = Object.keys(pageDocumentRegistry);
const renderedPathSet = new Set(renderedPaths);

export function toRenderedRoutePath(candidate: string): RenderedRoutePath | null {
  return renderedPathSet.has(candidate) ? (candidate as RenderedRoutePath) : null;
}

/**
 * Direct children of a route prefix, used by `generateStaticParams` so the
 * dynamic segments render exactly the manifest routes and nothing else.
 */
export function childSegments(prefix: string): string[] {
  return renderedPaths
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length))
    .filter((segment) => segment.length > 0 && !segment.includes("/"));
}
