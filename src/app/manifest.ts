import type { MetadataRoute } from "next";

import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}（${site.nameKana}）`,
    short_name: site.name,
    description: site.description,
    lang: site.language,
    start_url: "/",
    display: "browser",
    background_color: site.themeColor,
    theme_color: site.themeColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
