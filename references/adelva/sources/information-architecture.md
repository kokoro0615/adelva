# ADELVA Information Architecture

- 作成日: 2026-08-12（Asia/Tokyo）
- 対象: ADELVA 企業・サービスサイト
- ステータス: 確定
- 承認日: 2026-08-12（Asia/Tokyo）
- 分析根拠: 提供済みの事業定義、3支援領域・20サービス、`PRODUCT.md`、既存foundation設計

## 1. 結論

**統合Balanced案を採用し、公開事例1件を含む合計26ページをlaunch scopeとする。**

内訳は「固定5、一覧・導線8、統合支援テーマ詳細10、事例詳細1、法務2」。20サービスは提供内容のtaxonomyとして維持し、訪問者向けの公開詳細ページは、十分な情報量と明確な判断軸を持つ10テーマへ統合する。必要なページ型は13種類、image-firstで重点的に設計する主要ページ型は11種類を維持する。

ヘッダーは顧客の理解順に、次の5項目とCTAで構成する。

1. 課題から探す
2. 支援内容
3. 支援の進め方
4. 導入事例
5. ADELVAについて
6. Primary CTA: 問い合わせを送信

20サービスはすべてサービス一覧、領域ページ、統合支援テーマページ内で説明するが、1サービスにつき1URLとはしない。headerでは「課題」「対象者」「3支援領域」までを選ばせ、10の支援テーマは領域ページ、desktop footer、mobileの段階式accordion、本文の関連リンクから到達可能にする。

## 2. 情報設計の前提

### 2.1 訪問者が最初からサービス名を知っているとは限らない

ADELVAの訪問者は、例えば「週2〜3日型総支配人」や「DX・システム導入」という商品名ではなく、次のような状態から訪れる可能性が高い。

- 数字は悪化しているが、経営と現場のどこに原因があるか分からない
- GMが不在、または管理機能が弱い
- 開業準備を横断して推進する責任者がいない
- 清掃、料飲、採用など個別課題が連鎖している
- Web、OTA、SNS、ブランドが収益へつながっていない
- システムを導入したが現場に定着していない

したがって、組織都合の「3支援領域」だけでなく、「課題」と「役職」から探す入口が必要である。

### 2.2 20サービスは10の支援テーマ内で個別に説明する

ADELVAの差別化は、20サービスの多さそのものではなく、複数施策を一つの改善計画へつなぎ、責任分界、運用、検証、引継ぎまで扱う点にある。一方で、訪問者は個々の支援について対象、範囲、成果物、進め方を確認する必要がある。

よって、情報構造を次の二層に分ける。

- 上位層: 課題、役職、3支援領域、横断支援の価値を理解する
- 下位層: 10の支援テーマページ内で、20サービスそれぞれの対象、担当範囲、成果物、条件、関連支援を確認する

### 2.3 Primary conversionは問い合わせフォーム送信

サイト全体のprimary CTAを「問い合わせを送信」に統一し、`/contact`へつなぐ。相談内容が未整理でも送信できること、フォームで確認する内容、送信後の流れを専用ページで説明する。

Launchでは問い合わせフォーム方式のみを扱い、日程選択や商談設定をconversionとして見せない。header、本文、footer、フォーム送信buttonで同じ表現を使い、行動結果を正確に伝える。

## 3. ページ数の3案比較

| 案 | ページ数 | 構成 | 長所 | 主な弱点 | 判断 |
|---|---:|---|---|---|---|
| Lean | 13 | 20サービスを3領域ページ内のsectionとして掲載。事例は一覧内に要約 | 最短で公開可能、コピーとmock制作が少ない | 各サービスの責任範囲・SEO・関連事例を深く説明しづらい。長大な領域ページになり、image-to-codeの差分確認も難しい | 暫定サイト向け。ADELVAの事業幅には不足 |
| Integrated Balanced | 25 + 事例N件。事例1件なら26 | 3領域overview、10統合支援テーマ詳細、2 audience導線、課題一覧、進め方、事例詳細 | 十分な情報量を持つページに集約しつつ、20サービスの責任範囲をページ内で比較できる | 統合ページ内で個別サービスの境界を明示する必要がある | **採用** |
| Comprehensive | 38 + 事例N件 + 記事M件。事例1・記事6なら45 | Integrated Balancedに10課題詳細、会社/チーム分割、知見一覧・記事を追加 | SEOと複数検索意図に強く、広告landingにも展開しやすい | launch時点では証拠・原稿・運用体制が不足。薄いページや重複が生まれやすい | 実績と編集運用が整ったPhase 2以降 |

