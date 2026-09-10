# HOME HERO動画の復元版への差し替え

対象は `/` の背景動画と読み込み時の静止画。ユーザー指定の
`/home/kokoro/projects/_tools/video/output/aman-film-v2/quality-repair/aman-nature-v2-32s-restored-web-1080p.mp4`
を `public/media/video/hero-antarctica.mp4` に無変換でコピー。
SHA-256 は原本・配信ファイルとも
`f2ce2b25158a8a4558f958b924e0cefc13039e9e41157cfca22ad7375357b2a5`。
`public/media/target/hero-poster.webp` は同動画の先頭フレームをWebP品質90で抽出。
出所・所有者・使用許可・読み込み方針は `docs/asset-provenance.md` に記録。
コード、DOM、文字、スクロール制御、Watch Filmは変更なし。サブエージェント不使用。

## 検証結果

- format:check、lint、typecheck、production build: 成功。
- unit: 11ファイル・100件成功。
- Playwright: HOME外部参照グリッド・順逆スクロール・タッチ中のJS停止・
  サイズ変更・メニューロック4件、既存visual regression 3件、計7件成功。
- visual snapshots更新モードも実行したが差分許容範囲内で、golden変更なし。
  外部参照のグリッド検証はvisual regressionと別に実施。
- 本番ビルドのローカルサーバー、1440×900・768×1024・390×844で
  1920×1080・32秒動画の自動再生、muted/loop/inline、reduced-motion時停止、
  横溢れなし、ブラウザ例外なしを確認。各サイズのaxe WCAG A/AA違反0件。
- 3サイズの動画2秒地点を目視確認。最終画像と再現スクリプトは
  `artifacts/hero-restored-2026-09-11/`。検証補助スクリプト初回のaxe context
  設定誤りを修正後、全サイズ成功。
- MP4はH.264/yuv420p、音声なし、moovがmdatより前（faststart）。

動画は19.4MBから46.4MBへ増加。ユーザー指定品質をそのまま保持しており、
低速回線の読み込み・転送量は増える。サイト全ルート再検証や実機性能保証ではない。
今回の動画・静止画・台帳・出所記録・本報告のみをコミットし、mainから
既存Vercel連携で公開する。公開成功と配信ファイルの一致は公開後に確認する。
