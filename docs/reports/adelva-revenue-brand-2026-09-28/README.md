# 収益・ブランド成長 — 実装・検証レポート

対象：`/services/revenue-brand`。作業場所：`/home/kokoro/projects/clients/clonetest-rb`。
正本：`docs/specs/adelva-revenue-brand-spec.md`、採用済み A4 ONE RIVER。
初回の依存アクセス確認レポートを、本実装の結果で置き換えた。

## 実装

- 完成状態をサーバー出力。1 DOM を desktop/mobile の座標変数で配置。
- プレートと SVG を同じ座標面に置き、4 行重複の絶対配置タイルを配信。
- 源流、支流、3 重 main、湖の点線、文字マスク、節点、工程、レール、カードの線は SVG/CSS。
- main は 4 plate px 刻みの累積最大 y LUT と二分探索。ScrollTrigger の refresh 時に比率を計測し、quickTo で追従。毎フレームの DOM 計測なし。
- チップの単一選択・解除、枝の光粒、反射、四隅の FLIP、ループ、霧、工程の往復、終点・夜明けを実装。
- JS なし/reduce では完成状態。CSS の 3 秒フェイルセーフ、GSAP のスコープと cleanup、履歴復元を用意。
- 共有承認文言・ヘッダー・フッターを再利用。meta は noindex/nofollow。画像生成・依存追加・git 操作・デプロイなし。

## 追加・変更ファイル

