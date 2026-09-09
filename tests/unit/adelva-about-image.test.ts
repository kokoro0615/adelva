import { readFileSync } from "node:fs";
import sharp from "sharp";
import { expect, it } from "vitest";

it("delivers the approved coastal image without lossy pixel changes", async () => {
  const asset = JSON.parse(
    readFileSync("references/adelva/about-2026-09-09/production-asset.json", "utf8"),
  ) as { path: string; sourcePath: string; width: number; height: number };
  const [source, delivered, metadata] = await Promise.all([
    sharp(asset.sourcePath).raw().toBuffer(),
    sharp(`public${asset.path}`).raw().toBuffer(),
    sharp(`public${asset.path}`).metadata(),
  ]);
  expect(delivered.equals(source)).toBe(true);
  expect([metadata.width, metadata.height]).toEqual([asset.width, asset.height]);
  const component = readFileSync("src/components/morght/morght-page.tsx", "utf8");
  expect(component).toContain(`src="${asset.path}"`);
});
