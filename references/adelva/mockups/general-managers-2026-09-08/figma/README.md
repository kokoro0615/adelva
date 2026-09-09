# Figma制作・検証記録 — 2026-09-09

モバイル版追加：[全体390px](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=47-30) / [390×844プレビュー](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=55-42) / [メニュー](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=51-40)。精査済み本文を継承し、縦構図のHero写真をimagegenで追加生成。仕様と検証は[mobile-spec.md](mobile-spec.md)、最終画像は[long-page-mobile-mock.png](../long-page-mobile-mock.png)（780×13,406px）。

スクリーンショット整理済み：ユーザー指示により2026-09-09に中間・旧版・重複33枚を削除。本文中の初版確認画像への言及は作業当時の検証記録であり、画像は現在保持していない。最終画像・元参照・再利用アセットを保持。削除一覧はscreenshot-cleanup.json。

最新状態：ユーザー依頼により、事業定義・20サービス・情報設計に基づき仮文章を改訂済み。[文章改訂記録](copy-revision.md) / [最新全体PNG](copy-revised-full.png)。編集版は1440×4555.472px、ネイティブテキスト126個。以下の寸法・画素比較は文章改訂前の初版記録であり、最新コピーの検証は `copy-revision-audit.json` を参照。

[編集版](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=21-3) / [元モック比較](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=21-4) / [生成アセット](https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=35-30)

専用ページ `21:2` のみで制作。既存のPage 1およびOWNERSページに書き込みなし。既存パレット変数は参照し、変更していない。制作途中の他ページの画面内容はユーザーの指示に従い未調査。

## 納品内容

- 編集フレーム1440×3582.792px、書き出し1440×3583px。9つの描画セクション（8章＋独立したダイニング写真）。元の795×1978を同比率で再構築。
- 編集可能なテキスト108個。Noto Serif JP、Noto Sans JP、Oswald。文字が画像化されたモックではなく、写真部分だけがラスタ。
- 共通ボタン3状態と課題行コンポーネント。画面内9インスタンス。既存ADELVA色変数を使用。
- ナビ・課題行・上部CTAに10件のページ内スクロール設定。設定の保存と読み戻しを確認。プロトタイププレイヤーによるクリック試験は未実施。
- `/contact`など別ページへの遷移先は今回のモック範囲外。フォーム送信や外部サイトの状態変更は行っていない。
- 同寸法のロック済み原画像比較フレームを右隣に配置。これ自体はラスタ参照であり、編集版の完全一致の証拠にはしていない。

## 写真と来歴

全生成の参照は指定された `long-page-mock-v1-refined.png`。元モックおよび新規写真はいずれも架空のホテル空間であり、顧客実績や実在施設を示さない。プロンプト全文は `asset-prompts.json`。

|画像|実測寸法|編集版での採用|
|---|---|---|
|hero.png|1642×958|採用。文字のないロビー写真を再生成|
|corridor.png|1486×1059|代替候補。忠実度を優先し画面では元モックの文字のない写真領域を使用|
|dining.png|2188×719|代替候補。画面では元モックの文字のないパノラマ領域を使用|
|bedroom.png|2236×703|採用。文字のない客室写真を再生成|

4点ともローカル保存し、Figmaのアセット候補行に配置。生成写真の新規作成はbuilt-in subscription imagegen。希望した比率と返却比率が一致しなかったダイニングは、画面へ強制採用せず元画像との一致を優先した。ロゴは既存 `public/brand/adelva-logo.png` の透明画像をFigma内でマスクにして白く表示。

## 検証結果と限界

- 全体・各章をFigmaから書き出して目視確認。OPERATIONSの折り返し、判断行の矢印欠け、CTAの整列を修正。
- セクション上端の位置誤差は元画像座標で最大0.00015px未満。大きさと配置の基準は原寸で計測。
- 想定外フォント0、欠落フォントなし。通常テキストの親フレーム外へのはみ出しなし。検出された2件は意図した英字装飾レイヤーのテキストボックス上端。
- `verification.json`に元画像と編集版のRGB差分診断を記録。これは品質スコアや合格基準ではない。
- **厳密なピクセル完全一致には達していない。** 再生成したロビー・客室の構図の細部、山並み、文字の字形・字間、背景の色調には差がある。原画像のフォント情報も不明なため、編集可能なネイティブ文字へ近い書体で再構築した。
- 原寸比較フレームの再書き出しは元画像と非常に近いが、補間の微小差がある。これを編集版の一致として扱わない。
- source-cropを使う回廊・ダイニングの画素数は元画像由来。高解像度候補に差し替えると細部の解像感は上がるが、写真の一致度は下がる。
- PNGに表現されていないスクロールアニメーションは未制作。ウェブ実装・公開・ビルドは今回の対象外。

## 保存ファイル

最終書き出しは `copy-revised-full.png`（desktop）、`../long-page-mobile-mock.png`（mobile）、`mobile-menu.png`（menu）。元参照と生成写真を保持し、初版・各章・重複スクリーンショットは整理済み。`spec.md`、`state.json`、`verification.json`、`helpers.js`、`copy-revision.md`、`copy-revision-audit.json`、`copy-edit-helpers.js`、`mobile-audit.json` を検証記録として保持。
