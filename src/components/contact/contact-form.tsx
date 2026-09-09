"use client";

import { useRef, useState, type FormEvent } from "react";
import styles from "./contact.module.css";

type Field = "category" | "name1" | "name2" | "tel" | "email" | "message" | "privacy";
const labels: Record<Field, string> = {
  category: "お問い合わせ種別",
  name1: "姓",
  name2: "名",
  tel: "電話番号",
  email: "メールアドレス",
  message: "お問い合わせ内容",
  privacy: "プライバシーポリシーへの同意",
};

export function ContactForm() {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState(
    "現在フォームは準備中です。入力内容は送信されません。",
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.current) return;
    const data = new FormData(form.current);
    const nextErrors: Partial<Record<Field, string>> = {};
    for (const field of Object.keys(labels) as Field[]) {
      if (!String(data.get(field) ?? "").trim())
        nextErrors[field] = `${labels[field]}を確認してください。`;
    }
    const email = form.current.elements.namedItem("email") as HTMLInputElement;
    if (email.validity.typeMismatch)
      nextErrors.email = "メールアドレスの形式を確認してください。";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("入力内容を確認してください。");
      (
        form.current.elements.namedItem(Object.keys(nextErrors)[0]) as HTMLElement
      )?.focus();
      return;
    }
    setStatus("入力内容を確認しました。現在は画面確認用のため、送信は行われません。");
  }

  const fieldProps = (name: Field) => ({
    id: `contact-${name}`,
    name,
    required: true,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `error-${name}` : undefined,
  });
  const error = (name: Field) =>
    errors[name] ? (
      <p className={styles.error} id={`error-${name}`}>
        {errors[name]}
      </p>
    ) : null;
  const required = (
    <span className={styles.required} aria-hidden="true">
      *
    </span>
  );

  return (
    <form
      ref={form}
      className={styles.form}
      noValidate
      onSubmit={submit}
      aria-label="お問い合わせフォーム"
      data-contact-form
    >
      <div className={styles.field}>
        <label htmlFor="contact-category">お問い合わせ種別{required}</label>
        <select {...fieldProps("category")} defaultValue="">
          <option value="" disabled>
            選択してください
          </option>
          <option>経営・運営統括</option>
          <option>収益・ブランド成長</option>
          <option>DX・IT・調達基盤</option>
          <option>その他</option>
        </select>
        {error("category")}
      </div>
      <div className={styles.field}>
        <label htmlFor="contact-company">会社名</label>
        <input
          id="contact-company"
          name="company"
          autoComplete="organization"
          placeholder="会社名を入力してください"
          maxLength={200}
        />
      </div>
      <fieldset className={`${styles.field} ${styles.names}`}>
        <legend>お名前{required}</legend>
        <div className={styles.nameGrid}>
          <div>
            <label className={styles.srOnly} htmlFor="contact-name1">
              姓
            </label>
            <input
              {...fieldProps("name1")}
              autoComplete="family-name"
              placeholder="姓"
              maxLength={100}
            />
            {error("name1")}
          </div>
          <div>
            <label className={styles.srOnly} htmlFor="contact-name2">
              名
            </label>
            <input
              {...fieldProps("name2")}
              autoComplete="given-name"
              placeholder="名"
              maxLength={100}
            />
            {error("name2")}
          </div>
        </div>
      </fieldset>
      <div className={styles.field}>
        <label htmlFor="contact-tel">電話番号{required}</label>
        <input
          {...fieldProps("tel")}
          type="tel"
          autoComplete="tel"
          placeholder="半角数字（ハイフンなし）"
          maxLength={40}
        />
        {error("tel")}
      </div>
      <div className={styles.field}>
        <label htmlFor="contact-email">メールアドレス{required}</label>
        <input
          {...fieldProps("email")}
          type="email"
          autoComplete="email"
          placeholder="半角英数字"
          maxLength={254}
        />
        {error("email")}
      </div>
      <div className={styles.field}>
        <label htmlFor="contact-message">お問い合わせ内容{required}</label>
        <textarea
          {...fieldProps("message")}
          placeholder="入力してください"
          maxLength={10000}
        />
        {error("message")}
      </div>
      <div className={styles.consent}>
        <label>
          <input {...fieldProps("privacy")} type="checkbox" />
          <span>プライバシーポリシー（準備中）に同意する</span>
        </label>
        {error("privacy")}
      </div>
      <button
        className={styles.send}
        type="button"
        onClick={submit}
        aria-label="問い合わせを送信"
      >
        <span>Send</span>
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="m4 5 17 7-17 7 4-7-4-7Zm4 7h13"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <p className={styles.status} role="status" aria-live="polite">
        {status}
      </p>
      <noscript>
        <p>現在は画面確認用です。入力内容は送信されません。</p>
      </noscript>
    </form>
  );
}