### 採用理由

Integrated Balancedは、ADELVAが約束する「20サービスの内容と責任範囲を正確に伝える」を守りながら、薄い独立ページを避ける。10の支援テーマは顧客の判断単位としてまとまりを持ち、元サービスの違いはページ内のscopeと比較説明で保持する。CMSなし・typed local content・static generationとも矛盾しない。

## 4. 確定page inventory

### 4.1 固定ページ: 5

| # | ページ | URL | 役割 |
|---:|---|---|---|
| 1 | Home | `/` | ポジショニング、2 audience、3領域、支援プロセス、事例、問い合わせCTAを一つの物語として提示 |
| 2 | 支援の進め方 | `/approach` | 課題把握から判断、実行、運用、検証、引継ぎまでを具体化 |
| 3 | ADELVAについて | `/about` | 役割、支援スタンス、会社概要を事実ベースで提示 |
| 4 | お問い合わせ | `/contact` | 対象、相談可能な内容、入力項目、個人情報の扱い、送信手段 |
| 5 | 問い合わせ送信完了 | `/contact/thanks` | 送信完了、次の連絡、誤送信時の案内。検索index対象外 |

### 4.2 一覧・探索landing: 8

| # | ページ | URL | 役割 |
|---:|---|---|---|
| 1 | 支援内容一覧 | `/services` | 3領域、10支援テーマ、20サービスの全体像と横断支援への導線 |
| 2 | 経営・運営統括 | `/services/management-operations` | 領域Aの価値と11サービスを整理 |
| 3 | 収益・ブランド成長 | `/services/revenue-brand` | 領域Bの価値と5サービスを整理 |
| 4 | DX・IT・調達基盤 | `/services/dx-it-procurement` | 領域Cの価値と4サービスを整理 |
| 5 | 課題から探す | `/challenges` | サービス名が不明でも5つの課題群から到達できるhub |
| 6 | オーナー・経営者の方へ | `/challenges/owners` | 経営判断、投資、P&L、開業・再建、運営体制から案内 |
| 7 | 総支配人・現場責任者の方へ | `/challenges/general-managers` | 品質、人材、生産性、販売、システム定着から案内 |
| 8 | 導入事例一覧 | `/cases` | 課題・施設種別・支援領域から実在事例を探索 |

### 4.3 統合支援テーマ詳細: 10

サービス番号は提供内容の識別子として残すがURLには含めない。各ページは複数サービスを単に並べるのではなく、相談状況、選択肢、実施範囲、条件、責任分界を一つの判断材料として構成する。

#### A. 経営・運営統括: 4ページ

| 支援テーマ | 含むサービス | URL |
|---|---|---|
| 経営診断・改善 | 01 経営診断・コンサル、02 経営改善・実行支援 | `/services/management-operations/management-improvement` |
| 開業・運営体制 | 03 新規開業支援、04 週2〜3日型総支配人、05 ホテル全面運営受託、11 民泊立上げ・運営 | `/services/management-operations/opening-operations` |
| 現場運営改善 | 06 宿泊部門運営支援、07 レストラン運営改善、08 朝食・レストラン実運営、09 客室清掃改善 | `/services/management-operations/operations-improvement` |
| 人材・採用 | 10 採用支援 | `/services/management-operations/people-recruitment` |

#### B. 収益・ブランド成長: 3ページ

| 支援テーマ | 含むサービス | URL |
|---|---|---|
| 集客・販売チャネル支援 | 12 Web集客・チャネル収益、16 宿泊営業支援 | `/services/revenue-brand/acquisition-sales` |
| Webサイト・ビジュアル制作 | 13 Website制作、14 Photoブランディング | `/services/revenue-brand/web-visual-production` |
| SNS運用支援 | 15 SNS運用代行 | `/services/revenue-brand/social-media-operations` |

#### C. DX・IT・調達基盤: 3ページ

| 支援テーマ | 含むサービス | URL |
|---|---|---|
| DX・システム導入・個別開発 | 17 DX・システム導入、19 個別ITシステム開発 | `/services/dx-it-procurement/system-delivery` |
| IT運用・保守 | 18 IT運用・保守 | `/services/dx-it-procurement/it-operations-maintenance` |
| アメニティ調達支援 | 20 アメニティ調達支援 | `/services/dx-it-procurement/amenity-procurement` |

