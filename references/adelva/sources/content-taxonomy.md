# ADELVA Content Taxonomy and Service Content Model

作成日: 2026-08-12  
状態: 情報設計確定（公開コピー確定前）  
承認日: 2026-08-12

## 1. 目的

ADELVAの3支援領域・20サービスを、次の二つを同時に満たす情報体系へ整理する。

1. ADELVA側の支援体制と責任範囲を正確に示す。
2. サービス名を知らない訪問者でも、自分の役職・課題・検討段階から適切な支援へ到達できるようにする。

本書は、ナビゲーション、サービスページ群、課題別導線、typed content schemaの基礎となる分類案である。

## 2. Source of truthと分析上の制約

根拠は次の提供済み情報だけに限定した。

- ユーザー提供の「ADELVA｜事業内容・サービス一覧」原稿
- `PRODUCT.md` のUsers、Purpose、Positioning、Operating Context、Constraints、Brand Commitments
- `.Codex/docs/DESIGN.md` の「20サービスを提供内容taxonomyとして維持し、公開routeは支援テーマ単位で生成する」決定

以下は未提供であり、本書では事実として扱わない。

- 支援期間、価格、契約形態、対応地域、対応施設規模
- 個別サービスの具体的成果物、KPI、実績値、事例、顧客名
- 許認可、資格、提携先、SLA、撮影や制作の実施主体
- SEO keyword volumeや競合難易度

したがって、本書のSEO評価は検索需要の実測値ではなく、**検索意図が他サービスから独立しているか**の定性評価である。公開前にSearch Console等の実データまたはkeyword researchで再検証する。

## 3. 結論

### 3.1 採用するtaxonomy

サービスの正式な主分類は、提供原稿どおり次の3領域・20サービスを維持する。

1. 経営・運営統括: 11サービス
2. 収益・ブランド成長: 5サービス
3. DX・IT・調達基盤: 4サービス

ただし、これを唯一の探索手段にはしない。各サービスへ次の三つの横断taxonomyを付与する。

- audience: `owner` / `executive` / `gm` / `department-lead`
- challenge: 顧客が認識している課題
- consideration stage: 課題認識 / 解決方針比較 / 支援先選定 / 継続・拡張

同じ内容を役職別・課題別に複製して別ページ化せず、一つのcanonical service entityを複数の入口から参照する。これにより、内容の食い違い、薄い重複ページ、更新漏れを防ぐ。

### 3.2 20サービスを維持し、公開ページを10テーマへ統合する理由

似て見えるサービスにも、助言、実行支援、実運営、導入、保守、個別開発という責任差がある。ADELVAの価値は「責任分界と引継ぎまで明確にすること」であるため、一覧上で近接配置してもservice entity自体は統合しない。

20サービスは提供内容、責任範囲、関連性を管理するcanonical entityとして維持する。一方、現時点の公開情報量では1サービス1ページにすると薄いページが生じるため、訪問者の相談・判断単位に合わせた10のsupport themeへ統合する。共通のsupport theme detail templateを1種類設計し、typed contentから10ページを生成する。

統合ページ内では、元サービスを単なる箇条書きにせず、対象、含む範囲、条件付き範囲、非対応範囲、顧客・ADELVA・第三者の責任、相互の違いを個別に保持する。十分な独自copy、事例、検索需要が将来揃った場合に限り、service entityを独立routeへ昇格できる境界を残す。

### 3.3 公開gate

routeを実装することと、index可能な公開ページにすることは分ける。各support theme detail pageは、含まれる全serviceについて少なくとも次が確定するまで公開完了扱いにしない。

- 対象顧客と対象外
- 相談される課題
- ADELVAが行うこと
- 顧客側が行うこと
- 条件付きまたは個別確認となる範囲
- 支援の流れ
- 成果物または完了状態
- 関連サービスとの違い
- 根拠として掲載できる事例または説明

