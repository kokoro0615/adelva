# OWNERS Figma mock v2 — 追加写真カット

制作日: 2026-09-09。対象: `/challenges/owners`。成果物はFigmaモック改稿用の独立した写真PNG3点。Figmaへの配置、実装、公開は対象外。

## 内容と方向

[既存README](../../README.md)、[REVISION-v2](../../REVISION-v2.md)、[Figma記録](../../figma/README.md)、`docs/asset-provenance.md`、`docs/generated-asset-prompts.md` を先に確認。全景から近景へ移る既存作法を保持し、クライマックスの休符・締め・責任分界に固有カットを追加する。写真内では今回の指示を優先し、UIのアクセント色オレンジは使わない。

## 入力・生成

- 経路: subscription-backed built-in `image_gen`。3点それぞれ独立した新規生成を1回実行。
- prompt作成: 本スレッドの担当アシスタント。実際にツールへ送った全文を各項の exact prompt に記載。
- 参照入力: なし。既存4カットや第三者の写真・ロゴを添付・転載していない。
- 希望品質: final presentation quality を文章で指定。画像モデル名と品質パラメータは非公開であり、指定・保証していない。
- 所有・利用根拠: ユーザー依頼による本プロジェクト用の生成成果物。サービス利用条件に従う。独占的著作権・実在施設・顧客物件の証拠とは扱わない。
- 用途・選択状態: モック用候補として3点を保存。本番採用・外部アップロードは未実施。
- 保存: 返却PNGのバイトコピー。リサイズ、色補正、切り抜き、拡大加工なし。希望キャンバスと返却実寸を区別する。
- loading: ローカルのモック素材。本番のloading実装は対象外。
- alt意図: 下記用途・目視記録に沿った架空の情景説明。本番で装飾扱いにする場合は独立した本文と空altを検討する。

## 生成・確認記録

### 1. OWNERS クライマックス／全画面写真の休符

- 保存: [owners-climax-blue-hour-terrace.png](./owners-climax-blue-hour-terrace.png)
- image_gen原本: `/home/kokoro/.codex/generated_images/01a0863d-a1ec-7712-8b1f-da6d9534e490/exec-cb46382e-8822-4d8c-8f97-846725409d30.png`
- 実寸: **1672×941px**、PNG RGB（sRGB、3チャンネル）、1,864,356 bytes。
- 希望キャンバス: 2560×1440、16:9。返却は上記実寸で、希望解像度には未達。比率はほぼ指定どおり。
- SHA-256: `5a7d483954bdf00ac1086e64508a012c88f09b56dd203c881189ca6ac1a08dbf`。原本と保存先のバイト一致を確認。
- 目視: 左下に小さな建築と石のテラス、中央から右に雲海と重なる山稜、濃紺の空を確認。プール・水面反射・右手の主建築はなく、既存heroの夕景とは構図・時間帯が異なる。
- 制約遵守: 人物、ロゴ、文字、UI、注釈、看板、数値、推薦文は見当たらない。低彩度の濃紺・炭色・生成りと控えめな暖色光で、鮮明なオレンジ、過度なHDR、人工的なグラデーション、魚眼表現は見当たらない。
- 色確認: RGB `#ff7e15` と完全一致する画素は0。これは色域全般の自動判定ではなく、目視確認を補足する検査。

#### exact prompt

