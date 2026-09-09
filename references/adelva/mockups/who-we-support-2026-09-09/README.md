# Who We Support｜支援対象 — セクションモック

制作日: 2026-09-09。成果物はデスクトップ用セクションUI画像1枚。

- [画像](./who-we-support-desktop.png): PNG、実測1448×1086px。
- [正確な生成プロンプト](./prompt.txt)。希望キャンバスは1536×1152px、実際の出力寸法は上記。
- 用途: ADELVA HOMEの支援対象セクションを検討するラスタ参考。実装・公開・本番採用は未実施。
- 内容: 採用済み英日見出し、前の会話で提案した本文を短く整理した案、既存HOME資料にある2対象者の名称・説明。生成文字を承認済みの本番原稿として扱わない。

## 参考と由来

ユーザー指定動画: https://youtu.be/bQQrdf2mPDg?si=MmQ7pM__zyauriwq

YouTube oEmbedで「The Spirit of Aman」、投稿者「Aman - Resorts, Hotels & Residences」を確認。動画ページ本文の取得は失敗しており、動画全編は視聴していない。公開サムネイル https://i.ytimg.com/vi/bQQrdf2mPDg/maxresdefault.jpg を原寸確認し、風景の雰囲気参考として画像生成に添付した。入力時のローカルパスは `/tmp/adelva-landscape-video-reference.jpg`。

参考から採用したのは、朝の光、霧、重なる緑の山並みという方向性。参照写真自体は研究専用。AMANのロゴ、施設、同一構図の保持は指示せず、新しい架空の風景を生成。実在の支援先・施設・実績を表す写真ではない。

## 生成・確認

- subscription-backed built-in `image_gen` を使用。テキスト解釈・プロンプト作成・レビューはAstra。未公開の画像モデル設定やquality値は推定しない。
- 原本: `/home/kokoro/.codex/generated_images/01a084a6-3e7c-7fc1-bd0f-6c8e5407c3a1/exec-11b08329-10fd-4153-a07d-2d6c346f0fcf.png`。
- 原本を原寸表示し、英日見出し、本文、2つの対象者と説明、文字の欠け、不要ロゴの不在を確認。画像の実寸・形式と保存先を確認。
- 上部は風景、下部は英日タイトル・本文・同格の2対象者導線。白い文字と細い罫線、控えめなオレンジの矢印。
- alt意図: 霧のかかる雄大な山並みを背景に、Who We Supportと支援対象の見出し、経営者・現場責任者向けの2導線を配置したADELVAのセクションモック。
- ラスタ参考のみ。モバイル、インタラクション、本番アクセシビリティの検証をしたものではない。Webサイトのコード変更なし。
