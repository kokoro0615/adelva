# 共有クローム（ヘッダー・フッター・グローバル CSS・遷移）— 2026-10-13 polish

担当: Opus 5.5（shared agent）／ブランチ `polish/shared`（worktree `clonetest-e-shared`、ポート 4810–4819）。
比較は同一マシン・同一時間帯で連続実行: before = 分岐元 `b28182a` を `git archive` で取り出して
本番ビルドしたもの（4811、BUILD_ID `oFWv9tsEq46DLLO8bVbBE`）、after = 本ブランチの本番ビルド
（4810、最終検証 BUILD_ID `1vMJHeg5MJdDmSvB8i9uM`、配信 HTML に含まれることを確認）。
共有の 4791 は WSL 再起動で消えていたため使っていない。Headless Chromium は SwiftShader（CPU）であり、
絶対値は GPU の数値ではない。

## 原因（測定と根拠）

1. **ヘッダーが毎スクロールフレームで強制レイアウト。** `site-header.tsx` が自前の rAF 内で
   `window.scrollY` を読んでいた。ページの rAF が先に style を書くため、読むたびに同期レイアウト。
   トレース（390×844、30 ドラッグ）で /approach の強制レイアウト 134 件中 119 件、
   /services/revenue-brand で 42 件、/challenges/owner 9、/about 8、/contact 6 件がこの 1 箇所
   （chunk `2bjva2x7stm4u.js:1:17482`）。/contact ではページ唯一の rAF でもあった（244 回）。
2. **常時 backdrop-filter。** 読みやすさのための veil が `backdrop-filter: brightness(0.44)`。
   全ページ・全幅でヘッダーが backdrop root になり、写真・canvas・動画が動くたびに再フィルタ。
   さらにスマホのガラス状態（62% + `blur(14px) saturate`）、HOME のガラス（70% + `blur(16px)`）、
   /about の紙（`blur(14px)`）、ドロワー（86% 白 + `blur(32px)`）。iOS では毎フレーム再ブラー。
   なお veil は「0.44 倍の明るさ」＝「56% 黒の重ね」と数学的に同一（両方 sRGB 乗算）なので、
   見た目を変えずにフィルタを外せる。
3. **他ページのメディア・CSS を毎ページで先読み。** `<Link>` は viewport から 200px 以内に入ると
   prefetch する。閉じたドロワーは画面右端の 1 幅外（translateX(100%)）＝ 200px マージン内にあり、
   さらにバーのロゴ（`/` へのリンク）が常時表示。結果、全ページが `/`・`/approach`・`/about` の
   RSC を各 2–3 回取得し、そのペイロード内の `preload()` ヒントを React が適用 → HOME の
   ポスター（205 KB）、/approach の m-hero（186 KB）、/about のプレート、他ページ CSS 2–3 本を
   ダウンロードし「preloaded but not used」警告 4–12 件（390、全 10 ルート）。
4. **毎ページの不要ダウンロード。** ロゴマスクに 1024px の原画（133 KB）、フッターの ADELVA
   6 文字のためだけに Inter Tight 可変フォント全体（234 KB、8 ルートで唯一の使用者）。
5. **フッター。** 「ADELVAについて」群の見出しと唯一のリンクが同名（重複）。ADELVA の表記が 3 つ
   （ヘッダー・巨大ワードマーク・最下段の小さな ADELVA）、法人表記なし。スマホの行ピッチ 33px
   （タッチ 44px 未満）。登場の動きなし。
6. **iOS のバウンス。** HOME・/approach・services・/about はルート背景を塗っておらず body の
   紙色がキャンバスに伝播。ページ末尾でフリックすると黒いフッターの下から淡い帯が跳ねる。
7. **レイアウトシフト。** 最初のスクロールでバーの高さを `height` で縮めており、ロゴ・CTA・
   メニューが縦に動く（ヘッダー由来 CLS 0.00051、デスクトップ 0.00018）。
8. **320px。** ブランド＋CTA＋メニューに 268px 必要なところバーは 252px。CTA が
   `overflow: hidden` のため縮み、文字が枠いっぱいに詰まっていた（revenue-brand からの依頼 5）。
9. **シェルの二重送信。** ルートレイアウトが全ページを `RouteShell` で包み、使わない旧シェル
   （フッター一式・スキップリンク・グリッド線）を毎ページの RSC ペイロードに直列化していた
   （「Start with a」が HTML に 3 回）。`RouteTransition` はその旧シェル内にしかなく、ADELVA の
   全ページで実質未使用。
