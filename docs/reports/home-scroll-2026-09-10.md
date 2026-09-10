# HOMEモバイルのスクロール・縦線修正

対象: `https://www.adelva.jp/` の `/`。参照: `https://white-desert.com/`。
ユーザーの指示で実装・検証・Git経由のVercel公開を行う。サブエージェント不使用。
実装前仕様: `docs/specs/home-scroll-2026-09-10.md`。

## 原因と変更

1. **ヒーローのガクつき**: 元実装は通常スクロールで上に動いたヒーローを、
   次のJavaScript描画で同じ量だけ下に戻していた。タッチのスクロールと
   JavaScriptが別のタイミングで動くため、処理が遅れると位置補正が見える。
   Chromiumの実タッチ入力イベントとScriptExecutionDisabledで再現。
   公開版はヒーロー上端が-537pxへ移動。修正版は約550pxのスクロールでも0px。
   CSS stickyへ固定を移し、霧・文字の既存軌道だけをJSで更新する。
   200svhのセクション長と既存の演出順序は保持。
2. **不要な描画・寸法取得**: ヒーローと横移動セクションが毎スクロールで
   要素寸法・位置を取得していた。ResizeObserver、リサイズ、フォント準備時に
   計測し、スクロール中はキャッシュした値を使う。進行度が変わらない区間は
   DOM更新を省略。画面外のCampsがSVGマスクを繰り返し更新する問題も解消。
   ヒーロー動画は画面外で停止。設定変更・アンマウント時は監視と処理を解除。
3. **縦線が不連続**: 元の写真上の線は6列・1px・白16%、Purposeは別の暗い線。
   参照の実測は固定グリッド、0.5px、白、親opacity 0.1、difference合成。
   HOMEだけを一つのグリッドへ統一。モバイルは5本、768/1440pxは9本。
   Purposeと写真の境界を同じ座標で通り、背景に合わせて明暗が変わる。
4. `next-env.d.ts` は本番ビルドが生成する標準`.next/types`参照へ戻った。

## 検証

本番ビルドの専用サーバー `127.0.0.1:4197` で確認。開発サーバーとの混用なし。
1440×900、768×1024、390×844、DPR 1。390はタッチ・モバイルエミュレーション。

- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm build`: 成功。
- `pnpm test:unit`: 11ファイル・100件成功。
- 新設 `tests/e2e/home-scroll.spec.ts`: 本番ビルドで4件成功。
  3サイズの外部参照グリッド座標・幅・透明度、ヒーローの順逆方向、Campsの
  開始/中間/終了/逆方向、画面外DOM更新0件、動きを減らす設定を確認。
  別のタッチテストでJS停止中の固定、844→760pxの高さ変更、メニューの
  スクロールロックとEscape時のフォーカス復帰を検証。
- `pnpm test:revision`: 10件成功。主要4ルート×3サイズのaxe違反0件、
  ナビゲーション・フッター・Approachの順逆方向・ローカルフォームも確認。
- WebKit: 3サイズ×4スクロール位置すべてヒーロー上端0px。
  reduced-motion時の動画停止、横溢れなし、ブラウザ例外0件。
- 外部参照: `tests/fixtures/home-grid-reference.json` に参照サイトの実測値を保存。
  3サイズとも全線の位置差0.6px未満、幅差0.1px未満、opacityと合成方法一致。
  既存のHOME visual regression 3件も、ゴールデン更新なしで成功。

全体E2Eは255件中254件が初回成功。1件はモーション設定を切り替えた直後の
フッターホバー検証で失敗し、同じ製品コードで単独1回＋連続3回は成功した。
設定切替で上流の固定セクションの高さが変わるため、既存テストを、レイアウト
確定までホバー対象を再取得して同じtransform条件を確認する形に修正。
製品の動作・合格条件・待機上限は変更していない。修正後のフッター8件はすべて成功。

新しいJS中断テストは、修正前の公開サイトに対して435pxの固定位置ずれで
失敗し、本番ビルドでは成功。初期の手動CDP測定（537px）とはスワイプ終端が
異なるが、同じ不具合を検出することを確認した。

## 画像・再現方法・範囲

`node scripts/fidelity/capture-home-scroll.mjs` で本番ビルドの10状態×3サイズと
外部参照2状態×3サイズを撮影。`HOME_SCROLL_URL`で対象を指定可能。
`artifacts/home-scroll-2026-09-10/final/` に撮影条件JSON、参照原本6枚、
左右比較6枚、実装シーケンス3枚、WebKit結果を保持。
シーケンス順はhero、mist、Purpose、support、expertise入口、中間、終端、
逆方向、Approach、footer。比較画像は左が参照、右が実装。

全ページの画像一致を主張する検証ではない。ADELVAの日本語、写真、
セクション長、ヘッダー、既存How it worksタブは承認済み実装を維持。
画像はコード変更の判断と記録にのみ使用し、本番アセットへ追加していない。
素材の出所・権利・最適化は既存`docs/asset-provenance.md`を引き継ぐ。
新しい依存パッケージも追加していない。

実機iPhone/SafariのGPU負荷・フレームレート保証ではない。測定したのは
Chromiumのネイティブタッチ、JS中断時の固定とLinux WebKitの挙動。
FPSの推定や異なる実行条件のプロファイルを使った高速化率は報告しない。

## 変更ファイル

- `src/components/home/hero-stage.tsx`: native sticky用構造、寸法キャッシュ、動画停止。
- `src/components/home/camps-flow.tsx`: 寸法キャッシュ、画面外・同値更新の省略。
- `src/app/globals.css`、`src/app/layout.tsx`: HOMEの統一グリッド、stickyのCSS。
- `src/components/home/home-document.tsx`: 二重になっていたPurpose縦線を削除。
- `tests/e2e/home-scroll.spec.ts`、`tests/fixtures/home-grid-reference.json`: 回帰と外部参照検証。
- `scripts/fidelity/capture-home-scroll.mjs`: 再現可能な状態別キャプチャ。
- `tests/e2e/home-footer.spec.ts`: モーション設定切替後のホバー対象の再取得。
- `next-env.d.ts`、今回の仕様・報告・作業台帳。

既存の未コミット変更は保持し、今回のファイルだけをコミットする。
