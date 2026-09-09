"use client";

import Link from "next/link";

import { useEffect, useRef } from "react";
import {
  aboutLinks,
  audiences,
  challenges,
  primaryNavigation,
  serviceDomains,
} from "@/content/adelva-navigation";
import styles from "./audience.module.css";

const menus = {
  challenges: [...audiences, ...challenges],
  services: serviceDomains,
  about: aboutLinks,
};

/** Native disclosures remain usable without hydration; only one is open at once. */
export function AudienceHeader({ owner }: { owner: boolean }) {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = header.current;
    if (!root) return;
    const close = (restore = false) => {
      root.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
        details.open = false;
        details.querySelector("summary")?.setAttribute("aria-expanded", "false");
        if (restore) details.querySelector("summary")?.focus();
      });
    };
    const toggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement)) return;
      details
        .querySelector("summary")
        ?.setAttribute("aria-expanded", String(details.open));
      if (details.open)
        root.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((other) => {
          if (other !== details) other.open = false;
        });
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) close();
    };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) close();
    };
    const link = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) close();
    };
    root.addEventListener("toggle", toggle, true);
    root.addEventListener("click", link);
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focus);
    const query = matchMedia("(min-width: 1100px)");
    const resize = () => close();
    query.addEventListener("change", resize);
    return () => {
      root.removeEventListener("toggle", toggle, true);
      root.removeEventListener("click", link);
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", focus);
      query.removeEventListener("change", resize);
    };
  }, []);
  return (
    <header ref={header} className={styles.header}>
      <Link
        prefetch={false}
        href="/"
        className={styles.headerBrand}
        aria-label="ADELVA ホーム"
      >
        <span className={styles.brandSymbol} aria-hidden="true" />
        <span>ADELVA</span>
      </Link>
      <nav className={styles.desktopNav} aria-label="メインナビゲーション">
        {primaryNavigation.map((item) =>
          item.kind === "link" ? (
            <Link prefetch={false} key={item.href} href={item.href}>
              {item.label}
            </Link>
          ) : (
            <details key={item.menu}>
              <summary>
                {item.label}
                <span aria-hidden="true">⌄</span>
              </summary>
              <ul className={styles.dropdown}>
                {menus[item.menu].map((link) => (
                  <li key={link.href}>
                    <Link prefetch={false} href={link.href}>
                      {link.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ),
        )}
      </nav>
      <Link
        prefetch={false}
        className={`${styles.action} ${styles.outline} ${styles.headerAction}`}
        href="/contact"
      >
        問い合わせを送信
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </Link>
      <details className={styles.mobileMenu}>
        <summary aria-label="メニュー">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/media/adelva/audience-v3/${owner ? "189-358" : "189-870"}-imgIconMenu.svg`}
            width={24}
            height={24}
            alt=""
          />
        </summary>
        <nav className={styles.mobileMenuPanel} aria-label="メインナビゲーション">
          <Link prefetch={false} href="/challenges">
            課題から探す
          </Link>
          {audiences.map((item) => (
            <Link prefetch={false} key={item.href} href={item.href}>
              {item.label}
              <span aria-hidden="true">→</span>
            </Link>
          ))}
          {primaryNavigation
            .filter((item) => item.label !== "課題から探す")
            .map((item) => (
              <Link
                prefetch={false}
                key={item.label}
                href={
                  item.kind === "link"
                    ? item.href
                    : item.menu === "services"
                      ? "/services"
                      : "/about"
                }
              >
                {item.label}
              </Link>
            ))}
          <Link prefetch={false} href="/contact">
            問い合わせを送信<span aria-hidden="true">→</span>
          </Link>
        </nav>
      </details>
    </header>
  );
}