10. **ドロワーからの遷移。** リンクを押すと先にドロワーが閉じ始め、離れるページが一瞬見えてから
    次ページにカットされていた。

## 変更点

コミット（`b28182a..HEAD`）:

- `48545ba` perf(header): フレームごとのレイアウトなし・スマホの backdrop-filter なし・他ページ prefetch なし
  - compact 判定を IntersectionObserver の番兵（文書先頭 24px）に変更。スクロール中ヘッダーは何もしない。
  - veil を同一の 56% フェザーグラデーションに（ピクセル同一、backdrop root なし）。
  - スマホ／coarse pointer: ガラスのバー・HOME のガラス・紙のバー・ドロワー・メガシートを
    実測済みの不透明／スモーク塗りに（スモーク 84%、白文字×白背景で 12.4:1。紙 96%。ドロワー
    とメガシートは不透明紙 `#f6f5f1`）。塗りは 300ms クロスフェード（R3）。
  - 暗い写真ページはすべてスマホで compact 時スモーク面（owner・GM・/challenges を追加）。/about は紙、HOME は自前。
  - ヘッダーのリンクを `IntentLink`（pointerenter／focus で prefetch、可視性では prefetch しない）に。
  - メニューのリンクで別ページへ移るとき、スクロールロックを同期的に解除し、メニューは次ページが
    置き換えるまで開いたまま（押したリンクは activating 表示）。同ページのハッシュは従来どおり閉じる。
    bfcache 復帰時は閉じる。
  - `.compactCta` の誤記を修正（/about の紙面で CTA の枠が白 55% のまま見えなかった）。
- `ad70a9f` refactor(shell): `RouteShell` を廃止（各ページが自分のシェルを持つ）。404 は自分でシェルを描画
  （旧 White Desert のグリッド線は外した）。`RouteTransition` を全ルートに常設し、activation と
  pending ライン（上端のオレンジの線、開いたドロワーより上）だけを残し、旧ルート用の到着カーテンを削除。
- `6f55fd1` feat(footer):
  - 登場: 呼びかけの 2 行が自分のベースラインから立ち上がり、その下の罫線が画面に入ると、サイトの
    「一本のオレンジの線」が罫線に沿って問い合わせの円へ引かれ、そのまま残る。要素ごとに画面に
    入った時点で発火（IO 1 個、transform の CSS transition のみ、ハイドレーション後・
    motion 許可時・画面外の要素だけを arm。見えている文字を隠して出すことはない＝R8）。
  - 構成: 第 3 群を「会社情報」（`groupLabels.about`）にし、主ナビの直接リンク「支援の進め方」
    「ADELVAについて」を掲載（IA §6.6 の会社群の内容）。重複を解消。
  - 最下段の小さな ADELVA を法人表記「© ADELVA合同会社」（`site.legalName`）に。
  - coarse pointer では各行を全幅 44px のタップ領域に。
  - ワードマーク用に Inter Tight 500 の A D E L V だけのサブセット（1 KB、OFL）。
  - フッター最下段が画面にある間だけルート背景をフッター色に（iOS の淡い帯を解消）。
  - アンカーの scroll-padding をブレークポイントごとの compact バー高に（スマホ 54px+16px）。
- `64195f4` 計測ハーネス `scripts/adelva/polish/net-audit.mjs`。
- `5836c1e` `tests/e2e/shared-chrome.spec.ts`（motion 有効のスマホ検査 6 本）＋ルートレイアウトで Oswald を preload。
- `f8d1be3` ロゴマスクを原画の該当 344×520px をそのまま切り出したパレット PNG（24 KB、アルファ完全一致）にし、
  原画と同じ座標に置く: 描画はピクセル同一（visual ゴールデン 18/18 そのまま）。
- `1eff2d2` ヘッダーがフッターの上にある間はスモーク面に（/about の紙のバーが黒いフッター上に淡い帯で浮いていた）。
- `ab04eeb` compact を transform で（バーのレイアウト高は不変、上へスライド＋中身を半分戻す）→ ヘッダー由来 CLS 0。
  320–359px でガター・間隔・CTA 余白・字間を詰め、CTA に 12px の内余白、メニューもバー内に。
- `ebc63b9` ヘッダー文字コントラスト計測ハーネス `measure-header-contrast.mjs`。`cb2a680` 整形のみ。

## before / after の数値

### ネットワーク（390×844、読み込み後 6 秒、`net-audit.mjs`）

