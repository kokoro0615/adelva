/**
 * White Desert route groups for the global footer.
 *
 * The shared header used to render its menu from this module. It now renders
 * the authorized ADELVA navigation from `src/content/adelva-navigation.ts`, so
 * the header-only exports (`homeLink`, `menuSections`, `menuActions`) were
 * removed with that replacement. Everything the footer consumes is untouched:
 * the footer remains the complete, script-free index of all 30 routes.
 */

import type { RoutePath } from "@/content/route-manifest";
import { campTabs, journeyTabs, regionTabs } from "@/content/shared";

export interface NavLink {
  readonly href: RoutePath | `https://${string}`;
  readonly label: string;
}

export interface NavGroup {
  readonly id: string;
  readonly title: string;
  readonly links: readonly NavLink[];
}

const journeyLinks: readonly NavLink[] = [
  ...journeyTabs,
  { href: "/itineraries", label: "View All" },
];

const campLinks: readonly NavLink[] = [
  ...campTabs,
  { href: "/camps", label: "View All" },
];

/**
 * The footer carries the complete route set so navigation stays usable with
 * JavaScript disabled, when the scripted menu cannot open. Since the header now
 * carries the ADELVA information architecture, this is also the only place the
 * White Desert routes are linked from the global shell.
 */
export const footerGroups: readonly NavGroup[] = [
  { id: "footer-journeys", title: "Itineraries", links: journeyLinks },
  { id: "footer-camps", title: "Camps", links: campLinks },
  {
    id: "footer-regions",
    title: "Antarctica",
    links: [
      ...regionTabs,
      {
        href: "/antarctica/direct-flights-to-antarctica",
        label: "Aviation",
      },
      { href: "/antarctica", label: "View All" },
    ],
  },
  {
    id: "footer-about",
    title: "About",
    links: [
      { href: "/about/founders", label: "Our Story" },
      { href: "https://www.dr-jones.com/", label: "Dr Jones" },
    ],
  },
];

export function isCurrent(pathname: string, href: NavLink["href"]): boolean {
  return pathname === href;
}
