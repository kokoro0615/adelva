# Owners mock → Figma

## 最新モバイル修正

ユーザー指摘により、下記の旧「等比縮小」方式は撤回。67:3は390px用Auto Layoutで390×6974へ再構成済み。本文14px、章見出し28px、Hero32px、CTA52px、左右24px。比較基準は47:30。最新成果物は `../long-page-mock-mobile-390.png`、390×844プレビューは86:16。原因・修正・検証は [mobile-390-spec.md](mobile-390-spec.md)、数値はmobile-390-audit.json。以下の原寸再構成の記述は旧版の履歴として扱う。

途中・重複スクリーンショット11点を削除。原PNG・再利用写真・Desktop最終画像・新Mobile最終画像と数値結果を保持。削除記録はmobile-390-artifacts.json。

Target file: `ChpQzLAbKeC3HORU2TILlz`。専用ページ `66:52`。既存の所有者ページ・GMページは保持。

## Source / discovery

入力はユーザー指定 `long-page-mock.png` 724×2172 と `long-page-mock-mobile.png` 725×2170。原寸確認し、720pxごとの部分表示で文字と配置を再確認。元画像は変更しない。

Code Connectファイルなし。既存ページ6:2・21:2を調査し、ADELVA Action・Situation、GM Action・Challenge row、8色変数と既存書体を確認。利用できるAction22:2/22:5を再利用する。新たな外部ライブラリ探索は不要。ローカル変数ink/deep/ice/paper/flare/lineを再利用。Noto Serif JP、Noto Sans JP、Oswaldの利用可能なスタイルを確認。元画像の生成字形はフォントファイルを持たないため、編集可能テキストでの完全な画素同一は保証しない。

原寸参照ノード Desktop66:53 / Mobile66:54。編集版wrapper Desktop67:2 / Mobile67:3。画素完全一致の参照と編集可能な再現版の区別を明示する。

## Measured structure / specification

デスクトップ原寸の境界y: 0,435,696,982,1322,1521,1734,1874,2172。モバイル原寸の境界y: 0,339,554,841,1243,1525,1784,1971,2170。

各章を縦auto-layoutで保持。文字・行・ボタンはネイティブ要素。写真は画像fill、図の罫線はネイティブshape。画像の画素比率に忠実な座標で構成し、確認後にdesktop1440、mobile390へ等比変換する。今回は画像が指定する余白・文字の強弱・配置を優先し、実サイト向けの再設計はしない。

写真に重なった文字をネイティブ化するため、原画像の背景plateをimage_genで生成。元画像と同一画素の保証はなく、生成plateを使う編集版の差分要因として扱う。正確な入力はbackground-prompt.txt。見た目完全一致の原寸参照は元ファイルを直接使用。

## 最終状態 / 2026-09-09

専用ページ `03 — OWNERS / モック忠実再現` に原寸画像2点と編集可能な再構成2点を保存。

- 原寸Desktop: https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=66-53
- 原寸Mobile: https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=66-54
- 編集Desktop1440×4320: https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=67-2
- 編集Mobile390×1167.31: https://www.figma.com/design/ChpQzLAbKeC3HORU2TILlz/ADELVA?node-id=67-3

Desktopは8章・104テキスト・3インスタンス。Mobileは8章・86テキスト・19インスタンス。モバイル繰返し行はローカルコンポーネント73:8を使用。写真は補完画像fill、見出し/本文/CTA/罫線/6工程は編集可能。静止画再現であり、アニメーションやフォーム動作は未実装。

## 検証

原寸2点をFigmaからPNG出力し、sharpのraw RGBで元画像と比較。寸法一致。最大チャンネル差は両方1/255、平均差はDesktop0.00386575/255・Mobile0.00114943/255。完全なバイト/画素ゼロ差ではなく、書き出しの色丸め差が残る。結果は `reference-verification.json`、比較入力は `desktop-reference-export.png` / `mobile-reference-export.png`。

編集版は最終寸法で再書き出しし、目視確認。大英字の折返し、モバイル工程と最終行の切れを修正。最終証跡は `desktop-editable-final.png` / `mobile-editable-final.png`。背景補完・代替フォントに差があるため、編集版をピクセル完全一致とは扱わない。モバイルは元画像の比率を保持しているため、実サイト向け可読性・タップ領域の設計は別途必要。

入力画像の所有者は依頼者指定資料、役割はFigma視覚参照。補完画像はimage_genで本作業用に生成。第三者サイト素材の転載なし。実サイトへの出荷・ライセンス確認・loading/alt実装は今回の静止画Figma成果物の範囲外。既存ページ、アプリコード、承認PNGは未変更。Web実装ではないためlint/build/ブラウザリリースゲートは実行対象外。
