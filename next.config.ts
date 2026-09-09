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
      {
        source: "/antarctica",
        destination: "/antarctica/wolfs-fang-runway-mountains",
        permanent: false,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