### 4.4 導入事例詳細: 1件

| 種別 | URL | 備考 |
|---|---|---|
| 導入事例詳細 | `/cases/[caseSlug]` | Launch時は公開可能な実在事例1件を静的生成。詳細データと掲載許諾の確認後に公開する |

### 4.5 法務: 2

| ページ | URL | 備考 |
|---|---|---|
| プライバシーポリシー | `/privacy` | 問い合わせフォームの取得項目、利用目的、保存、委託先を実装と一致させる |
| サイトポリシー | `/site-policy` | 著作権、免責、リンク、推奨環境等。利用規約という強い名称は避ける |

特定商取引法表記は、オンラインで有償サービスを直接販売しない現状ではlaunch inventoryへ入れない。将来、オンライン販売を行う場合に法務確認の上で追加する。Cookie policyは導入する計測・広告ツールと同意要件が決まった時点で独立ページの必要性を再評価する。

## 5. URL hierarchy

```text
/
├── services/
│   ├── management-operations/
│   │   ├── management-improvement/
│   │   ├── opening-operations/
│   │   ├── operations-improvement/
│   │   └── people-recruitment/
│   ├── revenue-brand/
│   │   ├── acquisition-sales/
│   │   ├── web-visual-production/
│   │   └── social-media-operations/
│   └── dx-it-procurement/
│       ├── system-delivery/
│       ├── it-operations-maintenance/
│       └── amenity-procurement/
├── challenges/
│   ├── owners/
│   └── general-managers/
├── approach/
├── cases/
│   └── [caseSlug]/
├── about/
├── contact/
│   └── thanks/
├── privacy/
└── site-policy/
```

### URL原則

- URLは短い英語slug、画面表示は自然な日本語にする。
- サービス番号、年度、部門内の掲載順をURLへ含めない。
- category slugを含め、breadcrumbとコンテンツ管理上の所属を明確にする。
- slug変更時は恒久redirectを設定し、既存caseや広告リンクを壊さない。
- 日本語は当面prefixなし。将来英語版を追加する場合は `/en/...` を採用し、日本語URLを変更しない。

## 6. Desktop global navigation

### 6.1 Header構成

| 順序 | 親項目 | 挙動 | 説明 |
|---:|---|---|---|
| 1 | 課題から探す | Mega menu | 顧客の役職・困りごとから適切な支援へ案内する第一入口 |
| 2 | 支援内容 | Mega menu | ADELVAの3領域、10支援テーマ、20サービスの体系を案内 |
| 3 | 支援の進め方 | Direct link | 助言で終わらない実装・運用・検証・引継ぎを説明 |
| 4 | 導入事例 | Direct link | 実際の課題、担当範囲、成果、引継ぎを証拠として提示 |
| 5 | ADELVAについて | Compact menu | 役割、支援スタンス、会社情報 |
| CTA | 問い合わせを送信 | Primary button | `/contact`へ遷移 |

情報設計上の優先順位は「顧客の状況 → 支援体系 → ADELVA固有の進め方 → 証拠 → 会社」の順とする。組織構造を先に読ませない。

### 6.2 「課題から探す」mega menu

#### 対象者から探す

| 子メニュー | Link | 説明文 |
|---|---|---|
| オーナー・経営者の方へ | `/challenges/owners` | 経営判断、収益、投資、開業・再建、運営体制から整理する |
| 総支配人・現場責任者の方へ | `/challenges/general-managers` | 現場品質、人材、生産性、販売、システム定着から整理する |

両者は同じ面積、同じvisual weight、同じ階層で表示し、どちらかを従属導線にしない。

#### 困りごとから探す

| 子メニュー | Link | 説明文 |
|---|---|---|
| 経営・収益を改善したい | `/challenges#management-profit` | 経営状態、P&L、優先順位、収益改善を整理する |
| 開業・運営体制を整えたい | `/challenges#opening-operations` | 開業準備、GM機能、全面運営、責任体制を整える |
| 現場品質・人材を改善したい | `/challenges#operations-people` | 宿泊、料飲、清掃、採用、教育、生産性を改善する |
| 集客・ブランドを強くしたい | `/challenges#revenue-brand` | Web、OTA、営業、写真、SNSを収益へつなぐ |
| DX・IT・調達を整えたい | `/challenges#digital-foundation` | システム導入、IT運用、個別開発、調達を整える |
| 課題一覧を見る | `/challenges` | 課題が複数、またはまだ整理できていない方向け |

