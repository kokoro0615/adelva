# 改訂v2 — 2026-09-08

対象: /challenges/general-managers の縦長ラスタモック。ユーザーのブラッシュアップ指示で指定ファイル long-page-mock.png を改訂。旧版は long-page-mock-v1.png、新版は long-page-mock.png にも保存。実装・公開は行っていない。

## 調査と設計への反映

- 現行HOME: artifacts/adelva-navigation-typography/1440-default.png を原寸確認。巨大な縦長英字、濃紺とオレンジ、罫線、透明ナビを継承。
- White Desert: 既存の実測記録 .Codex/docs/research/white-desert-motion-study.md を再利用。今回の新規実測ではない。霧による場面転換、写真と文字の異なる移動量を設計の起点にした。
- [Salterra公式](https://www.salterra.com/): 1440×900の先頭と850pxスクロール後を新規撮影。撮影時に写真が読み込まれず、実画面からは余白・右寄せ本文・ナビのみ確認できた。[Awwwards紹介](https://www.awwwards.com/sites/salterra-resort-spa)のスクロールで写真が浮かぶ説明を別途参照。現在のサイトと2024年の紹介の同一性や動作の再現は未確認。
- [Audo公式](https://audocph.com/): 先頭・850px・1900pxを撮影。Cookieと通貨のオーバーレイで一部が隠れていた。背景に見える大きな写真、余白、複数の写真サイズの組み合わせを確認。固有の動作や時間を測定したとは扱わない。
- [Aman公式](https://www.aman.com/): 先頭と850pxを撮影。Cookieパネルで中央が隠れたが、幅の異なる写真と余白の構成を確認。写真・ロゴ・コピーは転用していない。
- 新規調査スクリーンショットは research-v2/ 内。第三者の著作物として研究専用、本番利用不可。写真の未読込やオーバーレイを成功した全面観察と扱わない。

## v1からの変更

ヒーローの山並みの奥行き、下端の霧、リネン写真、廊下とディテール写真の重なり、食卓の近景、後半の外観への視点変更、写真を取り込んだ巨大なADELVAフッターを追加。8段階の情報順序と5課題、3支援経路、4者、6工程、CTAを維持。役割の章は引き続き比較的コンパクト。

## モーション設計案（画像では動かない）

1. ヒーロー: 写真はスクロールに対して最大6%程度だけ移動。霧レイヤーは次の紙面を開く境界として使う。日本語をぼかさず、読み取りを遅らせない。
2. 課題行: hover/focusでオレンジの罫線を180ms程度で表示。5項目は常時見える。移動は矢印の4px以内。
3. 廊下写真: 章への進入時に幅が58%から最終幅へ広がる構想。実装ではレイアウトを動かさず写真のクリップで表現。小写真は遅れて40ms程度の差で表示。本文には適用しない。
4. 支援経路: 3経路の線を順に強調し、判断→支援→成果物の関係を示す。文字とリンクは常時表示。
5. 後半外観: 写真内側のわずかな拡大を戻しながら6工程の線を進行させる。ピン留めや強制横スクロールは不要。
6. フッター: ADELVA内の写真は静止でも成立。CTAは待ち時間なしで操作できる。
7. reduced-motionでは写真移動・クリップ・線描画を無効化し、全要素を完成状態にする。これらの数値は提案であり、参考サイトの実測値でも実装検証値でもない。

## 出力と確認

実測PNG寸法: 724×2172。指定ファイルとv2保存版のSHA-256一致を確認。旧版793×1981は別ファイルに保持。拡大加工なし。

画像生成ツールの原本: /home/kokoro/.codex/generated_images/01a08156-0a1c-7eb0-a83b-2207a9002b07/exec-a235b0bc-84fc-46a7-b761-af90c3c203ab.png

原寸のプレビューで全体の構図と主要文言を確認。全体モックのため微小文字の完全一致は保証できない。高解像度の1440×5760を希望したが実寸はツールの返却値による。画像は本番原稿や完成した動作の証拠ではない。建築は架空で顧客施設の証拠ではない。画像内に架空の成果数値や推薦文なし。

入力1: long-page-mock-v1.png — 編集対象、内容とコンセプトを保持。
入力2: artifacts/adelva-navigation-typography/1440-default.png — HOMEの視覚スタイル。
Built-in subscription imagegen使用。露出していない品質・モデル設定は主張しない。

## Exact prompt

Recreate and substantially refine the attached ADELVA long webpage mockup into an outstanding final-quality long vertical desktop website design. Reference 1 is the exact previous mock to improve: preserve its brand, Japanese content, eight-stage narrative, mountain-hotel visual concept, navy/cream/orange palette and general-managers audience; you may thoroughly recompose its layout, typography scale, imagery framing and section proportions to deliver much stronger cinematic spatial drama. Reference 2 is the current actual ADELVA HOME: preserve its monumental condensed typography, hairline grid, subtle navigation and immense photographic scale. One continuous full-page screenshot, no device, no moodboard, no annotations. Very tall portrait canvas ideally 1440 x 5760, ratio 1:4, highest available native detail. Give the page much more breathing room than the cramped reference.

CREATIVE DIRECTION: cinematic Japanese mountain hospitality, immense blue-grey mountain distance contrasted with precisely lit timber/stone interiors; restrained amber light, ink navy #1f2a44, near black #0e1118, paper #f1efea, orange #ff7e15 used sparingly for actions and orientation. Refined editorial Japanese serif headings mixed with crisp Japanese sans-serif labels and body, HOME's extremely condensed uppercase Latin display. Maintain white space, unequal image scales, decisive asymmetrical alignment, exquisite microtypography and very thin rules. Original imagined hotel images, no copied third-party photography. No people, no client or performance claims, no made-up dashboards, no testimonials, no statistics. Do not add new slogans or service promises. No physical ADELVA signage in the imaginary hotel. Brand symbol stays in website navigation and footer only.

CRITICAL IMPROVEMENT: replace the monotonous short alternating rectangular strips of reference 1 with an expansive designed journey: a towering photographic opening; a serene spacious paper chapter; an asymmetric overlapping photograph composition; one navy support sequence; a quiet responsibility field; a second full-bleed photographic climax; verification and monumental closing. Distinct section heights, large open margins and some imagery that crosses an editorial section boundary. Do not make all sections a heading left and rows right. Avoid equal generic cards, pill tags, rounded UI, decorative charts, excessive oversized English everywhere, gradients or repeating the same hotel window in every photograph. Headings and Japanese labels must remain readable. One subtle vertical chapter progress rail, limited to hero and cinematic chapter.

TOP-TO-BOTTOM LAYOUT AND EXACT COPY:

1. HERO (~19%): extraordinary widescreen architectural photograph composed from within the same concept of mountain hotel's high dark timber lobby, a luminous misty mountain panorama opening across the middle and right, foreground stone counter and warm light at far right, large atmospheric negative space. Strong landscape layering, dramatic depth, real materials, discreet cinematic grain. Dark transparent nav at top with ADELVA left, “課題から探す” “支援内容” “支援の進め方” “導入事例” “ADELVAについて” and outlined “問い合わせを送信 →” right. Small breadcrumb “HOME / 課題から探す”. Audience label EXACT “総支配人・現場責任者の方へ”. Elegant large Japanese headline at upper left “現場課題を、” / “継続運用できる仕組みへ。” with generous line spacing; outline CTA “問い合わせを送信 →”. Lower hero features immense white tightly condensed “GENERAL” on one line and “MANAGERS” on the next, both meticulously fitted to grid, much wider and more monumental than old version without colliding with Japanese. A small vertical orange chapter marker and elegant SCROLL cue. Bottom landscape mist veil visibly softens into warm paper, like a natural composited photographic layer, not a stock gradient. Keep all text sharp above the mist.

2. SELF-RECOGNITION (~13%): generous paper breathing space. Small “01 / 現場課題”. Big asymmetrical headline “いま、どの運営状態で” / “詰まっていますか。” across upper left. Below and slightly to right is a broad, extremely legible five-row navigation list taking 65% of width, with massive pale index numbers and strong label hierarchy; small original portrait of neatly prepared hotel linen or hospitality material detail occupies the narrow left side, offset below the title. Exact five labels and descriptors: “品質” — “宿泊・料飲・清掃”; “人材” — “採用・教育”; “生産性” — “業務・部門間の連携”; “販売” — “Web・OTA・営業”; “システム定着” — “導入後の運用”. All five equally accessible, thin rules, arrows aligned right; one selected row orange underline plus dark readable text. No metric-like huge numbers. Leave meaningful white space around the list.

3. DIAGNOSIS (~12%): art-book-like asymmetric composition integrated with paper. A tall original sunlit stone-and-timber corridor photograph occupies left 43%, set inward with generous margin; a smaller close-up of linen and a dark wooden room key tray overlaps its lower right corner without covering text, bridging to the next chapter. At upper right small “02 / 判断”; large “最初に、” / “見極めること。” Right below three carefully spaced labels “現象と原因” / “優先順位と影響範囲” / “現場判断と、Owner・本部判断” with supporting text “基準値を確認する” / “部門間のつながりを整理する” / “決められる範囲を明確にする”. Use sophisticated negative space and long fine rules. Photography feels editorial and tactile rather than a repeated window hero.

4. SUPPORT (~17%): near-black navy field. Huge condensed tonal “OPERATIONS” at top, large but not competing with white Japanese title “判断を、支援と成果物へ。” Small “03 / 支援と成果物”. Three beautifully composed connected horizontal decision paths, with generous vertical separation, left decision, middle support, right result; thin precision lines establish cause and effect. No boxed cards. Row 01 “一部門の改善” → “現場運営改善・人材支援” → “SOP / 教育”. Row 02 “部門横断の運用再設計” → “経営・運営統括 / DX・IT” → “KPI / 会議 / 運用設計”. Row 03 “Owner・本部の意思決定へ” → “経営診断・改善 / 運営体制” → “責任分界 / 改善計画”. White body type; orange small result labels. A restrained orange connecting line visually binds these relationships. Small note “支援範囲・成果物は、課題と条件に応じて整理します。” Under these, a wide cropped photograph of a precisely set empty dining room table from a low oblique perspective, refined repeated glassware catching dawn light, extends to one edge of section; a narrow navy margin on opposite side avoids another generic full-width strip.

5. RESPONSIBILITY (~10%): return to warm paper with wide generous margins. “04 / 役割”. Huge left-aligned heading across two lines “誰が決め、誰が動かし、” / “何を残すか。” Below a wide clear four-column typographic arrangement “Owner・本部” / “GM・部門責任者” / “ADELVA” / “外部関係者”, thin shared baseline. Shared topics “判断権限 / 実行範囲 / 連携 / 引継ぎ” below, not invented assigned responsibilities. Note “具体的な責任範囲は、個別に合意します。” and discreet peer audience link “オーナー・経営者の方へ ↗”. This chapter must feel poised and comfortably readable, not squeezed into a tiny strip.

6. IMPLEMENTATION CLIMAX (~15%): an immersive original exterior view of the imaginary mountain hotel terrace and dark timber building at blue hour, mountains and cloud sea stretching to horizon, the building at right, substantial natural scenery and negative space left. Different viewpoint from hero. Large white “IMPLEMENT.” crosses the photographic space; beautiful Japanese “部門をつなぎ、” / “検証・引継ぎまで。” below. Show a long precise sequence with all six steps and an orange active dot: “課題把握” → “判断” → “実行・実装” → “運用” → “検証” → “引継ぎ”. Give labels room, line on a dark readable quiet plane. “支援の進め方を見る →” outlined action. A designed keyframe of a scroll-expanding photograph with moving depth, but all content visible and static in this image. No motion blur on letters, no explanatory annotation.

7. VERIFICATION (~5%): quiet off-white field “05 / 検証・引継ぎ”; heading “確認し、現場に残す。” Four generous short verification categories separated by fine lines “担当範囲” “成果物” “意思決定記録” “検証・引継ぎ方法”. No pretend proof documents, no fictional case studies.

8. CONTACT & FOOTER (~9%): near-black navy, more breathing room than original. Large elegant Japanese “課題が整理できていなくても、” / “お問い合わせいただけます。” A prominent exact orange rectangular button “問い合わせを送信 →” with dark ink type. Wide bottom monumental condensed ADELVA wordmark, dramatically fitted across whole width, clear intentional visual finish. Tiny footer nav “課題から探す” “支援内容” “支援の進め方” “導入事例” “ADELVAについて”, legal “プライバシーポリシー” “サイトポリシー”, “© ADELVA”. No invented contacts.

Finish as an extraordinarily polished contemporary Japanese website, coherent with its existing HOME and previous concept yet visibly elevated in spatial composition, typography, natural photographic artistry and scroll narrative. Preserve the eight chapters and all specified Japanese key text. Render at very tall portrait aspect with complete footer; never compress the design into eight short strips. Highest-quality final raster output.
