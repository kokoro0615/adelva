# ADELVA HOME copy v1

- Status: approved source-derived copy
- Approved method: 2026-08-12 user selection — derive from existing authoritative repository sources only
- Authoritative inputs: `PRODUCT.md`, approved information architecture, `.Codex/docs/DESIGN.md`, and the existing foundation copy
- Rule: do not introduce prices, outcomes, customers, statistics, qualifications, response times, or service scope not present in those sources
- Generated mock text has no authority

## Global navigation

| Role | Visible label | Destination |
| --- | --- | --- |
| Skip link | 本文へ移動 | `#main-content` |
| Brand | ADELVA | `/` |
| Primary navigation | 課題から探す | `/challenges` |
| Primary navigation | 支援内容 | `/services` |
| Primary navigation | 支援の進め方 | `/approach` |
| Primary navigation | 導入事例 | `/cases` |
| Primary navigation | ADELVAについて | `/about` |
| Primary CTA | 問い合わせを送信 | `/contact` |
| Mobile CTA | 問い合わせ | `/contact` |

The desktop challenge and service items expose the approved IA groups in mega menus. The mobile menu exposes the same destinations through progressively disclosed groups. Labels must not be shortened in a way that changes their meaning.

## 1. HERO

- Eyebrow: `HOSPITALITY MANAGEMENT PARTNER`
- H1: `経営判断を、現場で動く仕組みと成果へ。`
- Body: `ADELVAは、ホテル・旅館の経営、現場運営、収益成長、ブランド、DX・ITを一つの改善計画につなぐ経営実装パートナーです。`
- CTA: `問い合わせを送信`
- Scroll cue: `SCROLL`

## 2. Audience selector

### Owner / executive

- Visible title: `オーナー・経営者の方へ`
- Accessible description: `経営判断、収益、投資、開業・再建、運営体制から支援を探す`
- Destination: `/challenges/owners`

### General manager / operations leader

- Visible title: `総支配人・現場責任者の方へ`
- Accessible description: `現場品質、人材、生産性、販売、システム定着から支援を探す`
- Destination: `/challenges/general-managers`

The two audiences have identical semantic and visual priority.

## 3. Challenge navigator

- H2: `課題から探す`

| Label | Destination | Description |
| --- | --- | --- |
| 経営・収益を改善したい | `/challenges#management-profit` | 経営状態、P&L、優先順位、収益改善を整理する |
| 開業・運営体制を整えたい | `/challenges#opening-operations` | 開業準備、GM機能、全面運営、責任体制を整える |
| 現場品質・人材を改善したい | `/challenges#operations-people` | 宿泊、料飲、清掃、採用、教育、生産性を改善する |
| 集客・ブランドを強くしたい | `/challenges#revenue-brand` | Web、OTA、営業、写真、SNSを収益へつなぐ |
| DX・IT・調達を整えたい | `/challenges#digital-foundation` | システム導入、IT運用、個別開発、調達を整える |

## 4. Three support domains

- H2: `3つの支援領域`

| Number | H3 | Description | Destination |
| --- | --- | --- | --- |
| 01 | 経営・運営統括 | 経営判断、開業、運営、人材、現場オペレーションを横断して支援します。 | `/services/management-operations` |
| 02 | 収益・ブランド成長 | 販売、Web集客、ブランド、SNS、営業を宿泊収益の向上へつなげます。 | `/services/revenue-brand` |
| 03 | DX・IT・調達基盤 | 事業運営を支えるデジタル、システム、IT運用、調達基盤を整備します。 | `/services/dx-it-procurement` |

## 5. Approach

- Eyebrow/H2: `支援の進め方`
- Lead: `課題把握から、判断、実行・実装、運用、検証、引継ぎまで。`
- Body: `分析や助言で終わらず、責任分界とKPIを明確にし、支援終了後もお客様自身が継続して改善できる状態をつくります。`
- Stages: `課題把握 / 判断 / 実行・実装 / 運用 / 検証 / 引継ぎ`
- Link: `支援の進め方を見る`
- Destination: `/approach`

## 6. Case study

- H2: `導入事例`
- Gated state: visible temporary notice is omitted by the user's explicit 2026-08-12 instruction. The decorative pending state must not imply a real client, result, facility, or publication permission.
- Future link label after publishable data exists: `導入事例を見る`
- Destination: `/cases`

Release rule: do not display a client name, facility type, evidentiary image, quotation, result, metric, duration, or case summary until the content and publication rights are verified. Removing the temporary notice does not remove this release blocker and does not authorize invented evidence.

## 7. Contact and footer

- H2: `課題が整理できていなくても、お問い合わせいただけます。`
- CTA: `問い合わせを送信`
- Destination: `/contact`

Footer group labels:

- `課題から探す`
- `支援内容`
- `支援の進め方`
- `導入事例`
- `ADELVAについて`
- `プライバシーポリシー`
- `サイトポリシー`

Copyright: `© ADELVA`

## Copy stress and fallback rules

- Japanese text must remain selectable semantic HTML.
- Do not force desktop line breaks onto tablet or mobile.
- At 200% zoom, content may reflow and sections may grow vertically.
- The CTA wording remains `問い合わせを送信` except for the approved mobile-header abbreviation `問い合わせ`.
- Missing case content produces a silent decorative gated state, never invented placeholder evidence.