```text
Create a wide 16:9 cinematic architectural photograph of a wholly imagined mountain hotel terrace in Japan in late evening blue hour, after the sunset color has disappeared. Seen diagonally from a slightly elevated dry stone path, a small low charcoal timber pavilion and empty stone terrace occupy only the far lower-left quarter; the center and right open onto an immense sea of clouds and multiple receding mountain ridges. At least two thirds of the image is quiet negative space in blue-grey atmosphere and finely textured cloud cover. Deep indigo sky, distant ridgelines dissolve gradually into mist, just one discreet warm-ivory window at frame-left. Structurally plausible slender eaves and stone retaining edge, natural 40mm architectural lens perspective with straight verticals. The main subject is the depth and silence of the landscape. No pool, no reflective water, no building on the right, no sunset glow, no furniture or dramatic foreground clutter. Requested canvas 2560x1440, landscape 16:9.

Wholly fictional Japanese mountain hospitality architecture, no recognizable real property and no claim of any actual client location. No people, silhouettes, faces, logos, lettering, text, UI, annotations, signs, watermarks, numbers or testimonials. Restrained palette: ink navy #1f2a44, near-black #0e1118, paper off-white #f1efea, neutral stone and desaturated wood; any artificial light is faint warm ivory, never orange. Exclude orange #ff7e15 and saturated orange hues entirely. Cinematic architectural photography with natural optical depth, realistic texture, controlled highlights and soft shadow detail; no excessive HDR, artificial gradient overlays, fisheye, oversaturation or CGI gloss. Final presentation-quality standalone photograph, edge-to-edge, no border or collage.
```

### 2. OWNERS 締め／コンタクト帯

- 保存: [owners-contact-dawn-interior.png](./owners-contact-dawn-interior.png)
- image_gen原本: `/home/kokoro/.codex/generated_images/01a0863d-a1ec-7712-8b1f-da6d9534e490/exec-a64b93d1-df21-4443-800a-f0c508a25df8.png`
- 実寸: **1672×941px**、PNG RGB（sRGB、3チャンネル）、1,825,203 bytes。
- 希望キャンバス: 2560×1440、16:9。返却は上記実寸で、希望解像度には未達。比率はほぼ指定どおり。
- SHA-256: `3ef83e8de1b5199c925cf8e612a54b2566e9e2475c4e134da239fbb719c0057b`。原本と保存先のバイト一致を確認。
- 目視: 暗い室内の窓枠・床越しに淡い夜明けと雲海を確認。左下の灯りは小さく、空と雲に広い余白がある。外観夕景heroやブルーアワーのクライマックスと区別できる。
- 制約遵守: 人物、ロゴ、文字、UI、注釈、看板、数値、推薦文は見当たらない。低彩度の濃紺・炭色・生成りと控えめな暖色光で、鮮明なオレンジ、過度なHDR、人工的なグラデーション、魚眼表現は見当たらない。
- 色確認: RGB `#ff7e15` と完全一致する画素は0。これは色域全般の自動判定ではなく、目視確認を補足する検査。

#### exact prompt

```text
Create a wide 16:9 cinematic architectural photograph from inside a silent, almost empty imagined Japanese mountain hotel room, looking straight through a broad recessed picture window at the first pale light of dawn over a sea of clouds. A deep charcoal interior wall occupies the left quarter, a narrow dark ceiling edge and matte floor frame the view; the window has a clean structurally believable minimal frame. Beyond it are soft paper-white mist, cool grey-blue mountain layers and a very pale overcast dawn sky, without a visible sun. The horizon is low; vast calm sky and cloud cover form overwhelming negative space across the central and right area. Only a tiny concealed warm-ivory light at the far-left floor junction, barely perceptible. No bed, table, chairs, decorative objects or exterior hotel building; no pool, water reflection, sunset, orange horizon or symmetrical resort vista. Eye-level 50mm lens feel, restrained exposure, tactile dark timber reveals. The interior threshold and pale morning make this distinct from an exterior evening hero. Requested canvas 2560x1440, landscape 16:9.

Wholly fictional Japanese mountain hospitality architecture, no recognizable real property and no claim of any actual client location. No people, silhouettes, faces, logos, lettering, text, UI, annotations, signs, watermarks, numbers or testimonials. Restrained palette: ink navy #1f2a44, near-black #0e1118, paper off-white #f1efea, neutral stone and desaturated wood; any artificial light is faint warm ivory, never orange. Exclude orange #ff7e15 and saturated orange hues entirely. Cinematic architectural photography with natural optical depth, realistic texture, controlled highlights and soft shadow detail; no excessive HDR, artificial gradient overlays, fisheye, oversaturation or CGI gloss. Final presentation-quality standalone photograph, edge-to-edge, no border or collage.
```

