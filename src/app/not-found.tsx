import type { Metadata } from "next";
import Link from "next/link";

import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: true },
};

const links = [
  { href: "/", label: "HOMEへ" },
  { href: "/challenges", label: "課題から探す" },
  { href: "/approach", label: "支援の進め方" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export default function NotFound() {
  return (
    <section className={styles.section} aria-labelledby="page-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>404 NOT FOUND</p>
        <h1 className={styles.title} id="page-title">
          ページが見つかりません
        </h1>
        <p className={styles.lead}>
          お探しのページは見つかりませんでした。アドレスが変わったか、ページが移動した可能性があります。
        </p>
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.href}>
              <Link className={styles.link} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
