import { describe, expect, it } from "vitest";

import {
  boundaries,
  chapterIndex,
  chapters,
  copyStatus,
  hero,
  processCopy,
  requiredStrings,
  rooms,
} from "@/content/adelva-management-operations";
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

  it("records source and adoption status on every copy block", () => {
    for (const block of [
      hero,
      boundaries,
      processCopy,
      chapterIndex,
      rooms,
      ...chapters,
    ]) {
      expect(block.status).toBe(copyStatus);
      expect(block.source).toBeTruthy();
    }
  });

  it("has no service links yet, so rows carry no arrow and no href", () => {
    for (const chapter of chapters)
      for (const service of chapter.services) expect(service.href).toBeUndefined();
  });

  it("splits the process copy only at line breaks, never changing the text", () => {
    for (const lines of [processCopy.leadLines, processCopy.bodyLines]) {
      expect(lines.desktop.join("")).toBe(lines.mobile.join(""));
    }
    expect(processCopy.leadLines.desktop.join("")).toBe(processCopy.lead);
    expect(processCopy.bodyLines.desktop.join("")).toBe(processCopy.body);
    expect(hero.lead.join("")).toBe(
      "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。",
    );
  });

  it("lists the mobile index numbers from the chapters", () => {
    expect(chapterIndex.items.map((item) => item.numbers)).toEqual([
      "01・02",
      "03・04・05・11",
      "06・07・08・09",
      "10",
    ]);
  });

  it("maps every carousel room to service rows that exist", () => {
    const numbers = new Set(
      chapters.flatMap((chapter) => chapter.services.map((service) => service.number)),
    );
    for (const room of rooms.items)
      for (const number of room.services) expect(numbers).toContain(number);
  });

  it("includes every approved string in the DOM gate list", () => {
    for (const value of [
      "MANAGEMENT & OPERATIONS",
      "契約・許認可が関係する範囲は、個別に確認します。",
      "継続して改善できる状態",
      "総支配人・現場責任者の方へ",
    ])
      expect(requiredStrings).toContain(value);
  });

  it("reports the new route as implemented to the shared navigation", () => {
    expect(routeStatusOf("/services/management-operations")).toBe("available");
    expect(routeStatusOf("/services")).toBe("pending");
    expect(routeStatusOf("/approach")).toBe("pending");
  });
});