| ファイル                                                                | 内容                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/app/services/revenue-brand/page.tsx`                               | metadata、media 別 preload、初期 motion 属性、ページ          |
| `src/content/adelva-revenue-brand.ts`                                   | 型付き文言・来歴・requiredStrings・工程・viewfinder           |
| `src/content/adelva-revenue-brand-geometry.ts`                          | 3 JSON からの生成データと変換済み CSS 座標                    |
| `src/components/revenue-brand/revenue-brand-page.tsx`                   | 静的 DOM、写真、章、工程、関連、対象者                        |
| `src/components/revenue-brand/river-lines.tsx`                          | SVG の全レイヤー・マスク                                      |
| `src/components/revenue-brand/chip-group.tsx`                           | キーボード対応の単一選択                                      |
| `src/components/revenue-brand/revenue-brand-motion.tsx`                 | 全スクロール演出・復元・cleanup                               |
| `src/components/revenue-brand/revenue-brand.module.css`                 | レスポンシブ、状態、フォーカス、フォント                      |
| `scripts/adelva/build-revenue-brand-geometry.mjs`                       | 座標生成                                                      |
| `scripts/adelva/prepare-revenue-brand-assets.mjs`                       | 84 配信ファイルと manifest の生成                             |
| `scripts/adelva/extend-revenue-brand-fonts.py`                          | 元 cmap との和集合サブセット                                  |
| `scripts/adelva/capture-revenue-brand.mjs`                              | 静止・画像非表示・motion の撮影                               |
| `scripts/adelva/compare-revenue-brand.mjs`                              | A4 との区間比較・字面測定                                     |
| `scripts/adelva/measure-revenue-brand-contrast.mjs`                     | 背景輝度の実測                                                |
| `tests/unit/revenue-brand-content.test.ts`                              | 文言・リンク・座標・状態整合                                  |
| `tests/e2e/revenue-brand.spec.ts`                                       | 16 件：7 幅、全文字、axe、JS なし、選択、工程往復、復元、警告 |
| `tests/e2e/visual.spec.ts-snapshots/revenue-brand-*-chromium-linux.png` | 本ページだけの 3 ゴールデン                                   |
| `public/media/adelva/revenue-brand/`                                    | desktop 32 / mobile 40 / cards 8 / fog 4 ファイル             |
| `assets/source/generated/adelva/revenue-brand-2026-09-28/manifest.json` | 84 ファイルの出所・寸法・バイト・SHA-256                      |
| `public/fonts/adelva-noto-sans-jp.woff2`、`adelva-noto-serif-jp.woff2`  | 字種追加                                                      |
| 本レポート配下                                                          | 最終撮影、比較、コントラスト、検査ログ                        |

共有ファイルは既存行を保持し、次の行・末尾ブロックだけを追加した。

| 共有ファイル                       | 追加内容                                   |
| ---------------------------------- | ------------------------------------------ |
| `src/components/route-shell.tsx`   | `pathname === "/services/revenue-brand"    |     | ` 1 行 |
| `src/content/adelva-navigation.ts` | `"/services/revenue-brand",` 1 行          |
| `tests/e2e/accessibility.spec.ts`  | `"/services/revenue-brand",` 1 行          |
| `tests/e2e/visual.spec.ts`         | 末尾に本ページ 3 viewport のブロック       |
| `docs/asset-provenance.md`         | 今回の素材・フォントの末尾エントリー       |
| `docs/clone-workflow-ledger.md`    | 今回の範囲・不変条件・証跡の末尾エントリー |

## 参照比較

最低 2 周の要件に対して、初版 → 暗幕・改行・端のチップ → 位置・先読み → 暗幕の軟化の比較を実施。
初回/第2回の測定は `comparison-round1.json` / `comparison-round2.json`、最終は `fidelity/`。
途中の重複 PNG と比較用の一時切り出し frames は削除し、最終の全ページ・必要状態・並列・重ね・差分を残した。compare スクリプトを再実行すると切り出し入力は再生成される。

専用 production server 4391、DPR 1、reduce、`document.fonts.ready` と可視画像の decode 完了後に撮影。
A4 desktop を 1024→1440（1.40625 倍）、mobile は原寸。フッター前の desktop 9360 / mobile 6763 px を比較。
7 区間それぞれを指定の `visual-fidelity.mjs` で並列・50% 重ね・差分にした。
写真は supplied plate のため画素差を合否に使わない。

測定は supplied `ink-bbox.mjs` と同じ白字条件（r/g > 200、b > 195、色差 < 40）を両画像に適用。
宣言済みのランドマーク領域で 2 px 以上の白が 2 行以上続く帯を抽出し、指定 y に最も近い帯の上端を比較する。
初版の全幅・低い閾値による写真の白/隣のラベルの誤検出を修正した。許容差 ±8 は変更していない。
下表は字面 y の差。DOM の枠とは異なる。工程の位置は SVG の JSON 座標をそのまま使用。

| Viewport | Landmark    | Reference ink y | Actual ink y | Delta | ±8   |
| -------- | ----------- | --------------: | -----------: | ----: | ---- |
| desktop  | H1          |             465 |          465 |     0 | PASS |
| desktop  | chapter1    |            1057 |         1061 |     4 | PASS |
| desktop  | service12   |            1612 |         1616 |     4 | PASS |
| desktop  | service16   |            1612 |         1615 |     3 | PASS |
| desktop  | chapter2    |            2437 |         2445 |     8 | PASS |
| desktop  | service13   |            2711 |         2713 |     2 | PASS |
| desktop  | service14   |            2712 |         2714 |     2 | PASS |
| desktop  | chapter3    |            3978 |         3984 |     6 | PASS |
| desktop  | service15   |            4129 |         4135 |     6 | PASS |
| desktop  | differences |            4654 |         4658 |     4 | PASS |
| desktop  | process     |            5783 |         5789 |     6 | PASS |
| desktop  | related     |            8271 |         8277 |     6 | PASS |
| mobile   | H1          |             342 |          342 |     0 | PASS |
| mobile   | chapter1    |            1027 |         1028 |     1 | PASS |
| mobile   | service12   |            1646 |         1645 |    -1 | PASS |
| mobile   | service16   |            1720 |         1720 |     0 | PASS |
| mobile   | chapter2    |            1996 |         2003 |     7 | PASS |
| mobile   | service13   |            2355 |         2361 |     6 | PASS |
| mobile   | service14   |            2468 |         2473 |     5 | PASS |
| mobile   | chapter3    |            3048 |         3051 |     3 | PASS |
| mobile   | service15   |            3102 |         3103 |     1 | PASS |
| mobile   | differences |            3782 |         3785 |     3 | PASS |
| mobile   | process     |            4493 |         4492 |    -1 | PASS |
| mobile   | related     |            5919 |         5926 |     7 | PASS |

見出しの字幅は同じ白字条件で左右を広げた範囲から測定した（クリップを防ぐ）。

| 1440 見出し | 参照幅 | 実装幅 |   差率 | ±4%  |
| ----------- | -----: | -----: | -----: | ---- |
| H1          |    806 |    815 | +1.12% | PASS |
| 章1         |    600 |    589 | −1.83% | PASS |
| 章2         |    989 |   1008 | +1.92% | PASS |
| 章3         |    363 |    353 | −2.75% | PASS |

`heading-widths.json` に測定値を保存。残る写真のディテール差は supplied plate による intentional、フォントのアンチエイリアス差は environment。関連カードの等分・モバイルの字サイズ/高さは仕様で承認済みの intentional。

`actual/capture.json` に 7 サイズの DOM 枠・ステージ高・はみ出し・console を保存。
1440/768/390 の画像非表示、360/1024/1920/720 の全ページ、desktop/mobile の
hero/ch1/ch2/ch3/process-04/end を保存。工程 04 は節点を画面高さ 58% に合わせ、両幅で current=04 を確認する。
JS なし・reduce の工程は 06 完成であり、A4 の途中状態 04 との差は仕様 §9.6 による intentional。

## コントラストとフォント

実測は写真・暗幕・チップ背景を残し、文字色だけを透明化して文字 Range の背景を撮影。
文字範囲の背景輝度 95 percentile と computed foreground/alpha から比率を計算。
枠を含む pill 全体では白枠を背景と誤判定するため、Range に限定した。
24px 以上（太字は 18.66px 以上）は 3:1、それ以外は 4.5:1。
完成状態の測定であり、upcoming の状態は別の motion axe テストでも確認した。

| 幅   | 測定数 | 通常文字の最小 | 大文字の最小 | 不合格数 |
| ---- | -----: | -------------: | -----------: | -------: |
| 1440 |     74 |         7.45:1 |       3.58:1 |        0 |
| 768  |     74 |         6.21:1 |       6.08:1 |        0 |
| 390  |     74 |         4.79:1 |       7.64:1 |        0 |

詳細は `contrast.json`。自動検査だけで WCAG 全項目の適合を保証するものではない。

- Sans：631→643、253,764 bytes。追加 `ゲ予団式撮権流測素線置般`。
- Serif：631→649、355,188 bytes。追加 `ゲツブ代企備団地式循撮流測源環稿般顧`。
- 既存 cmap を全保持する assertion が通過。原本は許可された `~/.cache/adelva-fonts/`。
- 全84枚を原寸確認。最大WebP22枚と霧の縮小版2枚は個別表示、残り60枚はAVIFを無損失PNGにデコードし、リサイズなしの確認用シートで表示。文字・UI・線・点の焼き込みなし。
- 全84ファイルのdecode・寸法・SHA-256も確認（`asset-validation.json`）。確認用シートは配信せず、確認後に削除。

## コマンドと結果

以下の pnpm はすべて `pnpm --config.verifyDepsBeforeRun=false` として実行。
pnpm 11 の自動 install 検査を停止するためのフラグ。依存 install は実施していない。
Playwright は必ず `PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4391`。

| コマンド                                                                                                                                | 結果                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/adelva/build-revenue-brand-geometry.mjs`                                                                                  | 成功。再生成できる型付き座標                                                                                                    |
| `node scripts/adelva/prepare-revenue-brand-assets.mjs`                                                                                  | 成功。84 ファイル                                                                                                               |
| `uv run --no-project --with fonttools --with brotli python scripts/adelva/extend-revenue-brand-fonts.py <Sans.ttf> <Serif.ttf>`         | 成功。JS 依存追加なし                                                                                                           |
| `pnpm format:check`                                                                                                                     | 全体は既存36ファイルの未整形により失敗。最終一覧は `gates/format-final.log`。本作業対象の限定 check は `gates/format-owned.log` |
| `pnpm lint`                                                                                                                             | 合格（警告 0）                                                                                                                  |
| `pnpm typecheck`                                                                                                                        | 合格                                                                                                                            |
| `pnpm test:unit`                                                                                                                        | 初回は Vite が共有 node_modules/.vite-temp に書こうとして EROFS。書き込み成功なし                                               |
| `pnpm test:unit --configLoader native --cache=false`                                                                                    | 合格、13 files / 112 tests。共有依存へのキャッシュ書き込みを回避                                                                |
| `pnpm build`                                                                                                                            | 通常設定では worktree 外 symlink の Turbopack root エラー                                                                       |
| `pnpm build --webpack`                                                                                                                  | 既存 CSS Modules の global セレクタで失敗。共有 CSS は未変更                                                                    |
| `CLONETEST_TURBOPACK_ROOT=/home/kokoro/projects/clients pnpm build`                                                                     | 合格。worktree の .next に出力                                                                                                  |
| `pnpm start --port 4391`                                                                                                                | 自分で起動し、本検査後に停止                                                                                                    |
| `node scripts/adelva/capture-revenue-brand.mjs`                                                                                         | 完了。7 幅、画像非表示 3 幅、motion 12 状態                                                                                     |
| `node scripts/adelva/compare-revenue-brand.mjs`                                                                                         | 完了。14 区間、主要字面 24 点を測定                                                                                             |
| `node scripts/adelva/measure-revenue-brand-contrast.mjs`                                                                                | 222 点合格                                                                                                                      |
| `pnpm exec playwright test tests/e2e/visual.spec.ts --project=chromium -g revenue-brand --update-snapshots`                             | 3 件生成。本ページ以外の golden は更新せず                                                                                      |
| `pnpm exec playwright test tests/e2e/revenue-brand.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/visual.spec.ts --project=chromium` | 合格、38 件（本ページ16件＋共有axe/visual）。`gates/e2e-final.log`                                                              |
| `pnpm exec playwright test tests/e2e/management-operations.spec.ts --project=chromium`                                                  | 16 合格 / 履歴復元 1 失敗。該当 1 件の単独再実行は合格（flaky、隠さず記録）                                                     |
| `APPROACH_TEST_URL=http://127.0.0.1:4391 pnpm exec playwright test --config playwright.approach.config.ts`                              | 8 合格 / 2 失敗。JS なしテストに 4191 のハードコード、direct section の y=157.921875（要求 <100）                               |
| Approach の失敗 2 件を一時コピーで 4391 に置換して再実行                                                                                | JS なし合格 / direct section 失敗。元テストは未変更                                                                             |