現行原稿はservice summaryとしては十分だが、10のsupport theme pageで責任範囲を説明するには不足している。未確定項目を推測で埋めてはならない。

## 4. 評価基準

### 4.1 Audience

- Owner: 所有者、投資主体。投資判断、経営責任、委託範囲を重視する。
- Executive: 経営者、事業責任者、本部責任者。P&L、優先順位、全体最適を重視する。
- GM: 総支配人、支配人。施設横断の実行、部門統括、運営定着を重視する。
- Department lead: 宿泊、料飲、清掃、人事、販売、マーケティング、IT、調達等の部門責任者。具体業務と成果物を重視する。

表中ではPをprimary、Sをsecondaryとする。これは閲覧可能性の制限ではなく、ページ冒頭で最初に答えるべき意思決定者を表す。

### 4.2 Consideration stage

- P1 課題認識: 症状はあるが、原因や依頼すべきサービスが未整理。
- P2 解決方針比較: 内製、部分支援、運営委託、既製システム、個別開発等を比較。
- P3 支援先選定: 具体的な担当範囲、進め方、条件、成果物を確認。
- P4 継続・拡張: 既存施策の運用、改善、保守、別領域への展開を検討。

### 4.3 Standalone detail page value

- SEO: 検索意図の独立性。検索volumeではない。
- Sales: 商談前の判断材料を個別に提示する必要性。
- Scope: 責任範囲、契約、許認可、実施主体等の誤解を防ぐ必要性。
- H / M / L: 高 / 中 / 低。

## 5. 全20サービス評価

### A. 経営・運営統括

| ID / 現行名 | Audience | 顧客課題 | 主検討段階 | 隣接・束ねるべきサービス | Detail page value |
|---|---|---|---|---|---|
| 01 経営診断・コンサル | P: Owner / Executive、S: GM | 問題が複数部門にまたがり、原因、優先順位、改善方針を決められない | P1 | 02を自然なfollow-onとし、診断結果に応じて06、07、09、10、12、17へ接続 | SEO H / Sales H / Scope H。診断だけで終わるのか、実行へどうつながるかを説明する価値が高い |
| 02 経営改善・実行支援 | P: Executive / GM、S: Owner | 課題は見えているが、担当者、期限、KPI、成果物が曖昧で実行が進まない | P2〜P3 | 01を入口、個別実装サービスをexecution moduleとして束ねる | SEO M / Sales H / Scope H。01との差と、ADELVAがどこまで推進するかの説明が必要 |
| 03 新規開業支援 | P: Owner / Executive、S: GM | 開業準備が組織、人材、業務、販売、システム、ブランドごとに分断される | P1〜P3 | 10、12、13、14、17、20。運営設計に応じて06〜09 | SEO H / Sales H / Scope H。横断性と開業時点までの責任分界が重要 |
| 04 週2〜3日型総支配人 | P: Owner / Executive、S: GM | 常勤GMを置けない、GM不在、移行期に経営と現場を統括する機能が足りない | P2〜P3 | 01、02、06〜10、12、17。05とはalternativeになり得る | SEO M / Sales H / Scope H。権限、勤務形態、報告先、代行範囲の誤解防止が必須 |
| 05 ホテル全面運営受託 | P: Owner / Executive | 施設運営全体を包括的に任せたいが、契約、許認可、責任体制を整理する必要がある | P2〜P3 | 01、02を前提確認に置き、06〜10、12、17、18を包含し得る。04とは範囲比較 | SEO M / Sales H / Scope H。最も責任境界リスクが高く、独立説明が必須 |
| 06 宿泊部門運営支援 | P: GM / Department lead、S: Executive | フロント、予約、ゲストサービスの品質、生産性、組織、教育、SOP、KPIを改善したい | P1〜P3 | 02、04、09、10、17 | SEO M / Sales H / Scope H。宿泊部門と清掃、販売、全面運営の境界を示す必要がある |
| 07 レストラン運営改善 | P: GM / Department lead、S: Executive | 商品、サービス品質、原価、人員配置、業務フロー、収益性が連動していない | P1〜P3 | 02、08、10、12、20 | SEO H / Sales H / Scope H。改善支援と実運営の違いを説明する必要がある |
| 08 朝食・レストラン実運営 | P: Owner / Executive / GM、S: Department lead | 料飲運営を実際に担う体制が必要で、衛生、許認可、責任体制も整理したい | P2〜P3 | 07を改善・設計、08を実運営として対比。10、20も関連 | SEO M / Sales H / Scope H。許認可、衛生、雇用・指揮命令、実施主体の確認が不可欠 |
| 09 客室清掃改善 | P: GM / Department lead、S: Executive | 清掃品質、作業手順、人員配置、生産性、検品、教育、委託管理にばらつきがある | P1〜P3 | 02、06、10、17 | SEO H / Sales H / Scope H。改善支援と清掃業務の受託可否を混同させない必要がある |
| 10 採用支援 | P: Executive / GM、S: Department lead | 必要人員、採用要件、求人導線、選考、入社後教育が一続きになっていない | P1〜P3 | 03〜09、11。各運営サービスのpeople workstreamとして束ねる | SEO H / Sales M / Scope H。求人広告、候補者紹介、選考代行等の実施範囲を明記する必要がある |
| 11 民泊立上げ・運営 | P: Owner / Executive、S: GM | 民泊・宿泊事業を始めたいが、制度、許認可、施設、販売、業務、システムを横断できない | P1〜P3 | 03、12、13、17、18、20 | SEO H / Sales H / Scope H。03との違いと、制度・許認可を個別確認する姿勢の説明が重要 |

