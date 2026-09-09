import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import data from "../../src/content/nosigner/home.json";

describe("NOSIGNER authorized local asset boundary", () => {
  it("resolves every image and responsive candidate to an approved local file", () => {
    const manifest = JSON.parse(
      readFileSync("references/nosigner/asset-manifest.json", "utf8"),
    ) as { path: string; status: string; source: string }[];
    const assets = new Map(
      manifest.map((a) => ["/" + a.path.replace(/^public\//, ""), a]),
    );
    const images = [
      ...data.hero.map((h) => h.image),
      ...data.cards.flatMap((c) => c.images),
      ...data.news.map((n) => n.image),
    ];
    for (const image of images) {
      const paths = [
        image.src,
        ...(image.srcSet || "")
          .split(",")
          .map((s) => s.trim().split(/\s+/)[0])
          .filter(Boolean),
      ];
      for (const path of paths) {
        expect(path.startsWith("/media/nosigner/")).toBe(true);
        expect(assets.get(path)?.status).toBe("approved");
        expect(existsSync("public" + path)).toBe(true);
      }
    }
  });
  it("keeps source links on the intended public site or local fragment", () => {
    for (const href of [
      ...data.hero.map((h) => h.href),
      ...data.cards.map((c) => c.href),
      ...data.news.map((n) => n.href),
    ]) {
      const url = new URL(href, "https://nosigner.com");
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("nosigner.com");
    }
  });
});