| ルート                          | 警告   | RSC prefetch | 画像・フォント KB | CSS | 合計 KB   |
| ------------------------------- | ------ | ------------ | ----------------- | --- | --------- |
| /                               | 0→0    | 7→0          | 8826→8286         | 5→3 | 9163→8549 |
| /challenges                     | 6→0    | 7→0          | 2830→2319         | 6→3 | 3174→2559 |
| /challenges/owner               | 6→0    | 7→0          | 1820→1074         | 6→3 | 2170→1320 |
| /challenges/general-managers    | 12→6※1 | 7→0          | 2472→1726         | 6→3 | 2835→1985 |
| /services/management-operations | 6→0    | 7→0          | 6327→5815         | 6→3 | 6687→6070 |
| /services/revenue-brand         | 6→2※2  | 7→3※2        | 2148→1607         | 6→4 | 2598→2005 |
| /services/dx-it-procurement     | 6→0    | 7→0          | 1916→1170         | 6→3 | 2274→1431 |
| /approach                       | 4→0    | 7→0          | 2023→1464         | 5→3 | 2363→1721 |
| /about                          | 5→2※2  | 7→3※2        | 3002→2476         | 5→3 | 3359→2786 |
| /contact                        | 6→0    | 7→0          | 1751→1006         | 6→3 | 2101→1251 |

1440×900 の合計 KB: / 14314→13724、/challenges 2760→2169、owner 2226→1399、GM 2932→2105、
management-operations 4208→3614、revenue-brand 2597→2029、dx 2533→1712、approach 2352→1695、
about 3022→2487、contact 2008→1181。
※1 残り 6 件は GM ページ自身の GSAP「target not found」。※2 ページ本文のパンくず `<Link href="/">`
（ページ側の Link。下記「依頼」で 1 行の置き換えを提示）。

### メインスレッド（390×844、`trace-scroll.mjs`、30 ドラッグ、連続実行）

| ルート                  | 強制レイアウト（うちヘッダー）                                  | IO 計算 ms |
| ----------------------- | --------------------------------------------------------------- | ---------- |
| /contact                | 6 (6) → 1 (0)※                                                  | 49 → 21    |
| /approach               | 134 (119) → 15 (0)、最終ビルド 20 (0)                           | 83 → 26    |
| /services/revenue-brand | 385 (42) → 335 (0)                                              | 114 → 66   |
| /challenges/owner       | 48 (9) → 45 (0)                                                 | 100 → 46   |
| /about                  | 101 (8) → 86 (0)                                                | 90 → 64    |
| /                       | 130 → 144（HOME 自身の mobile.ts が支配。ヘッダーは上位に出ず） | 182 → 88   |

※ 残り 1–3 件は計測スクリプト自身の `page.evaluate`。/contact の rAF は 244 回 → 1 回。

### フレーム（390×844、CPU 4 倍、`touch-scroll.mjs`）

- /approach: >50ms フレーム 131→58（最終 56）、p90 67→50ms、p99 200→133ms（最終 117）、
  LoAF 合計 11.1s→4.8s、スクリプト 235→50ms、描画 997→436ms、console 24→0。
- /contact: p99 150→133ms（最終 100）、LoAF 3.4s→3.1s（最終 2.3s）、スクリプト 45→0ms、console 12→0。
- /services/revenue-brand: 変化なし（>50ms 104→105、LoAF 10.9s→10.8s）。ページ自身の SVG フィルタと
  `ea` の強制レイアウト（307 件）が支配。console 18→6。
- /challenges/owner: 2 組の反復で >50ms 24→23、11→10（ノイズ範囲）。console 18/12→0。
- CLS: ヘッダー由来 0.00051→0（390 revenue-brand）、0.00018→0（1440 /approach）。全計測で backJumps 0。

### WebKit（iPhone 13 プロファイル、headless WPE、`webkit-scroll.mjs`）

全ルートでエラー 0。/contact p50 124→95ms、/approach 37→38ms。/challenges/owner は同一ビルドの
反復で 121–179ms とばらつきが大きく（before も 71–138ms）、headless WebKit では判定不能。
実機 iPhone での確認は本環境ではできていない。

### ヘッダー文字のコントラスト（`measure-header-contrast.mjs`、全 10 ルート × top／scrolled／フッター上、背景 90 パーセンタイル）