### B. 収益・ブランド成長

| ID / 現行名 | Audience | 顧客課題 | 主検討段階 | 隣接・束ねるべきサービス | Detail page value |
|---|---|---|---|---|---|
| 12 Web集客・チャネル収益 | P: Executive / GM / Department lead | 公式サイト、OTA、検索、コンテンツ、販売チャネル、計測が分断され、宿泊収益につながらない | P1〜P4 | 13〜16をexecution optionsとして束ね、17とも連携 | SEO H / Sales H / Scope M。戦略・分析と各チャネルの実作業範囲を区別する必要がある |
| 13 Website制作 | P: Executive / Department lead、S: Owner / GM | サイトが事業目的、ブランド、顧客導線、SEO、運用につながっていない | P2〜P3 | 12、14、15、18、必要なら19 | SEO H / Sales H / Scope H。一般事業者も対象となる唯一の明示的例外で、対象と保守範囲を説明する価値が高い |
| 14 Photoブランディング | P: Executive / Department lead、S: GM | 施設、客室、料理、スタッフ等の写真表現がブランド・販売戦略と一貫していない | P2〜P3 | 12、13、15、16 | SEO M / Sales M / Scope H。撮影、企画、art direction、権利処理のどこまでを担うかが現原稿では未確定 |
| 15 SNS運用代行 | P: Department lead / GM、S: Executive | ブランド方針、企画、投稿、分析、改善を継続できず、Webや予約導線ともつながらない | P2〜P4 | 12、13、14 | SEO H / Sales M / Scope H。対象SNS、投稿制作、承認、返信、広告、危機対応の境界が必要 |
| 16 宿泊営業支援 | P: Executive / GM / Department lead | 法人、旅行会社、団体、地域企業向けのターゲット、商品、資料、プロセス、案件管理が未整備 | P1〜P4 | 12を収益全体、16をhuman salesとして対比。14も営業素材として関連 | SEO M / Sales H / Scope H。紹介、営業代行、資料整備、案件管理のどこまでかを示す必要がある |

### C. DX・IT・調達基盤

