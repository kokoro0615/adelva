import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  chapters,
  challengesCopy,
  contact,
  decision,
  execution,
  geometry,
  hero,
  issues,
  roles,
  support,
  verification,
} from "@/content/adelva-general-managers";
import { routeStatusOf } from "@/content/adelva-navigation";
import { plain } from "@/components/general-managers/lines";

describe("general-managers content", () => {
  it("keeps the approved wording of the previous page", () => {
    expect(hero.title).toEqual(["現場の課題を、", "続けられる改善へ。"]);
    expect(plain(hero.lead)).toBe(
      "ADELVAは、ホテル・旅館の経営実装パートナー。現場運営・人材・販売・ITを、一つの改善計画につなぎます。",
    );
    expect(issues.map((i) => [i.title, i.description])).toEqual([
      ["品質", "サービスや清掃の品質にばらつきがある"],
      ["人材", "採用と入社後の教育がつながっていない"],
      ["生産性", "人員配置や部門間の連携を見直したい"],
      ["販売", "Web・OTA・営業が宿泊収益につながらない"],
      ["システム定着", "導入したシステムを現場で使い切れていない"],
    ]);
    expect(decision.points.map((p) => plain(p.title))).toEqual([
      "現象と原因",
      "優先順位と影響範囲",
      "現場判断と、オーナー・本部判断",
    ]);
    expect(support.rows.map((r) => r.judge)).toEqual([
      "一部門の品質・生産性を整える",
      "販売・業務・ITをつなぎ直す",
      "経営判断が必要な課題を進める",
    ]);
    expect(roles.items.map((r) => r.name)).toEqual([
      "オーナー・本部",
      "GM・部門責任者",
      "ADELVA",
      "外部関係者",
    ]);
    expect(execution.steps).toEqual([
      "課題把握",
      "判断",
      "実行・実装",
      "運用",
      "検証",
      "引継ぎ",
    ]);
    expect(verification.items.map((v) => v.title)).toEqual([
      "担当範囲",
      "成果物",
      "意思決定記録",
      "検証・引継ぎ方法",
    ]);
    expect(plain(contact.title)).toBe(
      "課題が整理できていなくても、お問い合わせいただけます。",
    );
    expect(contact.flow).toEqual([
      "問い合わせを送信",
      "内容の確認",
      "担当者からのご連絡",
      "課題把握",
    ]);
    expect(plain(challengesCopy.title)).toBe("いま、現場のどこでつまずいていますか。");
  });

  it("maps every issue to the support row the previous page linked it to", () => {
    // audience-page.tsx linked the five issues to #support-[1,1,1,2,2]
    expect(issues.map((i) => i.support + 1)).toEqual([1, 1, 1, 2, 2]);
  });

  it("names seven chapters in page order", () => {
    expect(chapters.map((c) => `${c.number} ${c.label}`)).toEqual([
      "01 現場課題",
      "02 判断",
      "03 支援と成果物",
      "04 役割",
      "05 実行から引継ぎまで",
      "06 確認する内容",
      "07 お問い合わせ",
    ]);
  });

  it("links only to live routes", () => {
    for (const href of [
      ...hero.crumbs.map((c) => c.href),
      hero.action.href,
      roles.cross.href,
      execution.approach.href,
      contact.action.href,
    ])
      expect(routeStatusOf(href), href).toBe("available");
  });

  it("keeps photo anchors inside each stage and in page order", () => {
    for (const g of [geometry.desktop, geometry.mobile]) {
      expect([...g.tops]).toEqual([...g.tops].sort((a, b) => a - b));
      expect(g.tops.at(-1)).toBeLessThan(g.height);
      for (const [x, y] of [...g.gates, g.cause, g.symptom]) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(g.width);
        expect(y).toBeLessThan(g.height);
      }
      const ys = g.gates.map(([, y]) => y);
      expect(ys).toEqual([...ys].sort((a, b) => a - b));
    }
    expect(geometry.mobile.rows).toEqual(
      [...geometry.mobile.rows].sort((a, b) => a - b),
    );
  });

  it("has every delivery file the page requests", () => {
    const root = "public/media/adelva/general-managers/";
    for (const [key, g] of [
      ["d", geometry.desktop],
      ["m", geometry.mobile],
    ] as const) {
      for (let n = 0; n < g.plate.tiles; n++)
        for (const w of [g.plate.width, g.plate.small])
          for (const f of ["avif", "webp"])
            expect(
              existsSync(`${root}${key}-plate-${n}-${w}.${f}`),
              `${key} ${n} ${w} ${f}`,
            ).toBe(true);
      for (const issue of issues)
        for (const f of ["avif", "webp"])
          expect(existsSync(`${root}${key}-lit-${issue.id}.${f}`)).toBe(true);
    }
  });
});
