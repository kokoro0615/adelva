# 総支配人・現場責任者向け 縦長モック

Figma再構築: [編集版](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=21-3)。[制作・検証記録](figma/README.md)。専用ページにネイティブ文字・コンポーネント・写真を配置。厳密な全ピクセル一致は未達で、差分を記録。

追加候補: ユーザー指定のv1を基に再制作した `long-page-mock-v1-refined.png`（795×1978）。[再制作記録](REVISION-v1-refined.md)。v1原本とv2は保持。

最新版: `long-page-mock.png` は改訂v2（724×2172）。重複していたv2名のファイルは整理し、このパスに統一。旧版は `long-page-mock-v1.png`。改訂の研究・変更・モーション案・プロンプトは [REVISION-v2.md](REVISION-v2.md) を参照。以下は初版の記録。

2026-09-08。画像のみのデザイン提案。対象 /challenges/general-managers。実装・公開なし。

## 出力

- long-page-mock.png: PNG、実測793×1981。希望1600×6000に対してツールはこの寸法を返した。拡大加工なし。
- 状態: 未承認のモック候補。日本語の細部はラスタ生成のため本番原稿として使用しない。
- HOMEの濃紺、生成り、オレンジ、巨大な英字、写真による場面展開を継承。日本語見出しは生成結果では明朝寄り。
- 8段階の情報構成、5課題群、支援と成果物、4者の役割、6段階の進行、問い合わせを目視確認。微細なナビ・本文は解像度上の限界あり。架空の実績数値・推薦文なし。
- ホテル写真は生成された架空の空間。実在施設・顧客・所有施設の証拠ではない。ヒーロー内のADELVA看板もコンセプト表現。

## 根拠と参照役割

事業・構成: references/adelva/sources/information-architecture.md §8.3、PRODUCT.md、home-copy.md。
入力1: artifacts/adelva-navigation-typography/1440-default.png — 現行HOMEのナビ、英字、色、グリッド。
入力2: artifacts/home-lower-2026-09-08/1440-intro-actual.png — 写真スケールと余白。
入力3: artifacts/home-lower-2026-09-08/1440-cards-actual.png — 没入感と写真の構成。
入力4: public/brand/adelva-logo.png — 提供済みブランド。
HOME内の第三者写真は研究参照のみ。出力は本番用アセットとして採用していない。

## UX・モーション設計案

- 課題を5行で一覧でき、各行から対応支援へ進む。先に現状、次に判断材料、最後に支援の詳細を示す。
- ヒーロー: 背景のみ小さな奥行き移動。本文は静止・常時読める状態。次章の霧レイヤーは写真境界のみに限定。今回の静止画像では霧の移行は強く表現されていない。
- 各章: 16px以内の移動とopacityで450ms程度の登場を想定。必須情報を待たせない。実装時に実画面で調整。
- 支援一覧: hover/focusで罫線と矢印の色を160ms程度で変更。横方向の強制スクロールなし。
- プロセス: 進行線が章のスクロールに合わせて現れる案。6段階の文字は常時表示。
- reduced-motion: 背景移動・登場移動・線描画を無効化し、全情報を静止表示。
- 静止PNGであり、動作は実装・検証していない。

研究: [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)、[NN/g Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)、[W3C C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)。情報の段階化、サイズとコントラストの階層、動きを抑える代替状態の設計に利用。

## 生成

Built-in subscription imagegen。露出していないmodel/quality設定は主張しない。
原本: /home/kokoro/.codex/generated_images/01a08156-0a1c-7eb0-a83b-2207a9002b07/exec-43cce9d9-1c62-45da-b0f8-3e78221022ff.png

### Exact prompt

Create one final-quality exceptionally art-directed long vertical DESKTOP webpage UI mockup for ADELVA, Japanese hospitality management implementation partner, page “総支配人・現場責任者の方へ”. This is a single continuous full-page website screenshot, flat front view, no device, no surrounding board, no multiple alternatives. Aim for a tall 1600 × 6000 canvas or equivalent roughly 1:3.75 portrait aspect with crisp Japanese typography and refined photographic detail.

REFERENCES: First attached image is the actual current ADELVA HOME, use its transparent navigation, monumental tightly condensed uppercase typography, cinematic full-bleed dark blue imagery, subtle hairline vertical grid, discreet outlined buttons and concentrated orange accent. Second and third references show HOME lower-page scale, immersive landscapes and oversize framed photographic panels: inherit spatial drama, layered mist and editorial pacing, NOT Antarctic subject matter, expedition copy or their logos. Fourth is the supplied ADELVA symbol for identity. Use ADELVA branding only.

ART DIRECTION: Ink navy #1f2a44, near-black #0e1118, warm paper #f1efea, pale stone #e5e2db, restrained signal orange #ff7e15. Original imagined Japanese mountain hotel photography, dark timber, stone, polished floors, subtle amber practical lighting against misty blue mountains. This is conceptual hospitality imagery, not client evidence. No visible people, no fictional clients, testimonials, awards, prices, metrics, charts with fabricated values or pseudo documents. Alternate immersive photographic scenes, large warm-paper editorial fields and one deep navy operational section. Visual sophistication comes from scale, asymmetry, deliberate silence, precise grid and strong Japanese typography, not decoration. Condensed Oswald-like massive Latin type with refined Noto Sans JP-like Japanese. Use large truly legible Japanese headings, concise copy, beautiful comfortable spacing. Avoid tiny filler paragraphs. No generic SaaS rounded card grid, gradients, glass UI, purple, gold luxury clichés or gratuitous icons. Thin square corner rules, subtle numbering and arrows.

COMPOSITION, top to bottom, eight linked chapters with varying heights. Preserve all specified key Japanese headings accurately.