| ID / 現行名 | Audience | 顧客課題 | 主検討段階 | 隣接・束ねるべきサービス | Detail page value |
|---|---|---|---|---|---|
| 17 DX・システム導入 | P: Executive / GM / Department lead | 経営・業務課題に対して、PMS、POS、予約、CRM、業務管理等の選定、連携、定着が進まない | P1〜P4 | 01、02、06、07、09、12。18を運用、19をalternativeとして接続 | SEO H / Sales H / Scope H。製品選定・導入・連携・定着の範囲とvendor中立性を説明する必要がある |
| 18 IT運用・保守 | P: GM / Department lead、S: Executive | Web、システム、cloud、accountの監視、更新、障害、変更、権限、文書化、引継ぎが属人化している | P3〜P4 | 13、17、19 | SEO H / Sales H / Scope H。受付時間、監視対象、障害対応、SLA、third party責任の誤解防止が必須 |
| 19 個別ITシステム開発 | P: Executive / Department lead、S: GM | 既存serviceでは業務要件を満たせず、要件定義から運用・引継ぎまで一貫した開発先が必要 | P2〜P4 | 17をpackage導入、19をcustom buildとして対比。18を運用に接続 | SEO H / Sales H / Scope H。知的財産、data、security、保守、引継ぎの条件を明確にする必要がある |
| 20 アメニティ調達支援 | P: GM / Department lead、S: Owner / Executive | コンセプト、ブランド、品質、cost、運用条件を同時に満たす商材を選定・調達できない | P2〜P4 | 03、08、11。brandとの整合では14も関連 | SEO M / Sales H / Scope H。販売、代理調達、紹介、選定支援の実施主体と品質・在庫責任を明記する必要がある |

## 6. 重複・誤解リスクと境界線

### 6.1 必ず比較説明を置く組み合わせ

| 組み合わせ | 誤解リスク | ページ上で明示すべき境界 |
|---|---|---|
| 01 経営診断 / 02 経営改善・実行支援 | どちらも経営コンサルに見える | 01は現状把握・原因・優先順位・方針、02は担当・期限・KPI・成果物を伴う実行推進。連続契約が必須かは未確認 |
| 03 新規開業 / 11 民泊立上げ・運営 | どちらも宿泊事業立上げに見える | 11は民泊という制度・運営形態を明示した専門入口。対象制度、許認可、施設種別は個別確認 |
| 04 週2〜3日型GM / 05 全面運営受託 | 経営・運営を任せるサービスとして混同 | 04はGM機能の個別設計、05は施設運営全体の包括支援。意思決定権、指揮命令、雇用、許認可、報告責任を分ける |
| 06 宿泊部門 / 09 客室清掃 | 清掃が宿泊部門に含まれるように見える | 06の中心はフロント、予約、ゲストservice。09は清掃品質・工程・検品・委託管理 |
| 07 レストラン改善 / 08 朝食・レストラン実運営 | consultingと運営受託が混同 | 07は改善、08は実運営を含む個別設計。衛生、許認可、実施主体を08で明示 |
| 12 Web集客 / 13 Website制作 | どちらもWeb支援に見える | 12は集客・販売channel・計測を宿泊収益へつなぐ支援、13はWeb propertyの企画・設計・制作 |
| 12 Web集客 / 15 SNS運用 | SNSが集客支援に包含されるように見える | 12は収益・channel全体、15はSNSの企画・投稿・分析・改善の継続運用 |
| 13 Website制作 / 18 IT運用・保守 | 制作後の保守が自動付帯すると受け取られる | buildとongoing operationsを別entity・別範囲として提示 |
| 13 Website制作 / 19 個別IT開発 | 一般Web制作と業務system開発が混同 | 公開Web experienceと、業務要件に基づくcustom systemを分ける |
| 17 システム導入 / 19 個別開発 | どちらもシステム構築に見える | 17は選定・導入・連携・定着、19は既製serviceで満たせない要件へのcustom build |
| 14 Photo branding / 15 SNS運用 | 写真制作と投稿運用の責任が曖昧 | visual expressionの設計・asset準備と、channel上の継続運用を分ける |

