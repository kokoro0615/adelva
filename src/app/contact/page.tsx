import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { HomeFooter } from "@/components/home/home-footer";
import { ContactForm } from "@/components/contact/contact-form";
import styles from "@/components/contact/contact.module.css";
import "@/components/morght/japanese-font.css";

export const metadata: Metadata = {
  title: { absolute: "お問い合わせ — ADELVA" },
  description: "ホテル・旅館の経営・運営、収益・ブランド、DX・ITに関するお問い合わせ。",
};
export default function ContactPage() {
  return (
    <div className={styles.page} lang="ja">
      <a className="skip-link" data-skip-link href="#main-content">
        本文へ移動
      </a>
      <SiteHeader />
      <main id="main-content" className={styles.main} data-contact-page>
        <header className={styles.heading} data-contact-heading>
          <h1>
            <span lang="en">Contact</span>
            <span>お問い合わせ</span>
          </h1>
        </header>
        <section
          className={styles.body}
          aria-label="お問い合わせの入力"
          data-contact-body
        >
          <p className={styles.intro}>
            下記のフォームに入力いただき、プライバシーポリシーに同意のうえ送信ください。
            <br />
            後日、担当者から返信いたします。
          </p>
          <p className={styles.note}>
            <span className={styles.required}>*</span>は必須項目です。
          </p>
          <ContactForm />
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