### 3. 責任分界セクション／静物ディテール

- 保存: [owners-responsibility-stone-wood-linen.png](./owners-responsibility-stone-wood-linen.png)
- image_gen原本: `/home/kokoro/.codex/generated_images/01a0863d-a1ec-7712-8b1f-da6d9534e490/exec-bcd66fbc-870b-498c-aa6b-126c27725bfe.png`
- 実寸: **1122×1402px**、PNG RGB（sRGB、3チャンネル）、2,751,137 bytes。
- 希望キャンバス: 1440×1800、4:5。返却は上記実寸で、希望解像度には未達。比率はほぼ指定どおり。
- SHA-256: `ca6225a9c728d2c23d1b053757565c26a5fec211dbef70c9d07dd03834b9e250`。原本と保存先のバイト一致を確認。
- 目視: 石の縁、木目、リネンの繊維と折り目を確認。やや縦長で、石面に余白があり、責任分界に添える素材の近景として採用。
- 制約遵守: 人物、ロゴ、文字、UI、注釈、看板、数値、推薦文は見当たらない。低彩度の濃紺・炭色・生成りと控えめな暖色光で、鮮明なオレンジ、過度なHDR、人工的なグラデーション、魚眼表現は見当たらない。
- 色確認: RGB `#ff7e15` と完全一致する画素は0。これは色域全般の自動判定ではなく、目視確認を補足する検査。

#### exact prompt

```text
Create a slightly portrait 4:5 editorial architectural still-life close-up of three materials meeting quietly in a wholly imagined Japanese mountain hotel: a honed dark grey stone slab with a softly irregular natural edge, a desaturated smoked oak surface with fine open grain, and a single unbleached paper-ivory linen cloth falling in two broad relaxed folds across their junction. Tight carefully composed oblique crop, no room panorama; a restrained asymmetrical meeting of stone, wood and linen with generous unoccupied matte stone surface in the upper half. Soft cool side daylight reveals linen fibers, stone pores and wood grain; gentle shadows approach ink navy and near-black. Tactile, understated, photographic, calm editorial material study using an 85mm close-focus lens, enough depth of field to read all three surfaces with subtle falloff at the far edge. No props, crockery, flowers, candles, hands, hardware, swatches, diagrams or decorative pattern. No orange wood stain or golden color cast. Requested canvas 1440x1800, portrait 4:5.

Wholly fictional Japanese mountain hospitality architecture, no recognizable real property and no claim of any actual client location. No people, silhouettes, faces, logos, lettering, text, UI, annotations, signs, watermarks, numbers or testimonials. Restrained palette: ink navy #1f2a44, near-black #0e1118, paper off-white #f1efea, neutral stone and desaturated wood; any artificial light is faint warm ivory, never orange. Exclude orange #ff7e15 and saturated orange hues entirely. Cinematic architectural photography with natural optical depth, realistic texture, controlled highlights and soft shadow detail; no excessive HDR, artificial gradient overlays, fisheye, oversaturation or CGI gloss. Final presentation-quality standalone photograph, edge-to-edge, no border or collage.
```

## 保存・検証の範囲

生成プレビュー3点を目視確認し、Sharpで保存PNGをデコードして実寸・形式・RGB画素を取得。原本と保存先の全バイト一致およびSHA-256を確認した。架空建築は生成指示・出自によるもので、実在施設との偶然の類似を網羅照合したという意味ではない。

今回新設した本ディレクトリ内のPNG3点と本READMEのみを保存。既存ファイルは変更せず、デプロイ、Figma編集、外部への成果物送信は実施していない。明示指定されたbuilt-in画像生成サービスのみを使用。中間スクリーンショットや重複コピーは作成していない。ラスタ素材のみの作業のためWeb実装・ブラウザ・buildの検証は対象外。