- 320px: 最小 4.18（/challenges scrolled の CTA）→ 5.48、4.5 未満 1→0。
- 390px: 最小 4.18 → 4.95、4.5 未満 1→0。
- 1440px: 最小 4.39 → 4.40（/approach scrolled の ADELVA 30px＝大きい文字、AA 3:1 は満たす）。

### その他

- デスクトップのメガメニュー経由の遷移（hover→click→URL）: before 230–588ms、after 233–738ms（中央値は同等、
  1 回だけの 2.2s は再現せず）。ホバーで prefetch するため速度は維持。
- フッターの幾何（見出し 2 行・ラベル・円・群見出し）は 1440／768／390 で before と 0.1px 単位で一致
  （第 3 群の行が 1 行増えた分だけ下方が伸びる。スマホは 44px 行で +37px）。

## スクリーンショット／シート（`img/`）

- `sheet-390-before.jpg` / `sheet-390-after.jpg`: 全 10 ルート × [top, scrolled, フッター進入, フッター先頭, 最下部]。
  1440・768 も同形式（`sheet-1440-*`, `sheet-768-*`）。
- `header-bands-390-before-after.jpg`, `header-bands-1440-before-after.jpg`, `header-compact-before-after.jpg`:
  ヘッダー帯の比較（veil は同一、/about の CTA 枠が見えるようになった、compact 位置は同一）。
- `header-320-after.jpg`: 320px のバー。
- `drawer-390-768-before-after.jpg`, `mega-1440-before-after.jpg`: メニュー（スマホは不透明紙、デスクトップは不変）。
- `drawer-navigation-strip-before-after.jpg`: /approach → ドロワー → /about の画面列（before は閉じかけの
  ドロワー越しに旧ページが見える、after は押したリンクのまま次ページへ）。
- `footer-390-before-after.jpg`, `footer-1440-before-after.jpg`, `footer-arrival-390.jpg`, `footer-arrival-1440.jpg`:
  フッターと登場の動き。`about-footer-390-after.jpg`, `about-footer-1440-after.jpg`: /about でフッター上のバー。
- `home-surfaces-390-before-after.jpg`: HOME がシーンごとに切り替える面（film／paper／glass）。
- 数値の生データ: `data/`（net-audit、header-contrast、trace の比較ログ）。

## ゲート（最終ビルド `1vMJHeg5MJdDmSvB8i9uM`、`next start -p 4810`、BUILD_ID を配信 HTML で確認）

