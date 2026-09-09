import {
  aboutLinks,
  audiences,
  contactCta,
  groupLabels,
  routeStatusOf,
  serviceDomains,
} from "@/content/adelva-navigation";

import styles from "./home-footer.module.css";
import { FooterTopLink } from "./footer-top-link";

const groups = [
  { title: groupLabels.audiences, links: audiences },
  { title: groupLabels.domains, links: serviceDomains },
  { title: "ADELVAについて", links: aboutLinks },
];

function Arrow() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 40 39 9M11 9h28v28" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function HomeFooter() {
  return (
    <footer
      className={styles.footer}
      lang="ja"
      aria-label="ADELVA"
      data-home-footer="adelva-2026-09-09"
      data-site-footer
      data-fidelity-landmark="footer"
    >
      <picture className={styles.landscape}>
        <source
          media="(max-width: 599px)"
          srcSet="/media/adelva/home-footer/mobile.webp"
        />
        {/* Art-directed decorative plate; the HTML remains independent of it. */}
        <img
          src="/media/adelva/home-footer/desktop.webp"
          width="1435"
          height="1096"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>

      <div className={styles.content}>
        <div className={styles.contact}>
          <a
            href={contactCta.href}
            data-route-status={routeStatusOf(contactCta.href)}
            className={styles.contactLink}
            aria-label={contactCta.label}
          >
            <h2 lang="en" className={styles.heading}>
              <span>Start with a</span> <span>conversation</span>
            </h2>
            <span className={styles.contactLabel}>{contactCta.label}</span>
            <span className={styles.contactCircle}>
              <Arrow />
            </span>
          </a>
        </div>

        <nav className={styles.directory} aria-label="フッターナビゲーション">
          {groups.map((group, index) => (
            <section key={group.title} aria-labelledby={`footer-group-${index}`}>
              <h3 id={`footer-group-${index}`}>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} data-route-status={routeStatusOf(link.href)}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className={styles.wordmark} role="img" aria-label="ADELVA" lang="en">
          {Array.from("ADELVA", (letter, index) => (
            <span key={index} aria-hidden="true">
              {letter}
            </span>
          ))}
        </div>
        <div className={styles.bottom}>
          <span lang="en">ADELVA</span>
          <FooterTopLink>
            <Arrow />
          </FooterTopLink>
        </div>
      </div>
    </footer>
  );
}