### 6.3 「支援内容」mega menu

| 子メニュー | Link | 説明文 |
|---|---|---|
| 支援内容一覧 | `/services` | 3支援領域・10支援テーマ・20サービスの全体像を見る |
| 経営・運営統括 | `/services/management-operations` | 経営判断、開業、運営、人材を扱う4支援テーマを見る |
| 収益・ブランド成長 | `/services/revenue-brand` | 集客、販売、制作、SNSを扱う3支援テーマを見る |
| DX・IT・調達基盤 | `/services/dx-it-procurement` | 導入、開発、保守、調達を扱う3支援テーマを見る |
| 横断支援の考え方 | `/approach#integrated-support` | 複数施策を一つの改善計画として進める方法を見る |

各領域カードにはサービス数を補助表示するが、数を価値提案の主役にはしない。

### 6.4 「ADELVAについて」compact menu

| 子メニュー | Link | 説明文 |
|---|---|---|
| ADELVAについて | `/about` | 経営実装パートナーとしての役割を見る |
| 私たちの役割 | `/about#role` | 経営判断を現場で動く仕組みへ変える役割 |
| 支援スタンス | `/about#stance` | 責任分界、運用、検証、引継ぎへの姿勢 |
| 会社概要 | `/about#company` | 法人・所在地・連絡先等の確定情報 |

会社概要の確定原稿がない現状では、架空の情報を置かない。公開前のcontent gateとする。

### 6.5 10支援テーマと20サービスをheader mega menuへ全部載せない理由

1. 4・3・3の支援テーマと、その内訳20サービスを同時表示すると情報密度が高くなる。
2. 初見訪問者に個別サービス名を一度に選ばせると、課題が未整理の人を置き去りにする。
3. Headerの役割は全情報の索引ではなく、次に見るべき情報群を選ばせることである。
4. 10支援テーマは領域ページ、footer、mobile accordionから到達でき、20サービスはサービス一覧、領域ページ、各テーマ本文で確認できる。

desktop footerでは3領域別に10支援テーマをテキストリンクで掲載する。個別サービス名は各領域ページと支援テーマページで提示する。サイト内検索はlaunch時点では不要で、公開ページが概ね60ページを超え、記事や事例が増えた時に再評価する。

### 6.6 Footer構成

Desktop footerは次の4群で構成し、headerでは省略した10支援テーマへの索引を担わせる。

| 群 | 内容 |
|---|---|
| Brand / conversion | ADELVAのcore statement、primary CTA「問い合わせを送信」 |
| 課題から探す | オーナー・経営者の方へ、総支配人・現場責任者の方へ、5つの課題群 |
| 支援内容 | 3領域の見出しと10支援テーマlink。領域A・B・Cを別columnにする |
| 会社・法務 | 支援の進め方、導入事例、ADELVAについて、プライバシーポリシー、サイトポリシー |

2 audienceはfooterでも同じtypographyと階層で並べ、優先差を付けない。Mobile footerは3支援領域をaccordion化するが、課題導線、会社・法務、問い合わせCTAはaccordionの外に置き、見失わせない。

## 7. Mobile navigation

### 構造

- Header: ADELVA logo、短縮CTA「問い合わせ」、menu button。
- Menu open時: full-height drawer。現在ページと背景scrollを分離する。
- 第一階層: 課題から探す、支援内容、支援の進め方、導入事例、ADELVAについて。
- 「課題から探す」は、2 audienceを最初に表示し、その下に5課題群を配置する。
- 「支援内容」は3領域のaccordionにし、各領域を開くと該当する統合支援テーマを表示する。mobileでは段階開示により10テーマへ二操作以内で到達可能にする。
- Drawer末尾にfull-width CTA「問い合わせを送信」を配置する。
- Footerも3領域accordionとし、10支援テーマへの導線を提供する。

### Interaction要件

- Accordion heading自体は領域ページへのlink、隣のbuttonは開閉専用にして役割を混同しない。
- `aria-expanded`、`aria-controls`、現在地表示、focus trap、Escape close、close後のfocus restorationを実装する。
- Tap targetは最低44×44px相当を確保し、hoverへ依存しない。
- 子階層を開いた状態でも「支援内容一覧」「課題一覧」を常に選べるようにする。
- Menu内の情報量が多いため、全accordionの同時自動展開はしない。ユーザーが開いた状態だけを保持する。