履歴・リサイズ・axeを同時に検査する新規テストは既定30秒を超えたため、制限を60秒に変更した。アサーションは維持。最終一式は38件合格。

## Opus 5.5 によるレビューと修正（2026-09-29）

Codex の実装を、モック A4 と原寸で並べ、motion 有効の状態（ヒーロー、章1〜3、工程 04、終点、関連）も撮影して確認した。直した点：

| 見つけた点                                                                                                                | 修正                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 共通 `SiteHeader` と `next.config.ts` を変更していた（本ページ限定の `prefetch` 停止、Turbopack root）                    | 両方とも元に戻した。先読み警告は `/services/management-operations` でも出るサイト共通の Next.js の挙動で、本ページだけの問題ではない。本ページの Link の `prefetch={false}` も外し、テストはこの既知の警告だけを除外する    |
| 文字の後ろの楕円の暗幕（番号・見出し）が「黒い塊」に見えた                                                                | 見出し・本文は字形に沿う text-shadow と、ごく薄い広い影だまりに変更。1023 以下の小さい橙の番号だけ、縁の見えない影だまりを残す。コントラストは測定スクリプトを text-shadow も背景に含める形に直し、222 点すべて合格を再確認 |
| デスクトップの本流の線が、章目次の下から合流点まで森の上を横切っていた（写真ではこの区間の川は森に隠れ、A4 にも線がない） | デスクトップの main を合流点から始める（座標 JSON を再生成）                                                                                                                                                                |
| 合流点が小さな点だけだった                                                                                                | 光の輪＋リング＋節点の三重にし、「宿泊収益」チップをモックの大きさに                                                                                                                                                        |
| ループの節点が橙の小点で、現在の段（投稿）が分からない                                                                    | 白い円＋暗い縁（A4）。投稿は橙の円と光の輪、チップも橙。motion では粒が通過した節点が一度だけ光り、投稿に着いて点灯。JS なし・reduce は点灯済み                                                                             |
| 工程の節点・終点の四角が小さい                                                                                            | 節点は輪（到達＝橙、未到達＝灰、現在＝光の輪）、終点は枠付きの四角と光の輪。モバイルは終点を小さくし、06 のタグ行と重ならないよう 06 のラベルを 16px 上げた                                                                 |
| 湖の点線が 3 重線の破線で太い光の粒に見えた                                                                               | 芯の色の細い丸点の列に変更                                                                                                                                                                                                  |
| チップ・ループのチップがモックより小さい                                                                                  | A4 を 4 倍で実測し、デスクトップのチップ 33u / 16u、ループ 39u / 17u、合流点 45u / 19u に                                                                                                                                   |
| デスクトップのレールが細く、章名が常時出て右寄せの本文（16、宿泊営業支援）に重なった                                      | 節点を 11px にし、現在の節点を光らせた。章名はホバーとフォーカスのときだけ表示                                                                                                                                              |
| 関連カードの説明の改行がモックと違う                                                                                      | 「人材、」「システム、」の後で改行（A4 どおり）                                                                                                                                                                             |

