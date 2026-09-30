import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as c from "@/content/adelva-about";
import { routeStatusOf, serviceDomains } from "@/content/adelva-navigation";
import { defaultLeaders, ringMarks } from "@/components/about/marks";

const homeCopy = readFileSync("references/adelva/sources/home-copy.md", "utf8");
const ia = readFileSync(
  "references/adelva/sources/information-architecture.md",
  "utf8",
);

describe("/about A2 content contract", () => {
  it("keeps the four approved /about paragraphs word for word", () => {
    const paragraphs = [
      "ホテル・旅館の経営を、現場から動かしていく。ADELVAは、オーナー・経営者と総支配人・現場責任者の双方に向き合い、経営判断を日々の業務に落とし込み、改善が続く状態をつくる経営実装パートナーです。",
      "収益を伸ばしたい。運営体制を整えたい。サービスの品質と生産性を高めたい。その課題は、人材、販売、業務、システムにまたがっています。何から着手するか、誰が担うか、現場でどう動かすか。私たちは、課題の把握と優先順位の整理から、ともに取り組みます。",
      "「経営・運営統括」「収益・ブランド成長」「DX・IT・調達基盤」。この3つの支援領域から必要な施策を組み合わせ、一つの改善計画につなぎます。お客様とADELVAそれぞれの担当範囲、目標、進め方を明確にし、実行・実装から運用、効果の検証まで支援します。",
      "大切にしているのは、支援が終わった後も、お客様自身で判断し、改善を続けられること。現場で使える仕組みと知識を引き継ぎ、経営と現場の両方に、次の一歩を進める力を残します。",
    ];
    expect(c.hero.lead.text).toBe(paragraphs[0]);
    expect(c.role.wishes.map((w) => w.text.text).join("") + c.role.body.text).toBe(
      paragraphs[1],
    );
    expect(c.domains.body.text).toBe(paragraphs[2]);
    expect(c.stance.statement.text + c.stance.body.text).toBe(paragraphs[3]);
  });

  it("uses approved headings, domains, stages, audiences and calls", () => {
    expect(homeCopy).toContain(`H1: \`${c.hero.title.text}\``);
    expect(homeCopy).toContain(`H2: \`${c.domains.title}\``);
    expect(homeCopy).toContain(`Stages: \`${c.stance.steps.join(" / ")}\``);
    expect(homeCopy).toContain(`Link: \`${c.stance.link.label}\``);
    expect(homeCopy).toContain(`H2: \`${c.call.title.text}\``);
    expect(homeCopy).toContain(`CTA: \`${c.call.cta.label}\``);
    expect(
      c.domains.rows.map((r) => [r.number, r.label, r.description, r.href]),
    ).toEqual(serviceDomains.map((d) => [d.number, d.label, d.description, d.href]));
    for (const a of c.audiences)
      expect(ia).toContain(`| ${a.label} | \`${a.href}\` | ${a.description} |`);
    for (const href of [
      c.stance.link.href,
      c.call.cta.href,
      ...c.domains.rows.map((r) => r.href),
    ])
      expect(routeStatusOf(href)).toBe("available");
  });

  it("states the user-supplied company facts exactly", () => {
    expect(c.company.name.value).toBe("ADELVA 合同会社");
    expect(c.company.founded.value).toBe("2026年07月28日");
    expect(c.company.capital.value).toBe("100万円");
    expect(c.company.representative.value).toBe("中川　心");
    expect(`${c.company.address.postal} ${c.company.address.value}`).toBe(
      "〒666-0145 兵庫県川西市けやき坂2-67-6",
    );
  });

  it("breaks lines only inside the strings, per composition", () => {
    for (const b of [
      c.hero.title,
      c.hero.lead,
      c.role.body,
      c.domains.body,
      c.stance.statement,
      c.stance.body,
      c.call.title,
    ])
      for (const i of [...b.desktop, ...b.mobile])
        expect(i > 0 && i < b.text.length).toBe(true);
    expect(c.hero.title.mobile).toHaveLength(2);
    expect(c.hero.title.desktop).toHaveLength(1);
  });

  it("anchors the chapter index to the four chapters", () => {
    expect(c.zones.map((z) => z.id)).toEqual(["role", "domains", "stance", "company"]);
  });
});

describe("/about pencil marks", () => {
  it("draws every ring as an open pencil stroke inside the page", () => {
    for (const kind of ["desktop", "mobile"] as const) {
      const g = kind === "desktop" ? c.desktopGeometry : c.mobileGeometry;
      const rings = ringMarks(kind);
      expect(Object.keys(rings)).toEqual(Object.keys(g.rings));
      for (const r of Object.values(rings)) {
        expect(r.main).toMatch(/^M[\d. ]+( Q[\d. ]+)+$/);
        expect(r.ghost).not.toBe(r.main);
      }
    }
  });

  it("starts each default leader at the mock's measured text end", () => {
    const d = defaultLeaders("desktop");
    expect(d.gable.d.startsWith("M435.0 1184.6")).toBe(true);
    expect(d.c03.d.startsWith("M728.0 2820.3")).toBe(true);
    const m = defaultLeaders("mobile");
    // Architect's knee leaders on the two upper rings, a free curve on the eaves.
    expect(m.gable.d).toContain(" V");
    expect(m.eaves.d).toContain(" C");
  });

  it("keeps the front window inside its texture", () => {
    for (const g of [c.desktopGeometry, c.mobileGeometry]) {
      expect(g.front.window[0]).toBeGreaterThanOrEqual(0);
      expect(g.front.window[1]).toBeLessThanOrEqual(1);
      expect(g.front.bottom).toBeGreaterThan(g.front.top);
    }
  });
});