## 8. Owner / GMの二つの同格導線

### 8.1 共通ルール

- Homeの最初の探索sectionで、2 audience cardを左右同格に置く。
- 「課題から探す」mega menuでも同じ階層、同じ面積で扱う。
- 双方のlandingから、課題 → 推奨する支援の組み合わせ → 実在事例 → 問い合わせ送信へ進める。
- Owner landingを抽象的なブランドページ、GM landingを単なるサービス一覧にしない。両方に判断材料と成果物を持たせる。
- 両landingは相互linkし、「経営側と現場側で一緒に検討する」横断導線を設ける。

### 8.2 オーナー・経営者landing

確定sequence:

1. 経営判断を実行可能な改善計画へ変える
2. いま、どの経営局面にあるか
3. 最初に決めること
4. 判断に応じた支援の組み合わせ
5. 誰が決め、誰が実行し、何を残すか
6. 経営指標を現場行動へつなぎ、検証・引継ぎまで進める
7. 確認済みの証拠
8. 課題が未整理でも問い合わせを送信できる

構成上の不変条件:

- 2では、経営・収益、開業・再建、GM不在、投資判断の4課題群から現在の局面を自己認識できるようにする。
- 3では、原因・優先順位、運営モデル、投資対象、実行責任者など、支援内容を選ぶ前に整理すべき判断論点を示す。
- 4ではサービス名を列挙せず、判断に応じて複数サービスを組み合わせる理由と、単独支援との違いを示す。
- 5ではOwner・Executive、GM・現場、ADELVA、外部関係者の責任分界、条件付き範囲、成果物を示し、総支配人・現場責任者landingへの文脈付き導線を含める。
- 7では確認済みの担当範囲、成果物、意思決定記録、検証・引継ぎ方法をproofとして扱う。公開許諾済みの実在事例がある場合だけ事例を掲載し、未確認内容で代替しない。
- 8では承認済みCTA「問い合わせを送信」を維持し、問い合わせで確認する内容と送信後の流れを短く予告する。

### 8.3 総支配人・現場責任者landing

確定sequence:

1. 現場課題を継続運用できる仕組みへ変える
2. いま、どの運営状態で詰まっているか
3. 最初に見極めること
4. 判断に応じた支援の組み合わせと、現場に残す成果物
5. 誰が決め、誰が動かし、何を残すか
6. 部門横断で実行し、検証・引継ぎまで定着させる
7. 確認済みの証拠
8. 課題が未整理でも問い合わせを送信できる

構成上の不変条件:

- 2では、品質、人材、生産性、販売、システム定着の5課題群から現在の運営状態を自己認識できるようにする。
- 3では、現象と原因、優先順位、基準値、影響範囲、現場で決められる範囲、Owner・本部判断が必要な範囲を、支援内容を選ぶ前に整理する。
- 4ではサービス名を列挙せず、一部門の改善、部門横断の運用再設計、Owner・本部の意思決定への接続などの判断と支援の組み合わせを対応づける。SOP、KPI、会議、教育、運用設計は支援理由と対応する成果物として示す。
- 5ではOwner・本部、GM・部門責任者、ADELVA、外部関係者の責任分界、条件付き範囲、成果物を示し、オーナー・経営者landingへの文脈付き導線を含める。
- 6では単発の改善施策で終わらせず、実行、運用、検証、引継ぎまでの進め方と、部門間の接続を示す。
- 7では確認済みの担当範囲、成果物、意思決定記録、検証・引継ぎ方法をproofとして扱う。公開許諾済みの実在事例がある場合だけ事例を掲載し、未確認内容で代替しない。
- 8では承認済みCTA「問い合わせを送信」を維持し、問い合わせで確認する内容と送信後の流れを短く予告する。

## 9. Support theme detail template

10ページは同一schemaとlayout familyを使い、含まれるサービス数と内容に応じてsectionを組み替える。最低限、次の順序を持たせる。