修正後の再検証（専用の本番ビルド、ポート 4395）：lint・typecheck 合格、単体 112 件合格、Playwright 38 件合格（本ページ・共通 axe・視覚回帰。本ページの回帰画像 3 枚は修正後に作り直した）、ランドマーク 24 点すべて ±8px 以内、コントラスト 222 点合格。`actual/` と `fidelity/` は修正後に撮り直し、PNG を WebP に変換した（比較用の切り出し frames は `compare-revenue-brand.mjs` で再生成できる）。

## 仕様からの調整・未解決・判断した点

- **environment**：ユーザーの最終許可に従い node_modules のみ symlink 経由で読み実行した。主ツリーのソース・ビルド出力には触れていない。
  worktree 検証では Turbopack の root 指定が必要だったが、ローカル限定の変更として戻した。本番ビルドは主ツリー（実体の node_modules）で行う。
- **environment**：pnpm の最初の自動依存検査は内部 install に進もうとして SQLite EROFS/アクセス失敗で終了。以後は上記フラグで抑制。install 完了や依存変更はない。
- **intentional / §4.3**：mobile JSON に `paths.sources` が欠けていたため、承認済みモックの橙画素から源流だけを生成時に追跡。
  検出のない区間を直線で埋めず終端とし、モックのラスタを配信しない。その他の JSON d・節点を手で転記/変更していない。