1 HERO about 20% of full height: sweeping wide cinematic view from inside a dark timber hotel lobby through huge windows toward misty blue mountain ridges at dawn, amber lamp glow, stone reception counter to right, deep readable negative space. Across top a small ADELVA symbol and spaced ADELVA wordmark at left, fine white nav “課題から探す” “支援内容” “支援の進め方” “導入事例” “ADELVAについて”, right outlined “問い合わせを送信 →”. Small breadcrumb “HOME / 課題から探す”. Japanese audience label prominently and exactly “総支配人・現場責任者の方へ”. Bold legible main Japanese headline at upper-middle left “現場課題を、” next line “継続運用できる仕組みへ。” Thin outline contact button “問い合わせを送信 →”. Below, enormous condensed white decorative two-line English “GENERAL” / “MANAGERS” filling much of width, reminiscent of HOME monumental ADELVA display; balance so Japanese remains primary communication. Small SCROLL and line at bottom. Mist softly overlaps lower photographic edge into paper, a considered layered-scroll keyframe, no blurry text. A small orange chapter marker on right edge.

2 CURRENT CHALLENGES on warm paper about 13%: eyebrow “01 / 現場課題”; huge navy title “いま、どの運営状態で” / “詰まっていますか。” Left strong heading and generous whitespace, right five elegant wide indexed selectable rows separated by hairlines. Exact labels “品質” “人材” “生産性” “販売” “システム定着”, numbers 01–05 and restrained diagonal arrows. Concise corresponding descriptors only: “宿泊・料飲・清掃” / “採用・教育” / “業務・部門間の連携” / “Web・OTA・営業” / “導入後の運用”. One row emphasized with a small orange marker. Rows read as useful navigation, not metrics.

3 DIAGNOSIS about 10%: warm paper asymmetric editorial two-column. Small “02 / 判断”; main headline “最初に、見極めること。” Beautiful cropped vertical photo of hotel corridor with dawn light at left, text at right arranged as three spacious hairline pairs “現象と原因” / “優先順位と影響範囲” / “現場判断と、Owner・本部判断”. Each pair only short supporting labels: “基準値を確認する” “部門間のつながりを整理する” “決められる範囲を明確にする”. Generous margin, no fabricated supporting sentences.

4 SUPPORT CONNECTION about 18% on deep navy with huge low-contrast decorative “OPERATIONS” as a background typographic architectural element that does not obscure text. Eyebrow “03 / 支援と成果物”; white title “判断を、支援と成果物へ。” Compose three substantial horizontal editorial rows, left numbered decision, middle support connection, right orange-tinted small outcome labels, fine lines. Row 01 “一部門の改善” → “現場運営改善・人材支援” → “SOP / 教育”. Row 02 “部門横断の運用再設計” → “経営・運営統括 / DX・IT” → “KPI / 会議 / 運用設計”. Row 03 “Owner・本部の意思決定へ” → “経営診断・改善 / 運営体制” → “責任分界 / 改善計画”. Footer short note “支援範囲・成果物は、課題と条件に応じて整理します。” Include a wide atmospheric strip of an empty hotel dining room and landscape, seamlessly integrated at bottom to bring humanity through place, not a stock office visual. No fake dashboard.

5 RESPONSIBILITY about 10% warm paper: eyebrow “04 / 役割”; heading “誰が決め、誰が動かし、” / “何を残すか。” Four balanced typographic columns or a clean matrix with “Owner・本部” “GM・部門責任者” “ADELVA” “外部関係者”, each underlined by thin rule. Underneath a shared aligned line of agreement topics “判断権限 / 実行範囲 / 連携 / 引継ぎ”. Small honest note “具体的な責任範囲は、個別に合意します。” Discreet peer link “オーナー・経営者の方へ ↗”. Do not invent contractual assignments.

6 CONTINUITY about 13%: cinematic immersive full-width empty mountain-hotel interior at blue hour, readable dark overlay. Enormous white “IMPLEMENT.” with Japanese title “部門をつなぎ、” / “検証・引継ぎまで。” below. A precise horizontal fine-line journey “課題把握 → 判断 → 実行・実装 → 運用 → 検証 → 引継ぎ”, six spacious milestones with an orange point marking execution. A small outlined “支援の進め方を見る →”. Motion-ready composition: a single connecting path designed to reveal as one scrolls; screenshot shows complete readable state. No annotation callouts inside UI.

7 VERIFICATION about 6% paper: short quiet bridge with eyebrow “05 / 検証・引継ぎ”; heading “確認し、現場に残す。” Four separated plain labels “担当範囲” “成果物” “意思決定記録” “検証・引継ぎ方法”. Show only these verification categories, NOT invented proof, client stories, actual document thumbnails, numbers or publication-pending notices. It describes the source-supported practice, not past results.

8 CONTACT & FOOTER about 10%: monumental spacious near-black closing field, small ADELVA, large Japanese “課題が整理できていなくても、” / “お問い合わせいただけます。” Highest-emphasis orange rectangular action “問い合わせを送信 →” with dark navy readable label. Thin rule. Footer columns repeat legitimate nav “課題から探す” “支援内容” “支援の進め方” “導入事例” “ADELVAについて”; small “プライバシーポリシー” “サイトポリシー” “© ADELVA”. Oversized dark tonal ADELVA wordmark partially anchors footer but remains fully intentional.

All sections form one coherent premium website with real visual rhythm. The mock must feel like a direct family member of the attached current HOME with its magnitude and cinematic confidence, carefully adapted to hotel operations leadership. Render Japanese glyphs accurately; use only provided content, omit filler. All imagery original imagined hotel scenes. Final polished visual, not a wireframe or moodboard.
