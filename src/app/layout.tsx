import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

import { FilmExperience } from "@/components/home/film-experience";
import { HomeFooter } from "@/components/home/home-footer";
import { HowItWorks } from "@/components/how-it-works";
import { RouteShell } from "@/components/route-shell";
import { RouteFooter } from "@/components/route-footer";
import { RouteTransition } from "@/components/route-transition";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/content/shared";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s — ${brand.name}`,
  },
  description: brand.tagline,
  applicationName: brand.name,
  formatDetection: { telephone: false, email: false, address: false },
};

/**
 * The document language is `en` because the original copy in
 * `src/content/**` is written in English. No target locale is claimed.
 */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RouteShell
          legacy={
            <>
              <a className="skip-link" data-skip-link href="#main-content">
                Skip to content
              </a>

              {/* HOME uses the measured nine-rule grid (five on mobile).
                  Other legacy routes retain their six-column treatment. */}
              <div className="grid-rules" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <ScrollProvider />
              <RouteTransition />

              <FilmExperience>
                <SiteHeader />
                <main id="main-content">{children}</main>
                <RouteFooter home={<HomeFooter />} legacy={<SiteFooter />} />
                <HowItWorks />
              </FilmExperience>
            </>
          }
        >
          {children}
        </RouteShell>
      </body>
    </html>
  );
}
