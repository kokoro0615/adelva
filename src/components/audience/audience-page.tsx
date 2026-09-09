import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { HomeFooter } from "@/components/home/home-footer";
import { AudienceMotion } from "./audience-motion";
import styles from "./audience.module.css";

export type Audience = "owner" | "general-managers";
const media = "/media/adelva/audience-v4/";
const photos = {
  ownerHero: "exterior.webp",
  ownerDecision: "corridor.webp",
  ownerExecution: "lounge.webp",
  gmHero: "lobby.webp",
  gmHeroMobile: "lobby-mobile.webp",
  gmDecision: "corridor.webp",
  gmDining: "dining.webp",
  gmExecution: "bedroom.webp",
};

const ownerIssues = [
  ["経営・収益", "原因と優先順位を整理する"],
  ["開業・再建", "運営体制を整える"],
  ["GM不在", "GM機能と権限を整理する"],
  ["投資判断", "投資対象と実行条件を見極める"],
];
const gmIssues = [
  ["品質", "サービスや清掃の品質に\nばらつきがある"],
  ["人材", "採用と入社後の教育が\nつながっていない"],
  ["生産性", "人員配置や部門間の連携を\n見直したい"],
  ["販売", "Web・OTA・営業が\n宿泊収益につながらない"],
  ["システム定着", "導入したシステムを\n現場で使い切れていない"],
];
const ownerSupport = [
  ["経営・収益", "経営診断 × 収益改善", "原因と優先順位"],
  ["開業・再建", "開業支援 × 運営体制", "運営モデル"],
  ["GM不在", "GM機能 × 現場運営", "権限と実行体制"],
  ["投資判断", "経営判断 × DX・IT", "投資対象と実行条件"],
];
const gmSupport = [
  [
    "一部門の品質・\n生産性を整える",
    "宿泊部門運営支援／レストラン運営改善\n客室清掃改善／必要に応じて採用支援",
    "標準業務手順（SOP）\n教育・検品の仕組み",
  ],
  [
    "販売・業務・ITを\nつなぎ直す",
    "Web集客・チャネル収益／宿泊営業支援\nDX・システム導入",
    "管理指標（KPI）\n部門間会議・運用設計",
  ],
  [
    "経営判断が必要な\n課題を進める",
    "経営診断・コンサル／\n経営改善・実行支援",
    "優先順位・改善計画\n判断権限・実行範囲",
  ],
];
const steps = ["課題把握", "判断", "実行・実装", "運用", "検証", "引継ぎ"];
const verification = [
  ["担当範囲", "誰が、どこまで\n担うか"],
  ["成果物", "現場で使う手順・\n管理指標は何か"],
  ["意思決定記録", "何を根拠に、\n何を決めたか"],
  ["検証・引継ぎ方法", "何で確かめ、\n誰へ引き継ぐか"],
];

function Lines({ children }: { children: string }) {
  return children.split("\n").map((line, i) => (
    <span className={styles.line} key={i}>
      {line.split("／").map((part, index) => (
        <span key={index}>
          {index > 0 && (
            <>
              ／<MobileBreak />
            </>
          )}
          {part}
        </span>
      ))}
    </span>
  ));
}
function MobileBreak() {
  return <br className={styles.mobileOnly} />;
}
function Arrow() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      →
    </span>
  );
}
export function Action({
  children = "問い合わせを送信",
  href = "/contact",
  outline = false,
  className = "",
}: {
  children?: ReactNode;
  href?: string;
  outline?: boolean;
  className?: string;
}) {
  return (
    <Link
      prefetch={false}
      href={href}
      className={`${styles.action} ${outline ? styles.outline : ""} ${className}`}
    >
      {children}
      <Arrow />
    </Link>
  );
}
function Chapter({ number, children }: { number: string; children?: ReactNode }) {
  return (
    <p className={styles.chapter}>
      <span>{number}</span>
      {children && (
        <>
          <span className={styles.slash}>/</span>
          {children}
        </>
      )}
      <i data-rule aria-hidden="true" />
    </p>
  );
}
function Photo({
  src,
  mobile,
  className = "",
  hero = false,
  motion = false,
  panorama = false,
  sizes = "100vw",
}: {
  src: string;
  mobile?: string;
  className?: string;
  hero?: boolean;
  motion?: boolean;
  panorama?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={`${styles.photo} ${className}`}
      data-photo={motion ? "reveal" : undefined}
      data-panorama={panorama || undefined}
    >
      <picture>
        {/* The portrait master is only worth its bytes on a phone, and only at
            the width that phone actually paints. */}
        {mobile && (
          <source
            media="(max-width: 599px)"
            srcSet={`${media + mobile.replace(".webp", "-780.webp")} 780w, ${media + mobile} 941w`}
            sizes="100vw"
          />
        )}
        {/* Native generated photographs, responsive delivery and reserved slot bounds. */}
        <img
          src={media + src}
          srcSet={`${media + src.replace(".webp", "-840.webp")} 840w, ${media + src} 1672w`}
          sizes={sizes}
          alt=""
          width={1672}
          height={941}
          loading={hero ? "eager" : "lazy"}
          fetchPriority={hero ? "high" : "auto"}
          decoding="async"
        />
      </picture>
    </div>
  );
}

