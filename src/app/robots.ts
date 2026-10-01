import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/content/site";

/**
 * AI crawlers named explicitly (user decision 2026-10-02: allow every AI
 * crawler, search and training alike). The wildcard group already allows
 * them; naming them records the policy and keeps it if `*` ever narrows.
 */
const aiCrawlers = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "MistralAI-User",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: aiCrawlers, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
