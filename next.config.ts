import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional isolated output for parallel local verification; default is unchanged.
  distDir: process.env.CLONETEST_DIST_DIR || ".next",
  // Fidelity tooling opens the local dev server through the loopback address.
  // Without this allow-list Next serves the document but rejects every client
  // chunk with 403, which silently disables autoplay, dialogs and scroll motion.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      // The audience page lives at the singular path; keep the plural
      // navigation URL and old bookmarks working.
      {
        source: "/challenges/owners",
        destination: "/challenges/owner",
        permanent: true,
      },
      // Pages the navigation already links to but that are not built yet
      // (user decision 2026-10-02): send readers to the nearest published
      // page. Temporary, so search engines keep the planned URLs; remove each
      // rule when its page ships.
      {
        source: "/services",
        destination: "/about#domains",
        permanent: false,
      },
      {
        source:
          "/services/:domain(management-operations|revenue-brand|dx-it-procurement)/:theme",
        destination: "/services/:domain",
        permanent: false,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