### 6.2 法務・契約上の誤解を招きやすい表現

提供可否や法的評価を本書で断定はしないが、次の語は公開前に責任範囲の確認が必要である。

- 「経営」: 最終意思決定権をADELVAが持つと読まれないよう、助言、実行推進、受託運営の別を示す。
- 「全面運営受託」「実運営」: 契約主体、許認可主体、雇用・指揮命令、衛生、事故・苦情対応を個別に示す。
- 「総支配人」: 権限、稼働、報告先、P&L責任、部門への指揮命令を示す。「週2〜3日」が固定条件か例示かは未確認。
- 「採用支援」: 求人設計支援、媒体運用、候補者紹介、職業紹介、選考代行等の実施範囲を確認する。
- 「民泊」: 適用制度、許認可取得主体、行政手続の支援範囲を確認する。
- 「Photoブランディング」: 撮影、art direction、制作、model/property release、asset利用権を確認する。
- 「SNS運用代行」: comment/DM対応、広告運用、投稿承認、account権限、incident対応を確認する。
- 「IT運用・保守」: monitoring、support hours、response、復旧保証、対象vendor、data handlingを確認する。
- 「個別ITシステム開発」: intellectual property、source ownership、hosting、security、data portability、保守、引継ぎを確認する。
- 「調達支援」: ADELVAが販売者、代理人、紹介者、選定支援者のどれに当たるか、在庫、納期、品質責任を確認する。

## 7. 命名改善案

原稿上の正式名はsource of truthとして保存し、UIでは読みやすいdisplay nameを別fieldで管理する。法務・営業確認前に名称を置換せず、以下を候補として検証する。

| 現行名 | 推奨display name候補 | 理由 / 注意 |
|---|---|---|
| 週2〜3日型総支配人 | 非常勤型総支配人支援 | 課題名として理解しやすい。「週2〜3日」はsubtitleで具体性を残す。固定提供条件なら現行名を維持 |
| ホテル全面運営受託 | ホテル運営受託（個別設計） | 「全面」が無条件の包括責任に見えるリスクを抑える。ただし提供価値を弱めるため営業確認が必要 |
| 朝食・レストラン実運営 | 朝食・レストラン運営受託 | 改善支援との差を一語で伝えやすい。契約形態が受託でない場合は使用不可 |
| 民泊立上げ・運営 | 民泊事業の立ち上げ・運営支援 | 日本語表記を整え、事業全体の支援であることを示す |
| Web集客・チャネル収益 | Web集客・販売チャネル収益改善 | 「何をするか」を明確にする。OTA運用を含むかは本文で確認 |
| Website制作 | Webサイト制作 | 日本語UI内の表記を統一する |
| Photoブランディング | 写真・ビジュアルブランディング | 写真撮影だけと誤認されにくい。visual全般を実際に扱うか確認が必要 |
| SNS運用代行 | SNS運用支援・代行 | 方針・分析・改善も含む原稿と整合しやすい。代行範囲の明記が必要 |
| DX・システム導入 | DX設計・システム導入支援 | 「DX」だけの抽象性を下げる。DX設計が実提供範囲か確認が必要 |
| 個別ITシステム開発 | 業務システム個別開発 | 宿泊業務の課題解決という文脈が明確になる。consumer-facing appも扱うなら狭すぎる |

命名ルールは次で統一する。

- 名詞だけで終わる曖昧な名称より、「対象 + 行為」を優先する。
- 「支援」「代行」「受託」「開発」「保守」を責任レベルに応じて使い分ける。
- 英語と日本語の混在はbrand用語を除き最小化する。
- service IDは名称変更後も固定し、URL slugも頻繁に変更しない。

## 8. 推奨challenge taxonomy

訪問者がservice nameを知らない前提で、サービスhubでは次の8課題から探せるようにする。初期は独立SEO pageを量産せず、hub内のfilterまたはcurated sectionとして実装する。