1. 支援テーマ名と「どの状態を変える支援か」
2. 対象となる施設・状況
3. よくある課題と見落とし
4. 含まれる各サービスと選択・組み合わせの考え方
5. 各サービスでADELVAが行うこと、行わないこと、条件確認が必要な範囲
6. 主要成果物
7. 進め方と想定フェーズ
8. 顧客、ADELVA、外部パートナーの責任分界
9. KPI・成果検証の考え方
10. 関連事例
11. 一緒に検討される関連テーマ・サービス
12. 問い合わせCTA

「ホテル全面運営受託」「朝食・レストラン実運営」「民泊立上げ・運営」など許認可・契約条件が関係する支援では、提供範囲を断定せず、個別確認事項を明記する。

## 10. Case study pages

### Launch方針

- 事例一覧だけで終わらせず、実在する事例ごとに詳細ページを持つ。
- 初期公開可能な事例は1件のみとする。ADELVAの「横断支援」と「引継ぎ」まで最も証明できる実在事例を優先する。
- 顧客名、施設名、写真、推薦文、数値は掲載許諾を確認したものだけを使う。
- 許諾上匿名にする場合も、「地方旅館」「客室数非公開」等、公開可能な粒度を顧客と合意する。匿名であること自体を曖昧にしない。
- 現時点では詳細データが未提供のため、公開可能性だけを根拠にdummy内容を作らない。route templateは用意しても、詳細データと掲載許諾を確認し、content statusが`published`になるまでsitemap・一覧・静的生成対象へ含めない。

### Case detail schema

1. 施設・事業の背景
2. 支援前の課題と判断状況
3. 目標と成功条件
4. ADELVAの担当範囲・非担当範囲
5. 実施した判断、施策、実装
6. 期間と主要milestone
7. 確認済み成果。数値がない場合は運用状態の変化を具体的に示す
8. 継続運用と引継ぎ
9. 関連サービス
10. 問い合わせCTA

事例1件のlaunch時点ではfilterを設けない。件数が9件以上になった時点で「課題」「施設種別」「支援領域」のfilterを追加する。

## 11. 問い合わせCTAとconversion path

### CTA wording

- Global/header: **問い合わせを送信**
- Mobile header短縮表示: **問い合わせ**
- 文脈型secondary link: **課題が整理できていなくてもお問い合わせいただけます**
- Form submit: **問い合わせを送信**
- Success heading: **お問い合わせを受け付けました**

### `/contact`に必要な内容

1. どのような方・課題が対象か
2. 課題が未整理でも送信できること
3. 問い合わせフォームで確認する内容
4. 返信方法、返信目安、担当窓口。確定情報だけを掲載
5. 入力項目と個人情報の利用目的
6. Formの入力、確認、送信UI
7. 送信後の流れ
8. 送信中、成功、validation、通信失敗、重複送信防止の状態
9. 緊急障害窓口や既存顧客向けsupport窓口と誤認させない注意

### CTA placement

- Headerに常設する。
- Home、audience landing、support theme detail、case detailでは、内容理解前の乱発を避け、hero付近、主要proof後、最終sectionの最大3箇所にする。
- CTA直前には、そのページで得た判断材料を一行で要約する。
- FooterにもCTAを置くが、法務ページでは視覚優先度を下げる。

## 12. Breadcrumbs and internal links

### Breadcrumb規則

- Homeには表示しない。
- Support theme detail: `Home > 支援内容 > 支援領域 > 支援テーマ名`
- Category: `Home > 支援内容 > 支援領域`
- Audience: `Home > 課題から探す > 対象者`
- Case detail: `Home > 導入事例 > 事例名`
- Breadcrumbは視覚表示と`BreadcrumbList` structured dataを一致させる。
- Mobileでは途中階層を消さず、横scrollまたは適切な省略表示で現在地を維持する。

### Internal link規則

| 起点 | 必ずlinkする先 |
|---|---|
| Home | 2 audience、3領域、approach、代表事例、contact |
| Challenge / audience | 推奨サービスとその理由、関連事例、approach、contact |
| Service category | すべての配下支援テーマとサービス、関連する別領域、関連事例、contact |
| Support theme detail | 含まれるサービス、関連テーマ、対象challenge、関連事例、approach、contact |
| Approach | 3領域、横断事例、contact |
| Case detail | 実際に使ったサービス、同種challenge、contact |
| About | approach、cases、contact |

関連サービスは同一領域だけで自動選定しない。ADELVAの横断価値を示すため、実際に連動する別領域を少なくとも1件含める。例として「客室清掃改善」から「採用支援」「DX・システム導入」へつなぐ。ただし関係のないcross-linkをSEO目的で量産しない。

