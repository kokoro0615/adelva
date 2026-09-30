import { describe, expect, it } from "vitest";

import { adelvaApproach } from "@/content/adelva-approach";
import {
  audienceLinks,
  breadcrumb,
  copyStatus,
  desktopGeometry,
  hero,
  integrated,
  magnificationLines,
  meta,
  mobileGeometry,
  plates,
  rail,
  requiredStrings,
  responsibilities,
  stages,
  verification,
  type DescentGeometry,
  type Lines,
} from "@/content/adelva-approach-page";
import { audiences, routeStatusOf, serviceDomains } from "@/content/adelva-navigation";

const joined = (lines: Lines) => ({
  desktop: lines.desktop.join(""),
  mobile: lines.mobile.join(""),
});

describe("approach content", () => {
  it("takes the title, lead, body and six stage names from the approved source", () => {
    expect(hero.title).toBe(adelvaApproach.titleJa);
    expect(hero.roman).toBe(adelvaApproach.title);
    expect(joined(hero.lead).desktop).toBe(adelvaApproach.lead);
    expect(joined(hero.body).desktop).toBe(adelvaApproach.body);
    expect(stages.items.map((stage) => stage.name)).toEqual([...adelvaApproach.steps]);
    expect(stages.items.map((stage) => stage.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
  });

  it("breaks lines per layout without changing the wording", () => {
    const blocks: Lines[] = [
      hero.lead,
      hero.body,
      responsibilities.title,
      responsibilities.note,
      integrated.title,
      verification.title,
      ...stages.items.map((stage) => stage.description),
      ...integrated.domains.map((domain) => domain.lines),
    ];
    for (const block of blocks) {
      const { desktop, mobile } = joined(block);
      expect(mobile).toBe(desktop);
    }
    for (const domain of integrated.domains)
      expect(joined(domain.lines).desktop).toBe(domain.description);
  });

  it("links the three service domains and both audiences from the navigation data", () => {
    expect(integrated.domains.map((domain) => [domain.label, domain.href])).toEqual(
      serviceDomains.map((domain) => [domain.label, domain.href]),
    );
    expect(audienceLinks.items).toEqual(
      audiences.map(({ label, href }) => ({ label, href })),
    );
    expect(routeStatusOf("/approach")).toBe("available");
    expect(integrated.id).toBe("integrated-support");
  });

  it("records source and adoption status on every copy block", () => {
    for (const block of [
      meta,
      breadcrumb,
      hero,
      rail,
      stages,
      responsibilities,
      integrated,
      verification,
      audienceLinks,
    ]) {
      expect(block.status).toBe(copyStatus);
      expect(block.source).toBeTruthy();
    }
  });

  it("keeps role ranges on the axis and orders them", () => {
    for (const role of responsibilities.roles)
      for (const [from, to] of role.ranges) {
        expect(from).toBeGreaterThanOrEqual(0);
        expect(to).toBeLessThanOrEqual(1);
        expect(to).toBeGreaterThan(from);
      }
    expect(responsibilities.roles.find((role) => role.id === "adelva")?.ranges).toEqual(
      [[0, 1]],
    );
  });

  it("has no duplicated required string that could hide a missing one", () => {
    expect(requiredStrings.every((value) => value.length > 0)).toBe(true);
  });
});

describe.each([
  ["desktop", desktopGeometry],
  ["mobile", mobileGeometry],
] as [string, DescentGeometry][])("%s descent geometry", (_name, geometry) => {
  it("stacks six photographs below the hero, each inside the canvas", () => {
    expect(geometry.photos).toHaveLength(6);
    let bottom = geometry.heroHeight;
    for (const [x, y, w, h] of geometry.photos) {
      expect(y).toBeGreaterThan(bottom);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(geometry.width);
      bottom = y + h;
    }
    expect(bottom).toBeLessThan(geometry.descentBottom);
  });

  it("puts every finder inside the picture that holds it", () => {
    expect(geometry.finders).toHaveLength(7);
    const holders = [
      [0, 0, geometry.width, geometry.heroHeight] as const,
      ...geometry.photos,
    ];
    geometry.finders.forEach(([x, y, w, h], index) => {
      const [hx, hy, hw, hh] = holders[index]!;
      expect(x).toBeGreaterThan(hx);
      expect(y).toBeGreaterThan(hy);
      expect(x + w).toBeLessThan(hx + hw);
      expect(y + h).toBeLessThan(hy + hh);
    });
  });

  it("lands each magnification line exactly on the enlarged photograph's corners", () => {
    const lines = magnificationLines(geometry);
    expect(lines).toHaveLength(6);
    lines.forEach((line, index) => {
      const [px, py, pw] = geometry.photos[index]!;
      const [fx, fy, fw, fh] = geometry.finders[index]!;
      expect(line.left).toEqual([
        [fx, fy + fh],
        [px, py],
      ]);
      expect(line.right).toEqual([
        [fx + fw, fy + fh],
        [px + pw, py],
      ]);
    });
  });
});

describe("plates", () => {
  it("declares intrinsic sizes for every delivered plate", () => {
    const all = [
      plates.desktop.hero,
      ...plates.desktop.stages,
      plates.desktop.integrated,
      plates.desktop.ridge,
      plates.mobile.hero,
      ...plates.mobile.stages,
      plates.mobile.integrated,
    ];
    for (const plate of all) {
      expect(plate.src).toMatch(/^\/media\/adelva\/approach\/[a-z0-9-]+\.webp$/);
      expect(plate.width).toBeGreaterThan(0);
      expect(plate.height).toBeGreaterThan(0);
    }
  });
});