| コマンド                                                                                                             | 結果                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --check <変更ファイル>`                                                                          | 合格（`cb2a680` で IntentLink を整形、挙動は不変）                                                               |
| `pnpm exec eslint --max-warnings=0 <変更ファイル>`                                                                   | 合格                                                                                                             |
| `pnpm exec tsc --noEmit`                                                                                             | 合格                                                                                                             |
| `pnpm exec vitest run`                                                                                               | 80/80 合格                                                                                                       |
| `PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4810 pnpm exec playwright test --project=chromium --workers=1`（全 spec） | 217 合格／1 不合格: `approach.spec.ts:184`（スマホのガラスが `blur` を含むことを期待。意図した変更。下記依頼 1） |
| `tests/e2e/visual.spec.ts`                                                                                           | 18/18 合格（ゴールデン変更なし）                                                                                 |
| `tests/e2e/shared-chrome.spec.ts`（新規、motion 有効）                                                               | 6/6 合格（変更前ビルドでは 5/6 不合格）                                                                          |
| `tests/e2e/home-footer.spec.ts`                                                                                      | 合格（リンク数 6→7 に更新）                                                                                      |
| axe（WCAG 2.2 A/AA、ヘッダー・フッター・開いたドロワー／メガ、11 ルート × 1440／768／390）                           | 違反 0                                                                                                           |
| `measure-header-contrast.mjs` 320／390／1440                                                                         | 上記。4.5 未満はデスクトップの大きい文字 1 件のみ（3:1 は満たす）                                                |

## 決定事項

1. veil は backdrop-filter をやめて同一の黒グラデーションに（見た目同一、全幅）。
2. スマホ・タブレット（`max-width: 63.999rem` または `pointer: coarse`）では chrome に backdrop-filter を一切使わない。
   デスクトップは HOME のガラスバーとメガシートのガラスを維持（ユーザー承認済みの透明・ガラス材質。
   GPU 合成で安価。今回 GPU での再計測はしていない）。
3. スマホの compact スモーク面を暗い写真ページ全部に拡大（owner／GM／/challenges を含む）。/about は紙、
   HOME はページが設定。ヘッダーがフッター上にある間は全ページでスモーク面。
4. ヘッダーのリンクは intent prefetch（`IntentLink`）。ページ側にも 1 行で使えるよう公開。
5. メニューから別ページへ移るときはメニューを閉じずに次ページへ置き換える（ロックは同期解除）。
6. `RouteShell` を廃止し、404 は自分でシェルを描画。旧グリッド線は 404 から外した。
7. `RouteTransition` は到着カーテンを削除し、activation と pending ライン（オレンジの線）だけを全ルートで常設。
8. フッター第 3 群は「会社情報」＋「支援の進め方」「ADELVAについて」。最下段は「© ADELVA合同会社」
   （年は入れない: 設立年か現在年かの判断を避け、会社データをクライアント bundle に持ち込まないため）。
9. フッターのオレンジの線は描いた後も残す（どのページも最後はこの線で問い合わせに着地する）。
10. ロゴマスクは原画の画素そのままの切り出し（描画同一）。リサンプリング版（4.7 KB）は 1–10px の AA 差で
    ゴールデンを壊したため不採用。

## 共有部分への依頼（＝ページ側にお願いしたい 1 行変更）

1. `tests/e2e/approach.spec.ts` 199–201 行: `expect(await bar.evaluate((n) => getComputedStyle(n).backdropFilter)).toContain("blur");`
   → `...backdropFilter)).toBe("none");`（スマホのスモーク面は不透明塗り、alpha > 0.5 の検査はそのまま通る）。
2. ページ本文の `next/link`（パンくず等、画面上部にあるもの）: 各ページの
   `import Link from "next/link";` → `import { IntentLink as Link } from "@/components/intent-link";`
   対象: `about-page.tsx`, `revenue-brand-page.tsx`（この 2 つは計測で `/` の prefetch と HOME ポスターの
   先読みが残っている）、同様に `approach-page.tsx`, `dx-it-procurement-page.tsx`,
   `general-managers-page.tsx`, `management-operations-page.tsx`, `owner-page.tsx`。`IntentLink` は文字列 href のみ。
3. /challenges 再構築: `HomeFooter` はサーバーコンポーネントから描画してください（現状はクライアントの
   `nosigner/home.tsx` が import しており、フッターと会社データが /challenges のクライアント bundle に入る）。
4. ルート背景を塗っていないページ（HOME、/approach、services 3 ページ、/about）は、iOS で先頭を
   引っ張ると body の紙色が見える。冒頭が暗いページは GM／owner／contact と同じく
   `:global(html):has(.page) { background-color: <冒頭の色>; }` を 1 行。末尾はフッター側で対応済み。
5. HOME（`home-a2/mobile.ts`）は `[data-brand-word]` の `getBoundingClientRect` を毎フレーム読む。ヘッダー側の
   ブランド語の位置は compact でも transform しか変えないので、resize 時にキャッシュすれば足りる。

revenue-brand からの依頼 1–5 はすべて本ブランチで対応済み（1: 強制レイアウト 42→0、2: スマホで blur なし、
3: 他ページ先読み 6→0、残る 2 件は自ページのパンくず Link＝依頼 2、4: ヘッダー由来 CLS 0、5: 320px で 12px の内余白）。

## 残課題

- フッター写真の差し替え（画像担当、`public/media/adelva/home-footer/{desktop,mobile}.webp` を同寸で）。
  差し替え後に `sheet-*` と同じ撮影で文字の載る下部が暗いことを再確認。
- 実機 iPhone（Safari）での確認は未実施。headless WebKit の数値は上記のとおりばらつきが大きい。
- デスクトップは透明バーのまま（ユーザー承認の方針）。スクロール時にページ本文がブランド語と重なる
  （/approach 1440 で 4.40:1、大きい文字としては合格）。デスクトップにも compact 面を付けるかはユーザー判断。
- 1440 のスクロール中、GM と revenue-brand の右端の固定インデックスがフッターに重なる、/about 390 の
  縦インデックスが本文に重なる（各ページの担当）。
- ヘッダーの chunk に `site-pages` の説明文（約 8 KB）が `routeStatusOf` 経由で全ページに入っている。分割は未実施。
- 13:45 頃、ベースライン計測を止める際に `pkill -f "[t]race-scroll.mjs http://127.0.0.1:4791"` を使った。
  同じ 4791 に対して trace-scroll を走らせていた他エージェントの計測も止めた可能性がある（PID 指定にすべきだった）。