function Hero({ owner }: { owner: boolean }) {
  return (
    <section
      className={styles.hero}
      aria-labelledby="audience-title"
      data-section="hero"
    >
      {owner ? (
        <Photo
          src={photos.ownerHero}
          mobile="exterior-mobile.webp"
          className={styles.heroPhoto}
          hero
        />
      ) : (
        <Photo
          src={photos.gmHero}
          mobile={photos.gmHeroMobile}
          className={styles.heroPhoto}
          hero
        />
      )}
      <div className={styles.heroScrim} aria-hidden="true" />
      <nav className={styles.breadcrumb} aria-label="パンくず">
        <Link prefetch={false} href="/">
          HOME
        </Link>
        <span aria-hidden="true"> / </span>
        <Link prefetch={false} href="/challenges">
          課題から探す
        </Link>
      </nav>
      <p className={styles.audienceLabel}>
        {owner ? "オーナー・経営者の方へ" : "総支配人・現場責任者の方へ"}
      </p>
      <div className={styles.heroMessage}>
        <h1 id="audience-title">
          {owner ? (
            <>
              経営判断を、
              <br />
              実行可能な
              <MobileBreak />
              改善計画へ。
            </>
          ) : (
            <>
              現場の課題を、
              <br />
              続けられる改善へ。
            </>
          )}
        </h1>
        <p className={styles.heroBody}>
          {owner ? (
            <>
              ホテル・旅館の経営と現場を、
              <MobileBreak />
              一つの改善計画につなぐ。
            </>
          ) : (
            <>
              ADELVAは、ホテル・旅館の
              <MobileBreak />
              経営実装パートナー。
              <br />
              現場運営・人材・販売・ITを、
              <MobileBreak />
              一つの改善計画につなぎます。
            </>
          )}
        </p>
        <Action />
      </div>
      <div className={styles.monument} aria-hidden="true" data-monument>
        {owner ? (
          <>
            <span>OWNERS</span>
            <span>&amp; EXECUTIVES</span>
          </>
        ) : (
          <>
            <span>GENERAL</span>
            <span>MANAGERS</span>
          </>
        )}
      </div>
      <Link
        prefetch={false}
        href="#challenges"
        className={styles.scrollCue}
        aria-label="課題を見る"
      >
        <span>SCROLL</span>
        <i aria-hidden="true" />
      </Link>
    </section>
  );
}

