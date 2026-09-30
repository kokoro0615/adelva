import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  chapters,
  contact,
  decision,
  execution,
  geometry,
  hero,
  phaseFromHash,
  phaseHash,
  phases,
  phasesCopy,
  plain,
  roles,
  support,
  tileRows,
  verification,
} from "@/content/adelva-owner";

/** The approved wording of the previous /challenges/owner page (spec §5). */
const approved = [
  "オーナー・経営者の方へ",
  "経営判断を、実行可能な改善計画へ。",
  "ホテル・旅館の経営と現場を、一つの改善計画につなぐ。",
  "問い合わせを送信",
  "いま、どの経営局面にありますか。",
  "最初に、決めること。",
  "支援内容を選ぶ前に、判断の論点を整理します。",
  "判断に応じて、支援を組み合わせる。",
  "必要な範囲に応じて、単独の支援も選択できます。診断と実行、GM機能と全面運営、導入支援と開発を区別します。",
  "誰が決め、誰が実行し、何を残すか。",
  "意思決定・権限・担当範囲・成果物を合意する",
  "権限・担当範囲・条件は、個別の契約で確認します。",
  "総支配人・現場責任者の方へ",
  "経営指標を、現場の行動へ。",
  "確認し、引き継げる状態へ。",
  "支援終了後も、継続して改善できる状態をつくります。",
  "課題が整理できていなくても、お問い合わせいただけます。",
];

describe("owner page copy", () => {
  it("uses the approved wording, line breaks aside", () => {
    const used = [
      hero.eyebrow,
      hero.title.join(""),
      plain(hero.lead),
      hero.action.label,
      plain(phasesCopy.title),
      plain(decision.title),
      plain(decision.body),
      plain(support.title),
      plain(support.note),
      plain(roles.title),
      plain(roles.agreement),
      plain(roles.note),
      roles.cross.label,
      plain(execution.title),
      plain(verification.title),
      plain(verification.body),
      plain(contact.title),
    ];
    expect(used).toEqual(approved);
  });

  it("keeps the phases, points, table, roles, steps and checks of the previous page", () => {
    expect(phases.map((p) => [p.title, plain(p.text)])).toEqual([
      ["経営・収益", "原因と優先順位を整理する"],
      ["開業・再建", "運営体制を整える"],
      ["GM不在", "GM機能と権限を整理する"],
      ["投資判断", "投資対象と実行条件を見極める"],
    ]);
    expect(decision.points).toEqual([
      "原因・優先順位",
      "運営モデル",
      "投資対象",
      "実行責任者",
    ]);
    expect(support.heads).toEqual(["経営局面", "支援の組み合わせ", "整理すること"]);
    expect(support.rows).toEqual([
      ["経営診断 × 収益改善", "原因と優先順位"],
      ["開業支援 × 運営体制", "運営モデル"],
      ["GM機能 × 現場運営", "権限と実行体制"],
      ["経営判断 × DX・IT", "投資対象と実行条件"],
    ]);
    expect(roles.items.map((r) => r.name)).toEqual([
      "オーナー・経営者",
      "GM・現場",
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
    expect(verification.items).toEqual([
      "担当範囲",
      "成果物",
      "意思決定記録",
      "検証・引継ぎ方法",
    ]);
    expect(chapters.map((c) => c.label)).toEqual([
      "経営局面",
      "判断の整理",
      "支援の組み合わせ",
      "責任分界",
      "実行から引継ぎまで",
      "検証・引継ぎ",
    ]);
  });

  it("links to the contact page and the sibling audience page", () => {
    expect(hero.action.href).toBe("/contact");
    expect(contact.action.href).toBe("/contact");
    expect(roles.cross.href).toBe("/challenges/general-managers");
    expect(hero.crumbs.map((c) => c.href)).toEqual(["/", "/challenges"]);
  });
});

describe("owner page mapping and state", () => {
  it("maps each phase to its point of judgement (the mock: GM不在 → 実行責任者)", () => {
    const pointOf = Object.fromEntries(
      phases.map((p) => [p.id, decision.points[p.point]]),
    );
    expect(pointOf).toEqual({
      management: "原因・優先順位",
      opening: "運営モデル",
      gm: "実行責任者",
      investment: "投資対象",
    });
    expect(new Set(phases.map((p) => p.point)).size).toBe(4);
  });

  it("round-trips the phase through the URL hash and ignores anything else", () => {
    for (const p of phases) expect(phaseFromHash(phaseHash(p.id))).toBe(p.id);
    for (const hash of ["", "#", "#owner-01", "#phase-", "#phase-owner", "#gm"])
      expect(phaseFromHash(hash)).toBeNull();
  });
});

describe("owner page geometry and assets", () => {
  for (const [key, g] of [
    ["d", geometry.desktop],
    ["m", geometry.mobile],
  ] as const) {
    it(`${key}: scene tops ascend within the photograph and match its scale`, () => {
      expect(g.tops[0]).toBe(0);
      for (let i = 1; i < g.tops.length; i++)
        expect(g.tops[i]).toBeGreaterThan(g.tops[i - 1]);
      expect(g.tops.at(-1)!).toBeLessThan(g.height);
      expect(
        Math.abs((g.plate.height * g.width) / g.plate.width - g.height),
      ).toBeLessThan(1);
      expect(g.points).toHaveLength(4);
    });

    it(`${key}: plate tiles cover every row once (plus 4-row overlaps) and exist on disk`, () => {
      const { height, tiles, width, small } = g.plate;
      let covered = 0;
      for (let n = 0; n < tiles; n++) {
        const [top, rows] = tileRows(height, tiles, n);
        expect(top).toBeLessThanOrEqual(covered);
        covered = top + rows;
        for (const w of [width, small])
          for (const f of ["avif", "webp"])
            expect(
              existsSync(`public/media/adelva/owner/${key}-plate-${n}-${w}.${f}`),
            ).toBe(true);
      }
      expect(covered).toBe(height);
      for (const f of ["avif", "webp"]) {
        expect(existsSync(`public/media/adelva/owner/${key}-ember.${f}`)).toBe(true);
        for (const w of [g.dawn.width, g.dawn.small])
          expect(existsSync(`public/media/adelva/owner/${key}-dawn-${w}.${f}`)).toBe(
            true,
          );
      }
    });
  }
});