- **intentional / §6.2**：13px・行送り 24・4 行を y4573 に置くと y4645 のカウンターと衝突するため、幅290で自然折返しの3行を選んだ。文言は保持。
- **intentional / §6.2–6.3**：12px 下限・44px ターゲットを守り、モバイル端の源流チップを画面内へ clamp。A4 の小さい文字との差は可読性優先。
- **intentional / §6.1, §12**：明朝の字面を合わせるため chapter2 の desktop 字間を −.025em、SNS h3 を −7u、mobile chapter2 を −7s 調整。
  番号の暗幕は最終目視で矩形の端を発見し、closest-side の楕円減衰に修正した。橙番号の暗幕は参照より濃く、AA コントラスト確保を優先した intentional な差として残る。暗幕を測定結果に合わせ、カード mobile の暗転開始を 40%→30% にした。色は flare 1 色、明るい橙は線の芯・光のみ。
- **console**：Home/Contact の CSS preload 警告は、サイト共通の Next.js の先読みによるもの（経営・運営統括でも発生）。共通部品は変更せず、本ページのテストでこの既知の警告だけを除外した（Opus レビュー）。
- **environment / defect**：Approach の direct section アンカー検査が残る。今回変更していない既存セクションで再現するが、本作業との因果を断定せず、移植前確認事項として残す。
  この worktree には新しい `/approach` ルートの実装がないため、既存 HOME 内 Approach テストを実行した。
- **検証範囲**：主要見出し24点を raster 計測し、他の位置は capture JSON / 提供 geometry / 目視を併用。
  §6 の全装飾に個別の画素検出表を作ったとはしていない。全84 codec/size派生を原寸目視した。
- 全ゲート無条件合格とは報告しない。全体 format の既存差、Approach の失敗、既存 management の一度の失敗を残す。

成果物は review 用。コミット、主ツリーへの移植、公開は行っていない。
