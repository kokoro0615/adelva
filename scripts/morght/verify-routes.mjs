import { readFile, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const origin = "https://morght.com";
const sources = [],
  failures = [];
for (const width of [1440, 768, 390]) {
  const data = JSON.parse(await readFile(`references/morght/${width}.json`, "utf8"));
  const verified = JSON.parse(
    await readFile(`references/morght/final/${width}.json`, "utf8"),
  );
  sources.push({
    state: "menu-open",
    viewport: { width, height: verified.height },
    url: verified.sourceUrl,
    observedAt: verified.observedAt,
    status: verified.status,
    selector: ".c-site-menu a",
    hrefs: [
      ...new Set(
        verified.shell.links
          .map((e) => e.href)
          .filter((href) => href.startsWith(origin + "/")),
      ),
    ],
    complete: verified.shell.links.length > 0,
  });
  for (const [state, html] of [
    ["header-default", data.header],
    ["footer", data.footer],
  ]) {
    if (!html) {
      failures.push(`${width}:${state}:missing`);
      continue;
    }
    const dom = new JSDOM(html, { url: origin });
    const hrefs = [...dom.window.document.querySelectorAll("a[href]")]
      .map((e) => e.href)
      .filter((href) => href.startsWith(origin + "/"));
    sources.push({
      state,
      viewport: { width, height: data.height },
      url: data.url,
      observedAt: data.observedAt,
      status: verified.status,
      selector:
        state === "menu-open"
          ? '[x-data="siteMenu"]'
          : state === "footer"
            ? "footer"
            : "header",
      hrefs: [...new Set(hrefs)],
      complete: hrefs.length > 0,
    });
    dom.window.close();
  }
}
const robots = await fetch(origin + "/robots.txt");
const robotsText = await robots.text();
const home = await fetch(origin + "/");
const html = await home.text();
const dom = new JSDOM(html, { url: origin });
const sitemapUrls = [
  ...new Set([
    ...[...robotsText.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]),
    ...[...dom.window.document.querySelectorAll('link[rel="sitemap"]')].map(
      (e) => e.href,
    ),
  ]),
];
dom.window.close();
// No unapproved adjacent-route crawl. A newly advertised sitemap requires review.
if (sitemapUrls.length) failures.push({ unreviewedSitemaps: sitemapUrls });
sources.push({
  state: "declared-sitemaps",
  url: origin + "/robots.txt",
  observedAt: new Date().toISOString(),
  status: robots.status,
  homeStatus: home.status,
  sitemapUrls,
  hrefs: [],
  complete: sitemapUrls.length === 0,
  evidence:
    "No sitemap declared by robots.txt or HOME link[rel=sitemap]; no inferred recursive crawl.",
});
const declared = [{ source: "/", destination: "/about", template: "morght-home" }];
const discovered = [
  ...new Set(sources.flatMap((s) => s.hrefs).map((h) => new URL(h).pathname)),
].sort();
const exclusions = discovered
  .filter((p) => !declared.some((d) => d.source === p))
  .map((path) => ({
    path,
    reason:
      "Outside the explicitly requested single HOME-to-/about reproduction; links retain their original absolute destination.",
    evidence:
      "Current user request names https://morght.com/ and local /about only; one-page scope in docs/clone-workflow-ledger.md.",
    approver:
      "Requesting user (explicit one-page scope; no approval for adjacent-page reproduction)",
  }));
if (sources.some((s) => !s.complete)) failures.push("incomplete source");
if (new Set(declared.map((d) => d.source)).size !== declared.length)
  failures.push("duplicate declaration");
const missing = discovered.filter(
  (p) => !declared.some((d) => d.source === p) && !exclusions.some((e) => e.path === p),
);
if (missing.length) failures.push({ missing });
await writeFile(
  "references/morght/route-discovery.json",
  JSON.stringify(
    { schemaVersion: 1, declared, sources, discovered, exclusions, missing, failures },
    null,
    2,
  ),
);
console.log(JSON.stringify({ missing, failures, discovered, declared }, null, 2));
if (failures.length) process.exitCode = 1;
