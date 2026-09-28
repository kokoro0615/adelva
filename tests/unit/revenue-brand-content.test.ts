import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as c from "@/content/adelva-revenue-brand";
import {
  desktopGeometry,
  mobileGeometry,
  cardGeometry,
} from "@/content/adelva-revenue-brand-geometry";
import { routeStatusOf, serviceDomains, audiences } from "@/content/adelva-navigation";
describe("revenue-brand approved contract", () => {
  it("reuses approved navigation and process destinations", () => {
    expect(c.hero.title).toBe(serviceDomains[1].label);
    expect(c.hero.lead).toBe(serviceDomains[1].description);
    expect(c.audienceLinks.items).toEqual(audiences);
    expect(routeStatusOf(c.route)).toBe("available");
    expect(c.processCopy.link.href).toBe("/approach");
    expect(c.related.items.map((i) => i.href)).toEqual([
      "/services/management-operations",
      "/services/dx-it-procurement",
    ]);
  });
  it("records copy provenance and all adopted labels", () => {
    for (const block of [
      c.hero,
      c.sources,
      c.acquisition,
      c.photos,
      c.detail,
      c.loop,
      c.differences,
      c.processCopy,
      c.related,
      ...c.services,
      ...c.chapters,
    ]) {
      expect(block.source).toBeTruthy();
      expect(["approved", "adopted-mock-2026-09-28"]).toContain(block.status);
    }
    expect(c.requiredStrings).toContain(
      "Webサイト公開後の保守、撮影の権利、SNSで対応する範囲は、個別に確認します。",
    );
    expect(c.processCopy.steps.map((s) => s.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
  });
  it("retains source geometry exactly and converts HTML chip positions once", () => {
    for (const [name, g] of [
      ["desktop", desktopGeometry],
      ["mobile", mobileGeometry],
    ] as const) {
      const source = JSON.parse(
        readFileSync(
          `assets/source/generated/adelva/revenue-brand-2026-09-28/plates/geometry-${name}.json`,
          "utf8",
        ),
      );
      expect(g.paths.main.d).toBe(source.paths.main.d);
      expect(g.dots.process).toEqual(source.dots.process);
      expect(g.lineMasks).toEqual(source.lineMasks);
      for (const item of c.acquisition.items) {
        const id = item.id as keyof typeof g.chips.ch1;
        expect(g.css.chips.ch1[id][0]).toBeCloseTo(
          (g.chips.ch1[id][0] * g.plate.cssWidthAt) / g.plate.width,
          3,
        );
      }
      expect(Object.keys(g.paths.sources)).toHaveLength(5);
    }
    expect(cardGeometry.C1.d).toMatch(/^M/);
  });
  it("connects every selectable chip to geometry and a valid viewfinder rectangle", () => {
    for (const id of c.photos.items.map((i) => i.id)) {
      for (const targets of Object.values(c.viewfinderTargets)) {
        const t = targets[id as c.PhotoId];
        expect(t[2]).toBeGreaterThan(t[0]);
        expect(t[3]).toBeGreaterThan(t[1]);
      }
    }
    expect(c.acquisition.items.some((i) => i.id === c.acquisition.initial)).toBe(true);
  });
});
