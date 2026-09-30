import { describe, expect, it } from "vitest";
import {
  audienceLinks,
  boundaries,
  chapters,
  copyStatus,
  hero,
  processCopy,
  related,
  requiredStrings,
  stepStates,
} from "@/content/adelva-dx-it-procurement";
import { processCopy as shared } from "@/content/adelva-management-operations";
import { audiences, routeStatusOf, serviceDomains } from "@/content/adelva-navigation";

describe("DX IT procurement approved content", () => {
  it("preserves taxonomy ids, service order and static rows", () => {
    expect(chapters.map((ch) => ch.id)).toEqual(
      serviceDomains[2].themes.map((t) => t.id),
    );
    expect(chapters.flatMap((ch) => ch.services.map((s) => s.number))).toEqual([
      "17",
      "19",
      "18",
      "20",
    ]);
    expect(
      chapters.flatMap((ch) => ch.services).every((s) => s.href === undefined),
    ).toBe(true);
  });
  it("records the adopted source on all copy blocks", () => {
    for (const block of [
      hero,
      boundaries,
      processCopy,
      related,
      audienceLinks,
      ...chapters,
    ]) {
      expect(block.status).toBe(copyStatus);
      expect(block.source).toBeTruthy();
    }
  });
  it("reuses approved shared copy and navigation objects", () => {
    expect(processCopy.leadLines).toBe(shared.leadLines);
    expect(processCopy.bodyLines).toBe(shared.bodyLines);
    expect(processCopy.link).toBe(shared.link);
    expect(audienceLinks.items).toBe(audiences);
    expect(related.items).toEqual(serviceDomains.slice(0, 2));
    expect(routeStatusOf("/services/dx-it-procurement")).toBe("available");
    expect(routeStatusOf(related.items[1].href)).toBe("available");
  });
  it("includes all seventeen chapter tags, boundary qualifications and step tags", () => {
    expect(chapters.flatMap((ch) => ch.tags.flat())).toHaveLength(17);
    for (const s of [
      "DIGITAL, IT & PROCUREMENT",
      boundaries.note,
      "02 収益・ブランド成長",
      ...processCopy.steps.flatMap((s) => s.tags),
    ])
      expect(requiredStrings).toContain(s);
  });
  it("selects exactly the last visited box and completes at the cap", () => {
    const centers = [142, 348, 548, 737, 945, 1143];
    expect(stepStates(0, centers, 1262)).toEqual(Array(6).fill("upcoming"));
    expect(stepStates(152, centers, 1262)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(stepStates(755, centers, 1262)).toEqual([
      "passed",
      "passed",
      "passed",
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(stepStates(1200, centers, 1262)).toEqual([
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
      "current",
    ]);
    expect(stepStates(1262, centers, 1262)).toEqual(Array(6).fill("passed"));
  });
});
