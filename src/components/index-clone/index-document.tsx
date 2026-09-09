import { indexPages, type IndexPageContent } from "@/content/index-target";

import {
  IndexCta,
  IndexIntro,
  ItineraryList,
  CampList,
  TripsTitle,
} from "./index-sections";
import { IndexHero } from "./index-hero";
import { TripFlick } from "./trip-flick";
import styles from "./index-clone.module.css";

export type IndexRoute = "itineraries" | "camps";

export function IndexDocument({ route }: { readonly route: IndexRoute }) {
  const page: IndexPageContent = indexPages[route];

  return (
    <div
      className={`${styles.pageContent} page-content`}
      data-index-page-content
      data-index-route={route}
      data-fidelity-landmark="primary-content"
    >
      <IndexHero hero={page.hero} />
      <IndexIntro page={page} />
      {route === "itineraries" ? (
        <>
          <ItineraryList />
          <IndexCta page={page} />
        </>
      ) : (
        <>
          <CampList />
          <TripsTitle />
          <TripFlick />
          <IndexCta page={page} />
        </>
      )}
    </div>
  );
}