| Challenge | 主に接続するservices |
|---|---|
| 経営課題と優先順位を整理したい | 01、02 |
| 開業・新規事業を進めたい | 03、11、10、12、13、17、20 |
| GM不在・運営体制を整えたい | 04、05、06、07、08、09 |
| 現場品質・生産性を改善したい | 02、06、07、09、17 |
| 採用・組織・教育を改善したい | 04、06、07、09、10 |
| 売上・販売・ブランドを伸ばしたい | 12、13、14、15、16 |
| DX・システム・IT運用を整えたい | 17、18、19 |
| 調達・運営商材を見直したい | 20、03、08、11 |

challengeはservice categoryを置き換えない。例えば「新規開業」は経営・運営、採用、販売、Web、system、調達を横断するため、複数serviceを一つの改善計画へつなぐ入口として使う。

## 9. 推奨route taxonomy

### 9.1 Canonical support theme routes

```text
/services
  /management-operations
    /management-improvement
    /opening-operations
    /operations-improvement
    /people-recruitment
  /revenue-brand
    /acquisition-sales
    /web-visual-production
    /social-media-operations
  /digital-it-procurement
    /system-delivery
    /it-operations-maintenance
    /amenity-procurement
```

Service offering entityのIDはsupport theme routeに依存させない。将来、十分な情報と検索需要が揃ったserviceを独立routeへ昇格する場合も、既存support theme URLは維持し、内容の重複を避けて内部リンクとcanonicalを設計する。

### 9.2 Support theme mapping

| Category | Support theme | Service IDs |
|---|---|---|
| 経営・運営統括 | 経営診断・改善 | 01、02 |
| 経営・運営統括 | 開業・運営体制 | 03、04、05、11 |
| 経営・運営統括 | 現場運営改善 | 06、07、08、09 |
| 経営・運営統括 | 人材・採用 | 10 |
| 収益・ブランド成長 | 集客・販売チャネル支援 | 12、16 |
| 収益・ブランド成長 | Webサイト・ビジュアル制作 | 13、14 |
| 収益・ブランド成長 | SNS運用支援 | 15 |
| DX・IT・調達基盤 | DX・システム導入・個別開発 | 17、19 |
| DX・IT・調達基盤 | IT運用・保守 | 18 |
| DX・IT・調達基盤 | アメニティ調達支援 | 20 |

### 9.3 推奨ページ・テンプレート数

service体系だけで論理ページは14ページとなる。

- service hub: 1
- category landing: 3
- support theme detail: 10

ただし必要なlayout archetypeは3種類である。

- service hub template
- category landing template
- support theme detail template

課題別、役職別、検討段階別は、この14ページへの導線として構成し、初期から重複detail pageを追加しない。十分な独自copy、事例、検索需要が確認できたchallengeまたはserviceだけを後から独立page化する。

## 10. 推奨content model

### 10.1 Category entity

```ts
type ServiceCategory = {
  id: "management-operations" | "revenue-brand" | "digital-it-procurement";
  label: string;
  summary: string;
  supportThemeIds: SupportThemeId[];
};
```

### 10.2 Support theme entity

```ts
type SupportTheme = {
  id: SupportThemeId;
  slug: string;
  categoryId: ServiceCategory["id"];
  label: string;
  summary: string;
  serviceIds: ServiceId[];
};
```

### 10.3 Service entity

