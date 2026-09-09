import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import sharp from "sharp";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: every band is a varied photo sequence matching source sizing`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/challenges");
    await expect(page.locator("[data-ns-ready=true]")).toBeVisible();
    const source = JSON.parse(
      readFileSync(
        `references/nosigner/tile-study-2026-09-09/${viewport.width}.json`,
        "utf8",
      ),
    );
    const rows = page.locator(".ns-strip");
    await expect(rows).toHaveCount(8);
    for (let index = 0; index < 8; index++) {
      const row = rows.nth(index);
      const group = row.locator(".ns-strip-group").first();
      const urls = await group
        .locator("img")
        .evaluateAll((imgs) => imgs.map((img) => img.getAttribute("src")));
      expect(
        new Set(urls).size,
        `band ${index} needs distinct photos, not cloned copies of one photo`,
      ).toBeGreaterThanOrEqual(4);
      await row.scrollIntoViewIfNeeded();
      await group
        .locator("img")
        .evaluateAll(async (imgs) =>
          Promise.all(imgs.map((img) => (img as HTMLImageElement).decode())),
        );
      const measurement = await row.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const images = [
          ...el.querySelectorAll<HTMLImageElement>(".ns-strip-group:first-child img"),
        ];
        return {
          height: rect.height,
          images: images.map((img) => {
            const r = img.getBoundingClientRect();
            const css = getComputedStyle(img);
            return {
              width: r.width,
              height: r.height,
              ratio: img.naturalWidth / img.naturalHeight,
              border: parseFloat(css.borderLeftWidth),
              fit: css.objectFit,
            };
          }),
        };
      });
      expect(
        Math.abs(
          measurement.height - source.metrics[index < 5 ? index : index + 4].height,
        ),
      ).toBeLessThan(1);
      for (const img of measurement.images) {
        expect(img.border).toBe(1);
        expect(Math.abs(img.height - measurement.height)).toBeLessThan(1);
        if (index < 5) {
          expect(img.fit).toBe("contain");
          expect(Math.abs(img.width - ((img.height - 2) * img.ratio + 2))).toBeLessThan(
            2,
          );
        } else expect(Math.abs(img.width - img.height)).toBeLessThan(1);
      }
      const copies = await row
        .locator(".ns-strip-group")
        .evaluateAll((groups) =>
          groups.map((g) =>
            [...g.querySelectorAll("img")].map((i) => i.getAttribute("src")),
          ),
        );
      for (const copy of copies) expect(copy).toEqual(urls);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      viewport.width,
    );
  });
}

test("photo sequences cover the viewport through a seamless loop and responsive resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/challenges");
  await expect(page.locator("[data-ns-ready=true]")).toBeVisible();
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  for (const selector of ["#section-how .ns-strip", "#section-why .ns-strip"]) {
    const row = page.locator(selector).first();
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await row.locator("img").evaluateAll(async (imgs) =>
      Promise.all(
        imgs.map((i) => {
          const img = i as HTMLImageElement;
          img.loading = "eager";
          return img.decode();
        }),
      ),
    );
    const track = row.locator(".ns-strip-track");
    await track.evaluate((el) => el.getAnimations()[0].pause());
    const samples = [];
    for (const phase of [0, 0.25, 0.75, 0.9999, 1]) {
      await track.evaluate((el, phase) => {
        const a = el.getAnimations()[0];
        a.currentTime = Number(a.effect!.getTiming().duration) * phase;
      }, phase);
      const covered = await row.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const rects = [...el.querySelectorAll(".ns-strip-group img")]
          .map((i) => i.getBoundingClientRect())
          .filter((i) => i.right > r.left && i.left < r.right)
          .sort((a, b) => a.left - b.left);
        return {
          count: rects.length,
          left: rects[0].left - r.left,
          right: rects.at(-1)!.right - r.right,
          gaps: rects.slice(1).map((r, i) => r.left - rects[i].right),
        };
      });
      expect(covered.count).toBeGreaterThanOrEqual(2);
      expect(covered.left).toBeLessThanOrEqual(1);
      expect(covered.right).toBeGreaterThanOrEqual(-1);
      for (const gap of covered.gaps) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
      if (phase === 0 || phase === 1)
        samples.push(
          await row.locator(".ns-strip-images").screenshot({ animations: "allow" }),
        );
    }
    // A fractional section edge captures one row of the independently moving
    // ambient canvas. Compare the photo interior; border/gap geometry is above.
    const metadata = await sharp(samples[0]).metadata();
    const interior = {
      left: 0,
      top: 1,
      width: metadata.width!,
      height: metadata.height! - 2,
    };
    expect(
      (await sharp(samples[0]).extract(interior).raw().toBuffer()).equals(
        await sharp(samples[1]).extract(interior).raw().toBuffer(),
      ),
      "the photo interior must show identical pixels at the loop boundary",
    ).toBe(true);
  }
  for (const width of [768, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
    for (const selector of [
      "#section-how .ns-strip-track",
      "#section-why .ns-strip-track",
    ]) {
      const track = page.locator(selector).first();
      await expect
        .poll(() =>
          track.evaluate((el) => {
            const group = el.firstElementChild!;
            return (
              group.getBoundingClientRect().width /
              parseFloat(getComputedStyle(el).animationDuration)
            );
          }),
        )
        .toBeCloseTo(40, 1);
    }
  }
});
