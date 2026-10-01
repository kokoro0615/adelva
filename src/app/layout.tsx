import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

import { HomeFooter } from "@/components/home/home-footer";
import { JsonLd } from "@/components/json-ld";
import { RouteShell } from "@/components/route-shell";
import { RouteTransition } from "@/components/route-transition";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { siteGraph } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}（${site.nameKana}）｜${site.positioning}`,
    template: `%s｜${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: { type: "website", locale: site.locale, siteName: site.name },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    // globals.css smooth-scrolls in-page anchors; this lets Next.js 16 switch it
    // off during route transitions so a new page opens at its top instantly.
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        <JsonLd data={siteGraph()} />
        <RouteShell
          legacy={
            <>
              <a className="skip-link" data-skip-link href="#main-content">
                本文へ移動
              </a>

              {/* HOME uses the measured nine-rule grid (five on mobile). */}
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

              <SiteHeader />
              <main id="main-content">{children}</main>
              <HomeFooter />
            </>
          }
        >
          {children}
        </RouteShell>
      </body>
    </html>
  );
}