function Challenges({ owner }: { owner: boolean }) {
  const issues = owner ? ownerIssues : gmIssues;
  return (
    <section
      className={styles.challenges}
      id="challenges"
      data-section="challenges"
      aria-labelledby="challenges-title"
    >
      {owner && (
        <Photo
          src={photos.ownerDecision}
          className={styles.challengePhoto}
          sizes="(min-width: 1100px) 28vw, 100vw"
        />
      )}
      <Chapter number="01">{owner ? undefined : "現場課題"}</Chapter>
      <div className={styles.challengeIntro}>
        <h2 id="challenges-title">
          {owner ? (
            <>
              いま、どの経営局面に
              <br />
              ありますか。
            </>
          ) : (
            <>
              いま、現場のどこで
              <br />
              つまずいていますか。
            </>
          )}
        </h2>
        {!owner && (
          <p>
            宿泊・料飲・清掃から、
            <MobileBreak />
            採用、販売、ITまで。
            <br />
            目に見える困りごとを起点に、
            <br />
            部門をまたぐ原因と
            <MobileBreak />
            改善の優先順位を整理します。
          </p>
        )}
      </div>
      <ul className={styles.issueList}>
        {issues.map(([title, description], i) => (
          <li key={title}>
            <Link
              prefetch={false}
              className={styles.issue}
              href={`#support-${owner ? i + 1 : [1, 1, 1, 2, 2][i]}`}
            >
              <span className={styles.issueNumber}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{title}</h3>
              <p>
                <Lines>{description}</Lines>
              </p>
              <Arrow />
              <i data-rule aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Decisions({ owner }: { owner: boolean }) {
  const criteria = [
    ["現象と原因", "品質・工数・収益などの\n基準値から現状を捉える"],
    ["優先順位と影響範囲", "部門間のつながりを確認し、\n先に取り組む課題を決める"],
    [
      "現場判断と、\nオーナー・本部判断",
      "現場で決められることと、\n経営判断が必要なことを分ける",
    ],
  ];
  return (
    <section
      className={styles.decisions}
      data-section="decisions"
      aria-labelledby="decisions-title"
    >
      {owner ? (
        <Photo
          src={photos.ownerDecision}
          className={styles.decisionPhoto}
          motion
          sizes="(min-width: 1100px) 57vw, 100vw"
        />
      ) : (
        <>
          <Photo
            src={photos.gmDecision}
            className={styles.decisionPhoto}
            motion
            sizes="(min-width: 1100px) 45vw, 100vw"
          />
        </>
      )}
      <div className={styles.decisionContent}>
        <Chapter number="02">{owner ? "判断の整理" : "判断"}</Chapter>
        <h2 id="decisions-title">
          {owner ? (
            <>
              最初に、
              <br />
              決めること。
            </>
          ) : (
            <>
              施策を選ぶ前に、
              <br />
              原因と優先順位を。
            </>
          )}
        </h2>
        {owner && (
          <p className={styles.decisionLead}>
            支援内容を選ぶ前に、
            <MobileBreak />
            判断の論点を整理します。
          </p>
        )}
        <ul className={styles.criteria}>
          {owner
            ? ["原因・優先順位", "運営モデル", "投資対象", "実行責任者"].map(
                (title, i) => (
                  <li key={title}>
                    <span className={styles.criteriaNumber}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3>{title}</h3>
                    <i data-rule aria-hidden="true" />
                  </li>
                ),
              )
            : criteria.map(([title, text]) => (
                <li key={title}>
                  <h3>
                    <Lines>{title}</Lines>
                  </h3>
                  <p>
                    <Lines>{text}</Lines>
                  </p>
                  <i data-rule aria-hidden="true" />
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

function Support({ owner }: { owner: boolean }) {
  const labels = owner
    ? ["経営局面", "支援の組み合わせ", "整理すること"]
    : ["改善の判断", "支援の組み合わせ例", "現場に残すものの例"];
  return (
    <section
      className={styles.support}
      data-section="support"
      aria-labelledby="support-title"
    >
      {!owner && (
        <p className={styles.operations} aria-hidden="true">
          OPERATIONS
        </p>
      )}
      <Chapter number="03">{owner ? "支援の組み合わせ" : "支援と成果物"}</Chapter>
      <h2 id="support-title">
        {owner ? (
          <>
            判断に応じて、
            <br />
            支援を組み合わせる。
          </>
        ) : (
          <>
            必要な支援を、
            <MobileBreak />
            ひとつの改善計画に。
          </>
        )}
      </h2>
      {!owner && (
        <p className={styles.supportLead}>
          一部門の改善から、販売・ITを含む
          <MobileBreak />
          運用の再設計まで。
          <br />
          課題の原因と判断の範囲に応じて、
          <MobileBreak />
          支援を組み合わせます。
        </p>
      )}
      <div className={styles.mappingHead} aria-hidden="true">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <ol className={styles.mapping}>
        {(owner ? ownerSupport : gmSupport).map((row, i) => (
          <li
            id={`support-${i + 1}`}
            tabIndex={-1}
            key={row[0]}
            className={styles.mappingRow}
          >
            {!owner && (
              <p className={styles.mappingNumber}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.mobileOnly}> / 改善の判断</span>
              </p>
            )}
            {row.map((text, j) => (
              <div className={styles.mappingCell} key={j}>
                <span className={styles.mappingLabel}>
                  {!owner && j === 0
                    ? `${String(i + 1).padStart(2, "0")} / ${labels[j]}`
                    : labels[j]}
                </span>
                {j === 0 ? (
                  <h3>
                    <Lines>{text}</Lines>
                  </h3>
                ) : (
                  <p>
                    <Lines>{text}</Lines>
                  </p>
                )}
                {j < 2 && (
                  <i className={styles.connector} data-rule aria-hidden="true" />
                )}
              </div>
            ))}
            <i className={styles.mappingRule} data-rule aria-hidden="true" />
          </li>
        ))}
      </ol>
      <p className={styles.supportNote}>
        {owner ? (
          <>
            <span>
              必要な範囲に応じて、
              <MobileBreak />
              単独の支援も選択できます。
            </span>
            <span>
              診断と実行、GM機能と全面運営、
              <MobileBreak />
              導入支援と開発を区別します。
            </span>
          </>
        ) : (
          <>
            組み合わせと成果物は課題に応じて設計。
            <MobileBreak />
            改善支援・実運営・保守の範囲は、
            <MobileBreak />
            個別に合意します。
          </>
        )}
      </p>
      {!owner && <Photo src={photos.gmDining} className={styles.mobileDining} />}
    </section>
  );
}

function Roles({ owner }: { owner: boolean }) {
  const roles = owner
    ? [
        ["オーナー・経営者", ""],
        ["GM・現場", ""],
        ["ADELVA", ""],
        ["外部関係者", ""],
      ]
    : [
        ["オーナー・本部", "経営・投資の\n判断と承認"],
        ["GM・部門責任者", "現場判断と\n部門間の調整"],
        ["ADELVA", "改善計画の推進\n実行・実装支援"],
        ["外部関係者", "契約に応じた\n専門領域の実施"],
      ];
  return (
    <section
      className={styles.roles}
      data-section="roles"
      aria-labelledby="roles-title"
    >
      <Chapter number="04">{owner ? "責任分界" : "役割"}</Chapter>
      <h2 id="roles-title">
        {owner ? (
          <>
            誰が決め、誰が実行し、
            <br />
            何を残すか。
          </>
        ) : (
          <>
            任せる範囲を、
            <br />
            曖昧にしない。
          </>
        )}
      </h2>
      {!owner && (
        <p className={styles.rolesLead}>
          経営判断と現場の実行をつなぐために。
          <br />
          関係者の役割と、引継ぎ先を整理します。
        </p>
      )}
      <div className={styles.rolesContent}>
        {!owner && <p className={styles.rolesCaption}>役割分担を整理する際の観点</p>}
        <dl className={styles.roleList}>
          {roles.map(([name, description]) => (
            <div key={name}>
              <dt>{name}</dt>
              {description && (
                <dd>
                  <Lines>{description}</Lines>
                </dd>
              )}
              <i data-rule aria-hidden="true" />
            </div>
          ))}
        </dl>
        <p className={styles.rolesAgreement}>
          {owner ? (
            <>
              意思決定・権限・担当範囲・
              <MobileBreak />
              成果物を合意する
            </>
          ) : (
            <>
              判断権限・指揮命令・実行範囲・
              <MobileBreak />
              引継ぎ先を、
              <span className={styles.desktopBreak} />
              お客様・ADELVA・
              <MobileBreak />
              外部関係者で個別に合意します。
            </>
          )}
        </p>
        {owner && (
          <p className={styles.rolesNote}>
            権限・担当範囲・条件は、
            <MobileBreak />
            個別の契約で確認します。
          </p>
        )}
        <div className={styles.crossLink}>
          {!owner && <p>経営・運営体制の検討から始めたい方へ</p>}
          <Link
            prefetch={false}
            href={owner ? "/challenges/general-managers" : "/challenges/owner"}
          >
            {owner ? "総支配人・現場責任者の方へ" : "オーナー・経営者の方へ"}
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Execution({ owner }: { owner: boolean }) {
  return (
    <section
      className={styles.execution}
      data-section="execution"
      aria-labelledby="execution-title"
    >
      {owner ? (
        <Photo src={photos.ownerExecution} className={styles.executionPhoto} />
      ) : (
        <Photo src={photos.gmExecution} className={styles.executionPhoto} />
      )}
      {owner ? (
        <Chapter number="05">実行から引継ぎまで</Chapter>
      ) : (
        <p className={styles.implement} aria-hidden="true">
          IMPLEMENT.
        </p>
      )}
      <h2 id="execution-title">
        {owner ? (
          <>
            経営指標を、
            <br />
            現場の行動へ。
          </>
        ) : (
          <>
            実行から、
            <MobileBreak />
            現場での運用へ。
            <br />
            検証し、引き継ぐ
            <MobileBreak />
            ところまで。
          </>
        )}
      </h2>
      {!owner && (
        <p className={styles.executionLead}>
          宿泊・料飲・清掃、販売、ITの
          <MobileBreak />
          担当をつなぎ、
          <span className={styles.desktopBreak} />
          <MobileBreak />
          支援終了後も、
          <MobileBreak />
          お客様自身が改善を続けられる
          <MobileBreak />
          状態を目指します。
        </p>
      )}
      <div className={styles.process} data-process>
        <i className={styles.processRail} data-process-rail aria-hidden="true" />
        <i
          className={styles.processProgress}
          data-process-progress
          aria-hidden="true"
        />
        <ol aria-label="支援の工程">
          {steps.map((step, i) => (
            <li key={step} data-step={i + 1}>
              <span className={styles.stepNumber}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
              <i data-rule aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
      {!owner && (
        <Action href="/approach" outline className={styles.approachAction}>
          支援の進め方を見る
        </Action>
      )}
    </section>
  );
}

function Verification({ owner }: { owner: boolean }) {
  return (
    <section
      className={styles.verification}
      data-section="verification"
      aria-labelledby="verification-title"
    >
      <Chapter number={owner ? "06" : "05"}>
        {owner ? "検証・引継ぎ" : "確認する内容"}
      </Chapter>
      <h2 id="verification-title">
        {owner ? (
          <>
            確認し、
            <br />
            引き継げる状態へ。
          </>
        ) : (
          <>
            改善の過程を、
            <br />
            確認できる形に。
          </>
        )}
      </h2>
      {owner && (
        <p className={styles.verificationLead}>
          支援終了後も、継続して
          <MobileBreak />
          改善できる状態をつくります。
        </p>
      )}
      <dl className={styles.verificationList}>
        {verification.map(([title, description]) => (
          <div key={title}>
            <i data-tick aria-hidden="true" />
            <dt>{title}</dt>
            {!owner && (
              <dd>
                <Lines>{description}</Lines>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AudiencePage({ audience }: { audience: Audience }) {
  const owner = audience === "owner";
  return (
    <div lang="ja" data-audience-v3={audience}>
      <Link prefetch={false} href="#main-content" className={styles.skip}>
        本文へ移動
      </Link>
      <SiteHeader />
      <div className={`${styles.page} ${owner ? styles.owner : styles.gm}`}>
        <AudienceMotion>
          <main id="main-content">
            <Hero owner={owner} />
            <Challenges owner={owner} />
            <Decisions owner={owner} />
            <Support owner={owner} />
            {!owner && (
              <Photo src={photos.gmDining} className={styles.gmDining} panorama />
            )}
            <Roles owner={owner} />
            <Execution owner={owner} />
            <Verification owner={owner} />
          </main>
        </AudienceMotion>
      </div>
      <HomeFooter />
    </div>
  );
}