## 13. Image-first制作に必要なpage template数

Integrated Balanced案の26 URLを、次の13 templateへ集約する。

| # | Template | 適用ページ数 | Image-first master mock |
|---:|---|---:|---|
| 1 | Home | 1 | 必須 |
| 2 | Services index | 1 | 必須 |
| 3 | Service category | 3 | 1種類をmasterとして設計 |
| 4 | Support theme detail | 10 | 1種類をmaster、1〜4サービスのcontent rangeも確認 |
| 5 | Challenges index | 1 | 必須 |
| 6 | Audience landing | 2 | 共通骨格。Owner/GMの両variantを確認 |
| 7 | Approach | 1 | 必須 |
| 8 | Cases index | 1 | 必須 |
| 9 | Case detail | 1 | 1種類をmaster、将来の追加にも対応 |
| 10 | About | 1 | 必須 |
| 11 | Contact | 1 | 必須 |
| 12 | Legal | 2 | UI systemから実装。専用縦長mockは不要 |
| 13 | Thank-you | 1 | UI systemから実装。専用縦長mockは不要 |

したがって、imagegenで独立したvisual directionを作る対象は11ページ型でよい。Category、support theme detail、audience、case detailは、1つのmasterだけでなく次のcontent stress testを行う。

- 最短・標準・最長の日本語見出し
- 事例1件の単独表示と、将来複数件になった時のcard密度
- 写真あり・写真なしの事例
- desktop 1440×900、tablet 768×1024、mobile 390×844
- Header mega menu open、mobile drawer open、accordion expanded

## 14. 将来拡張

### Phase 2で追加候補

- `/challenges/[challengeSlug]`: 検索需要と十分な独自原稿が確認できた課題だけ個別化
- `/insights` と `/insights/[articleSlug]`: 継続的に一次知見を公開できる編集体制ができた時だけ追加
- `/about/team`: 公開可能な経歴、写真、役割が揃った時に分離
- `/about/company`: Aboutが過密になり、会社概要の独立需要が生じた時に分離
- `/en/...`: 翻訳ではなく英語圏向けの提供範囲とconversion方法が決まった時に追加
- Case filter/search: 事例9件以上を目安に追加
- CMS: 非技術者更新、高頻度更新、承認、日時指定公開の需要が実証された時に追加

### 拡張時の原則

- 薄い都道府県別ページや、ほぼ同一内容の課題ページをSEO目的で量産しない。
- 既存サービスslugは維持し、カテゴリ変更時もredirectとcanonicalを設計する。
- typed content schemaに`locale`、`status`、`relatedServiceIds`、`relatedCaseIds`、`audience`、`challengeIds`を持てる境界を保つ。
- Navigationは項目を増やし続けず、記事や事例は各indexへ集約する。

## 15. 公開前に確定が必要なcontent

以下はIAでは位置を確保できるが、現時点で事実を作れないため公開前のowner inputが必要である。

1. 会社概要、代表者、所在地、法人情報、連絡先
2. 問い合わせフォームの入力項目、送信先、返信方法、返信目安、保存期間
3. 公開可能な事例1件の詳細内容、掲載許諾、写真、検証可能な成果
4. 20サービスそれぞれの対象、成果物、非対応範囲、責任分界、標準的な進め方、および10支援テーマ内での違い
5. フォームのspam対策、障害時対応、送信ログの扱い、privacy記載

## 16. 確定内容

- Launch pages: **26ページ**（公開事例1件を含む）。一般式は`25 + N`。
- Page templates: **13種類**。うちimage-first master mockは**11種類**。
- Global nav: **課題から探す / 支援内容 / 支援の進め方 / 導入事例 / ADELVAについて / 問い合わせCTA**。
- 20サービス: **提供内容taxonomyとして全件を維持し、10の統合支援テーマページ内で個別の責任範囲を説明する**。
- Audience: OwnerとGMを同格の専用landingで扱う。
- Cases: 公開可能な1件だけを扱い、詳細データと掲載許諾の確認前にdummy caseを出さない。
- Conversion: `/contact`へ統一し、primary CTAとform submitを「問い合わせを送信」に揃える。
- Future: 課題詳細、知見、team、多言語、CMSは実データと運用需要が揃ってから追加する。