```ts
type Service = {
  id: ServiceId;
  number: number;
  slug: string;
  categoryId: ServiceCategory["id"];
  supportThemeId: SupportThemeId;

  sourceName: string;
  displayName: string;
  shortName: string;
  summary: string;
  coreStatement: string;

  primaryAudiences: AudienceId[];
  secondaryAudiences: AudienceId[];
  challengeIds: ChallengeId[];
  considerationStages: ConsiderationStageId[];

  customerProblems: string[];
  intendedOutcomes: string[];
  includedScope: string[];
  conditionalScope: string[];
  excludedScope: string[];
  clientResponsibilities: string[];
  adelvaResponsibilities: string[];
  thirdPartyResponsibilities: string[];
  prerequisites: string[];
  complianceNotes: string[];

  process: ProcessStep[];
  deliverables: Deliverable[];
  kpiCandidates: string[];
  handover: string[];

  relationships: ServiceRelationship[];
  caseStudyIds: string[];
  faq: FaqItem[];

  seo: {
    title: string;
    description: string;
    searchIntent: string;
    indexable: boolean;
  };
  cta: {
    label: string;
    note: string;
  };

  evidenceStatus: "source-only" | "reviewed" | "publishable";
  reviewedBy: string | null;
  reviewedAt: string | null;
};
```

### 10.4 Relationship model

`relatedServiceIds`という無方向の配列だけでは、01と02、07と08、17と19の意味差が失われる。関係の種類を持たせる。

```ts
type ServiceRelationship = {
  serviceId: ServiceId;
  type: "prerequisite" | "follow-on" | "complement" | "alternative" | "included-in";
  rationale: string;
};
```

### 10.5 Scopeの空欄を許容する

未提供情報を埋めるためにgeneric copyを生成してはならない。未確定fieldは空配列または`null`にし、`evidenceStatus`と公開gateで検知する。特に価格、期間、成果保証、許認可、SLA、対応地域を推測しない。

## 11. Support theme detail templateの情報順序

経営者と現場責任者を同格に扱いながら、情報量を段階化する。

1. Support theme name、1文の役割、該当する課題
2. 「このような状況に」: audience別の具体的課題
3. 含まれるservice offeringと、選択・組み合わせの考え方
4. 各serviceの「ADELVAが行うこと」: included / conditional / excluded scope
5. 支援後に目指す状態: 数値を捏造せず、運用状態で記述
6. 支援の流れ: 全社共通の「課題把握 → 判断 → 実行・実装 → 運用 → 検証 → 引継ぎ」とservice固有工程
7. 責任分界: ADELVA / 顧客 / third party
8. 成果物・KPI候補: 実提供内容を確認後に掲載
9. 同一theme内のservice間、および関連themeとの違い
10. 実在するcase study
11. FAQ
12. 初回面談CTA。「課題が未整理でも相談可能」というproduct requirementを反映

## 12. Content collection priority

10のsupport theme page制作前に、全20 service offeringについて同じquestionnaireで次を確認する。

1. 典型的な相談状況を3件以内
2. 対象施設・意思決定者・対象外
3. ADELVAが必ず行うこと、条件付きで行うこと、行わないこと
4. 顧客と外部partnerの責任
5. 支援開始条件、完了状態、引継ぎ内容
6. 標準的な成果物と確認方法
7. 関連serviceとの違い
8. 契約・許認可・data・権利上の注意
9. 公開許諾済みcase evidence

優先確認順は、誤解時の影響が大きい05、08、04、10、11、18、19、20、14、15を先とする。その後、主要導線となる01、02、03、12、13、17を整え、残る部門別serviceを完成させる。

## 13. 採用判断の要約

- 正式service taxonomyは3領域・20serviceを維持する。
- 全20serviceをcanonical entityとして維持し、10のsupport theme detail routeへ割り当てる。
- 訪問者向けには役職、8課題、4検討段階を横断taxonomyとして付与する。
- 関連するserviceは公開ページを統合し、ページ内の比較と責任分界によって違いを明示する。
- Service offeringの独立route化は、十分な独自copy、事例、検索需要が揃った場合に再評価する。
- challenge pageやaudience pageを初期から量産せず、独自copy、case evidence、検索需要が揃ったものだけ後から独立させる。
- 現行原稿にない価格、期間、成果、許認可、SLA、実施主体は生成せず、content modelの公開gateで管理する。
