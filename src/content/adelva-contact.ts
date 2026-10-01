/**
 * /contact copy and geometry — docs/specs/adelva-contact-spec.md.
 *
 * Every string is listed in spec §5 with its approval status. Challenge and
 * domain labels come from the navigation module, which carries the approved
 * source wording; nothing here restates them.
 */
import { serviceDomains } from "@/content/adelva-navigation";

export const hero = {
  eyebrow: "お問い合わせ",
  eyebrowEn: "CONTACT",
  /** Desktop lines; mobile breaks at the phrase boundaries below. */
  title: ["課題が整理できていなくても、", "お問い合わせいただけます。"],
  titleMobile: ["課題が整理", "できていなくても、", "お問い合わせ", "いただけます。"],
  scroll: "SCROLL",
} as const;

export interface ChallengeOption {
  readonly id: string;
  readonly label: string;
  /** Index into `serviceDomains`; absent for 「まだ整理できていない」. */
  readonly domain?: number;
}

export const undecidedOption: ChallengeOption = {
  id: "undecided",
  label: "まだ整理できていない",
};

export const domains = serviceDomains.map((d) => ({
  number: d.number,
  label: d.label,
}));

export const roleOptions = [
  { id: "owner", label: "オーナー・経営者" },
  { id: "general-manager", label: "総支配人・現場責任者" },
  { id: "other", label: "その他" },
] as const;

export const questions = {
  challenge: {
    number: "01",
    ask: "近いものを選んでください。いくつでも選べます。",
    askMobile: ["近いものを選んでください。", "いくつでも選べます。"],
    related: "関連する支援領域",
  },
  role: { number: "02", ask: "ご立場を教えてください。" },
  message: {
    number: "03",
    ask: "ご相談したいことを、自由にお書きください。",
    askMobile: ["ご相談したいことを、", "自由にお書きください。"],
    help: "箇条書きや、思いつく順でもかまいません。",
  },
  contact: { number: "04", ask: "ご連絡先を教えてください。" },
} as const;

export const fields = {
  company: { label: "会社名・施設名", optional: "任意" },
  name: { label: "お名前" },
  email: { label: "メールアドレス" },
  tel: { label: "電話番号" },
} as const;

export const progressLabels = ["課題", "ご立場", "ご相談内容", "ご連絡先"] as const;

export const summary = { label: "ご相談の概要" } as const;

export const consent = {
  link: "プライバシーポリシー",
  rest: "に同意する",
  newTab: "（新しいタブで開きます）",
  href: "/privacy",
} as const;

export const send = {
  label: "問い合わせを送信",
  sending: "送信中…",
} as const;

export const messages = {
  challenge: "近いものを選んでください。",
  role: "ご立場を選んでください。",
  message: "ご相談内容を入力してください。",
  name: "お名前を入力してください。",
  email: "メールアドレスを入力してください。",
  emailFormat: "メールアドレスの形式を確認してください。",
  tel: "電話番号を入力してください。",
  telFormat: "電話番号の形式を確認してください。",
  consent: "プライバシーポリシーに同意してください。",
  summary: "入力内容を確認してください。",
  failed:
    "送信できませんでした。入力内容はそのまま残っています。時間をおいて、もう一度お試しください。",
  unavailable: "現在フォームは準備中です。入力内容は送信されません。",
} as const;

export const after = {
  title: "送信後の流れ",
  thanksTitle: "お問い合わせを受け付けました",
  steps: ["問い合わせを送信", "内容の確認", "担当者からのご連絡", "課題把握"],
  link: { label: "支援の進め方を見る", href: "/approach" },
} as const;

export const notes = [
  {
    title: "このフォームについて",
    body: [
      "新しいご相談の受付窓口です。",
      "緊急の障害対応やサポートの窓口ではありません。",
    ],
  },
  {
    title: "個人情報の取り扱い",
    body: ["入力いただいた内容は、", "お問い合わせへの回答に使用します。"],
    link: { label: "プライバシーポリシー", href: "/privacy" },
  },
] as const;

/**
 * Photo-anchored geometry (spec §6). Desktop values are CSS px on the 1440
 * page (the plate at ×0.9375); mobile values are CSS px on the 390 page.
 */
export const geometry = {
  desktop: {
    width: 1440,
    height: 5760,
    intro: 406,
    q01: 406,
    q02: 1040,
    q03: 1640,
    q04: 2470,
    after: 4096,
    notes: 4640,
    stones: [
      [323, 4318],
      [581, 4288],
      [858, 4290],
      [1137, 4320],
    ],
    stepLabelDy: 64,
    afterLink: 4536,
    /** "Fog lifted" variants: plate tile index and its top on the page. */
    clears: [
      { tile: 0, top: 0 },
      { tile: 1, top: 720 },
      { tile: 4, top: 2880 },
    ],
    clearHeight: 960,
    tiles: 8,
    /** Where /contact/thanks starts inside the photograph. */
    thanksFrom: 3860,
  },
  mobile: {
    width: 390,
    height: 5925,
    intro: 372,
    q01: 372,
    bar: 1030,
    q02: 1130,
    q03: 1640,
    q04: 2250,
    after: 3925,
    notes: 4560,
    stones: [
      [149, 4052],
      [262, 4115],
      [143, 4190],
      [269, 4270],
    ],
    /** Half width of each stone's top face; labels start past it. */
    stoneHalf: [56, 61, 63, 68],
    afterLink: 4360,
    clears: [
      { tile: 1, top: 0 },
      { tile: 2, top: 726.04 },
      { tile: 4, top: 2178.12 },
      { tile: 5, top: 2904.16 },
    ],
    clearHeight: 843.1,
    tiles: 10,
    thanksFrom: 3730,
  },
} as const;
