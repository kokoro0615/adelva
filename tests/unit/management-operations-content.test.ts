import { describe, expect, it } from "vitest";

import {
  audienceLinks,
  boundaries,
  chapters,
  contact,
  copyStatus,
  hero,
  heroTitle,
  knuckleLabels,
  labelStatus,
  processCopy,
  requiredStrings,
  serviceIndex,
  type Lines,
} from "@/content/adelva-management-operations";
import { moGeometry } from "@/content/adelva-management-operations-geometry";
import { routeStatusOf } from "@/content/adelva-navigation";

describe("management-operations content", () => {
  it("keeps the approved four themes and eleven services in taxonomy order", () => {
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "経営診断・改善",
      "開業・運営体制",
      "現場運営改善",
      "人材・採用",
    ]);
    expect(
      chapters.map((chapter) =>
        chapter.services.map((service) => service.number).join(","),
      ),
    ).toEqual(["01,02", "03,04,05,11", "06,07,08,09", "10"]);
    const numbers = chapters.flatMap((chapter) =>
      chapter.services.map((service) => service.number),
    );
    expect(new Set(numbers).size).toBe(11);
  });

  it("records source and approval status on every copy block", () => {
    for (const block of [hero, boundaries, processCopy, contact, ...chapters]) {
      expect(block.status).toBe(copyStatus);
      expect(block.source).toBeTruthy();
    }
    // The two labels the user approved with the B-hq implementation (2026-10-01).
    for (const block of [serviceIndex, audienceLinks]) {
      expect(block.status).toBe(labelStatus);
      expect(block.source).toBeTruthy();
    }
    expect(serviceIndex.title).toBe("4つの支援テーマ・11のサービス");
    expect(audienceLinks.title).toBe("対象者から探す");
  });

  it("has no service links yet, so services carry no arrow and no href", () => {
    for (const chapter of chapters)
      for (const service of chapter.services) expect(service.href).toBeUndefined();
  });

  it("splits copy only at line breaks, never changing the text", () => {
    const joined = (lines: Lines) => [lines.desktop.join(""), lines.mobile.join("")];
    expect(joined(hero.leadLines)).toEqual([hero.lead, hero.lead]);
    expect(hero.lead).toBe(
      "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。",
    );
    expect(heroTitle).toBe("経営・運営統括");
    expect(joined(processCopy.leadLines)).toEqual([processCopy.lead, processCopy.lead]);
    expect(joined(processCopy.bodyLines)).toEqual([processCopy.body, processCopy.body]);
    expect(joined(boundaries.noteLines)).toEqual([boundaries.note, boundaries.note]);
    expect(joined(contact.titleLines)).toEqual([contact.title, contact.title]);
    for (const item of boundaries.pairs.flat())
      if ("scopeLines" in item)
        expect(joined(item.scopeLines)).toEqual([item.scope, item.scope]);
  });

  it("labels each knuckle with its theme's service numbers", () => {
    expect(knuckleLabels.map((label) => label.numbers)).toEqual([
      "01・02",
      "03・04・05・11",
      "06・07・08・09",
      "10",
    ]);
  });

  it("places every service on a measured trunk and a desktop column", () => {
    const numbers = chapters.flatMap((chapter) =>
      chapter.services.map((service) => service.number),
    );
    expect(moGeometry.paths.map((path) => path.id).sort()).toEqual([...numbers].sort());
    chapters.forEach((chapter, index) => {
      const desktop = moGeometry.desktopIndex.themes[index]!;
      const mobile = moGeometry.mobileIndex.groups[index]!;
      for (const service of chapter.services) {
        expect(desktop.services[service.number]).toBeGreaterThan(0);
        expect(mobile.services[service.number]).toBeGreaterThan(0);
      }
      // Each service's comet runs into its own theme's knuckle.
      for (const path of moGeometry.paths.filter((p) =>
        chapter.services.some((s) => s.number === p.id),
      ))
        expect(path.group).toBe(index + 1);
    });
    expect(moGeometry.knuckles).toHaveLength(4);
  });

  it("includes every approved string in the DOM gate list", () => {
    for (const value of [
      "MANAGEMENT & OPERATIONS",
      "4つの支援テーマ・11のサービス",
      "契約・許認可が関係する範囲は、個別に確認します。",
      "継続して改善できる状態",
      "対象者から探す",
      "総支配人・現場責任者の方へ",
      "課題が整理できていなくても、お問い合わせいただけます。",
    ])
      expect(requiredStrings).toContain(value);
  });

  it("reports the route as implemented to the shared navigation", () => {
    expect(routeStatusOf("/services/management-operations")).toBe("available");
    expect(routeStatusOf("/services")).toBe("pending");
    expect(routeStatusOf("/approach")).toBe("available");
  });
});
