import { expect, test } from "@playwright/test";

import { indexablePages } from "../../src/content/site-pages";
import { CONTACT_SENT_COOKIE } from "../../src/lib/contact-delivery";

const origin = "https://www.adelva.jp";

/** Everything the White Desert reconstruction used to serve (removed 2026-10-02). */
const removedRoutes = [
  "/antarctica",
  "/antarctica/polar-plateau",
  "/camps",
  "/camps/echo-base",
  "/itineraries",
  "/itineraries/discovery-week",
  "/prices",
  "/enquire",
  "/about/founders",
  "/legal/privacy-policy",
];

for (const entry of indexablePages) {
  test(`${entry.path} serves indexable Japanese metadata and structured data`, async ({
    request,
  }) => {
    const response = await request.get(entry.path);
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toMatch(/<html[^>]* lang="ja"/);
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
    expect(html).not.toMatch(/White Desert|white-desert|noindex/i);
    expect(html).toContain(
      `<link rel="canonical" href="${origin}${entry.path === "/" ? "" : entry.path}"/>`,
    );
    expect(html).toContain(`<meta name="description" content="${entry.description}"/>`);
    expect(html).toContain(
      `<meta property="og:image" content="${origin}${entry.ogImage}"/>`,
    );
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>');
    expect(html).toContain('<meta property="og:locale" content="ja_JP"/>');

    const blocks = [
      ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ].map((match) => JSON.parse(match[1]) as { "@graph": { "@type": string }[] });
    const types = blocks.flatMap((block) =>
      block["@graph"].map((node) => node["@type"]),
    );
    expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
    expect(types).toContain(entry.schemaType);
    if (entry.breadcrumb) expect(types).toContain("BreadcrumbList");
    if (entry.path.startsWith("/services/")) expect(types).toContain("Service");
  });
}

test("the post-submission page stays out of the index", async ({ page, context }) => {
  const local = test.info().project.use.baseURL ?? "http://127.0.0.1:4173";
  await context.addCookies([{ name: CONTACT_SENT_COOKIE, value: "sent", url: local }]);
  await page.goto("/contact/thanks");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(
    `${origin}/contact/thanks`,
  );
});

test("robots.txt allows all crawlers, names AI crawlers and points at the sitemap", async ({
  request,
}) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("User-Agent: *\nAllow: /");
  for (const agent of [
    "OAI-SearchBot",
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
  ])
    expect(body).toContain(`User-Agent: ${agent}`);
  expect(body).not.toMatch(/Disallow: \/\s/);
  expect(body).toContain(`Sitemap: ${origin}/sitemap.xml`);
});

test("sitemap.xml lists exactly the indexable pages", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(locations.sort()).toEqual(
    indexablePages.map((entry) => new URL(entry.path, origin).toString()).sort(),
  );
});

test("llms.txt restates the company and every indexable page", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.headers()["content-type"]).toContain("text/plain");
  const body = await response.text();
  expect(body).toContain("# ADELVA（アデルバ）");
  expect(body).toContain("法人番号: 1140003023925");
  for (const entry of indexablePages)
    expect(body).toContain(new URL(entry.path, origin).toString());
});

test("icons, manifest and previews are served", async ({ request }) => {
  for (const [path, type] of [
    ["/favicon.ico", "image/x-icon"],
    ["/icon.png", "image/png"],
    ["/apple-icon.png", "image/png"],
    ["/icons/icon-192.png", "image/png"],
    ["/manifest.webmanifest", "application/manifest+json"],
    ...indexablePages.map((entry) => [entry.ogImage, "image/jpeg"]),
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(type);
  }
});

test("redirects keep old and planned URLs useful", async ({ request }) => {
  const owners = await request.get("/challenges/owners", { maxRedirects: 0 });
  expect(owners.status()).toBe(308);
  expect(owners.headers().location).toBe("/challenges/owner");

  const services = await request.get("/services", { maxRedirects: 0 });
  expect(services.status()).toBe(307);
  expect(services.headers().location).toBe("/about#domains");

  const theme = await request.get("/services/revenue-brand/social-media-operations", {
    maxRedirects: 0,
  });
  expect(theme.status()).toBe(307);
  expect(theme.headers().location).toBe("/services/revenue-brand");
});

for (const path of removedRoutes) {
  test(`${path} no longer exists`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain("ページが見つかりません");
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    expect(html).not.toMatch(/White Desert|white-desert/i);
  });
}
