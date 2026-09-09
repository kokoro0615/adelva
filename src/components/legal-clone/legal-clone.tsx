import Image from "next/image";

import type { LegalTargetDocument } from "@/content/legal-target";

import styles from "./legal-clone.module.css";

interface LegalCloneProps {
  readonly document: LegalTargetDocument;
}

/**
 * Render one of the authorized White Desert legal documents.
 *
 * `bodyHtml` is a checked-in, static extraction of the target's rich-text
 * document. It is not user input and is intentionally kept as HTML so the
 * target's authored heading, list, line-break, emphasis, and link structure
 * remain intact.
 *
 * The public target places a second h1 inside the document. The application
 * shell already supplies the page-level title in the banner, so those source
 * h1s are represented as marked h2s here. This keeps one accessible h1 while
 * preserving the document's visual hierarchy and exact text.
 */
export function LegalClone({ document }: LegalCloneProps) {
  const semanticBodyHtml = document.bodyHtml
    .replaceAll("<h1>", '<h2 data-legal-document-heading="true">')
    .replaceAll("</h1>", "</h2>")
    // Chromium gives a flex-item <br> a 20px minimum line box on the local
    // build, while the target's desktop layout resolves the same separator to
    // 19px. A one-for-one hidden span keeps the authored separation and lets
    // the measured responsive block size be expressed deterministically.
    .replaceAll("<br>", '<span data-legal-break="true" aria-hidden="true"></span>')
    // The target uses an h4 directly below an h2. Keep its visible tag and
    // typography, but expose the intervening level to assistive technology.
    .replaceAll("<h4>", '<h4 aria-level="3">');

  return (
    <div
      className={`${styles.root} page-content`}
      data-legal-clone
      data-legal-document={document.slug}
    >
      <div className={`${styles.bannerLoader} fixed-banner-loader`}>
        <div className={`${styles.bannerBackground} fixed-banner_bg`}>
          <Image
            className={styles.bannerImage}
            src="/media/target/legal/WhiteDesertAntarcticaPeaks.webp"
            alt="Enquiry page banner background image"
            fill
            priority
            sizes="100vw"
          />
          <div className={`${styles.bannerOverlay} dim`} aria-hidden="true" />
        </div>
        <div
          className={`${styles.banner} fixed-banner`}
          data-legal-banner
          data-fidelity-landmark="hero"
          role="region"
          aria-labelledby={`legal-banner-title-${document.slug}`}
        >
          <div className={`${styles.bannerContent} fixed-banner_content`}>
            <div className="fixed-banner_inner fixed-banner_inner--large">
              <h1 id={`legal-banner-title-${document.slug}`} className="is-capital">
                {document.bannerTitle}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <section
        className={`${styles.documentSection} padding-medium bg-lighter-grey above-grid has-inset-effect`}
        data-legal-document-section
        data-fidelity-landmark="primary-content"
        aria-label={`${document.bannerTitle} document`}
      >
        <div className={`${styles.documentContainer} container-small container-legal`}>
          <div className={`${styles.documentGrid} u-grid`}>
            <article
              className={`${styles.article} col-8 offset-2 global-richtext`}
              dangerouslySetInnerHTML={{ __html: semanticBodyHtml }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
